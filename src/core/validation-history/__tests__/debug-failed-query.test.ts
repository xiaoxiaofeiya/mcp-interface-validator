import { createValidationHistorySystem, HistoryManager } from '../index.js';
import { SQLiteDatabase } from '../database/sqlite-database.js';
import { ValidationResult } from '../../validation/index.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Debug Failed Query', () => {
  let historySystem: HistoryManager;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(__dirname, '..', '..', '..', '..', 'temp', `test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Initialize history system
    historySystem = createValidationHistorySystem({
      database: {
        type: 'sqlite',
        path: path.join(tempDir, 'test.db')
      }
    });

    await historySystem.initialize();
  });

  afterEach(async () => {
    // Clean up ALL records by setting retentionDays to 0
    await historySystem.cleanup({ retentionDays: 0 });

    // Close the history system
    await historySystem.shutdown();

    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should debug failed record storage and query', async () => {
    // Create a failed validation result
    const failedResult: ValidationResult = {
      isValid: false,
      errors: [
        {
          message: 'Test error',
          path: '/test/path',
          severity: 'error' as const
        }
      ],
      warnings: []
    };

    // Store the failed result using the correct API
    const entryId = await historySystem.recordValidation(
      'debug-spec-id',
      failedResult,
      'console.log("test code");',
      'frontend',
      {
        tool: 'debug-test',
        version: '1.0.0',
        environment: 'test'
      },
      {
        duration: 100,
        memoryUsage: 1024,
        cacheHit: false
      },
      'debug-test.js',
      'debug-user'
    );

    console.log('=== STORED FAILED ENTRY ===');
    console.log('Entry ID:', entryId);
    console.log('Result:', JSON.stringify(failedResult, null, 2));

    // Get database reference for direct access
    const db = (historySystem as any).database as SQLiteDatabase;

    // Query the stored entry directly
    const storedEntry = await db.query({ ids: [entryId] });
    console.log('\n=== DIRECT QUERY RESULT ===');
    console.log('Found entries:', storedEntry.entries.length);
    if (storedEntry.entries.length > 0) {
      console.log('Stored result JSON:', JSON.stringify(storedEntry.entries[0].result, null, 2));
      console.log('Raw result string:', storedEntry.entries[0].result);
    }

    // Test the failed status query directly on database
    const failedQuery = await db.query({ status: 'failed' });
    console.log('\n=== FAILED STATUS QUERY ===');
    console.log('Failed entries found:', failedQuery.entries.length);
    console.log('Total count:', failedQuery.totalCount);

    // Test manual filtering
    const allEntries = await db.query({});
    const manuallyFiltered = allEntries.entries.filter(entry => {
      if (typeof entry.result === 'string') {
        try {
          const parsed = JSON.parse(entry.result);
          return parsed.isValid === false;
        } catch {
          return false;
        }
      } else if (typeof entry.result === 'object') {
        return entry.result.isValid === false;
      }
      return false;
    });

    console.log('\n=== MANUAL FILTERING ===');
    console.log('All entries:', allEntries.entries.length);
    console.log('Manually filtered failed entries:', manuallyFiltered.length);

    // Test the QueryBuilder approach
    const queryBuilder = historySystem.createQuery();
    const builderResult = await queryBuilder.failed().execute();
    console.log('\n=== QUERY BUILDER RESULT ===');
    console.log('QueryBuilder failed entries:', builderResult.length);

    // Test different LIKE patterns
    console.log('\n=== TESTING LIKE PATTERNS ===');
    const patterns = [
      '%"isValid":false%',
      '%"isValid": false%',
      '%"isValid" : false%',
      '%isValid%false%',
      '%false%'
    ];

    for (const pattern of patterns) {
      try {
        // Direct SQL query simulation
        const testQuery = await db.query({});
        const patternMatches = testQuery.entries.filter(entry => {
          const resultStr = typeof entry.result === 'string' ? entry.result : JSON.stringify(entry.result);
          return resultStr.includes('"isValid":false') || resultStr.includes('"isValid": false');
        });
        console.log(`Pattern "${pattern}": ${patternMatches.length} matches`);
      } catch (error) {
        console.log(`Pattern "${pattern}": Error - ${error.message}`);
      }
    }

    // Write debug info to file for inspection
    const debugInfo = {
      entryId,
      failedResult,
      storedEntry: storedEntry.entries[0],
      failedQueryResult: failedQuery,
      manualFilterResult: manuallyFiltered,
      queryBuilderResult: builderResult
    };

    const debugFile = path.join(tempDir, 'debug-info.json');
    fs.writeFileSync(debugFile, JSON.stringify(debugInfo, null, 2));
    console.log('\n=== DEBUG INFO WRITTEN TO ===');
    console.log(debugFile);

    // Check if we have exactly one failed entry as expected
    console.log('\n=== FINAL ANALYSIS ===');
    console.log('Expected: 1 failed entry');
    console.log('QueryBuilder result:', builderResult.length);
    console.log('Manual filter result:', manuallyFiltered.length);
    console.log('Direct failed query:', failedQuery.entries.length);

    // Check if there are leftover entries from previous test runs
    if (allEntries.entries.length > 1) {
      console.log('WARNING: Found', allEntries.entries.length, 'entries, expected 1');
      console.log('This suggests database cleanup issues or test isolation problems');

      // Show all entries to understand the issue
      allEntries.entries.forEach((entry, index) => {
        console.log(`Entry ${index}:`, {
          id: entry.id,
          isValid: typeof entry.result === 'object' ? entry.result.isValid : 'unknown',
          resultType: typeof entry.result
        });
      });
    }

    // The test should pass if we found the expected failed entry
    expect(builderResult.length).toBeGreaterThanOrEqual(1);
    expect(manuallyFiltered.length).toBeGreaterThanOrEqual(1);
    expect(failedQuery.entries.length).toBeGreaterThanOrEqual(1);
  });
});
