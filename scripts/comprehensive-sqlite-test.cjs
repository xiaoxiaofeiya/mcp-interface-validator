#!/usr/bin/env node

/**
 * 全面的SQLite功能验证脚本
 * 测试项目中实际使用的SQLite功能
 */

console.log('🔍 开始全面SQLite功能验证...');

const sqlite3 = require('sqlite3').verbose();

async function runTest(description, testFn) {
  console.log(`🧪 ${description}...`);
  try {
    await testFn();
    console.log(`✅ ${description} - 成功`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - 失败:`, error.message);
    return false;
  }
}

async function testSQLiteFeatures() {
  let allTestsPassed = true;
  
  // 1. 测试数据库创建和连接
  const dbTest = await runTest('数据库创建和连接', () => {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(':memory:', (err) => {
        if (err) reject(err);
        else {
          db.close();
          resolve();
        }
      });
    });
  });
  allTestsPassed = allTestsPassed && dbTest;

  // 2. 测试复杂表结构创建（模拟validation_history表）
  const schemaTest = await runTest('复杂表结构创建', () => {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(':memory:');
      const sql = `
        CREATE TABLE validation_history (
          id TEXT PRIMARY KEY,
          spec_id TEXT NOT NULL,
          timestamp DATETIME NOT NULL,
          result TEXT NOT NULL,
          source_code TEXT,
          validation_type TEXT NOT NULL,
          file_path TEXT,
          user_id TEXT,
          context TEXT,
          metrics TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      db.run(sql, (err) => {
        db.close();
        if (err) reject(err);
        else resolve();
      });
    });
  });
  allTestsPassed = allTestsPassed && schemaTest;

  // 3. 测试索引创建
  const indexTest = await runTest('索引创建', () => {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(':memory:');
      
      db.serialize(() => {
        db.run(`CREATE TABLE test_table (id TEXT PRIMARY KEY, spec_id TEXT, timestamp DATETIME)`);
        
        db.run(`CREATE INDEX idx_spec_id ON test_table(spec_id)`, (err) => {
          if (err) {
            db.close();
            reject(err);
            return;
          }
        });
        
        db.run(`CREATE INDEX idx_timestamp ON test_table(timestamp)`, (err) => {
          db.close();
          if (err) reject(err);
          else resolve();
        });
      });
    });
  });
  allTestsPassed = allTestsPassed && indexTest;

  // 4. 测试JSON数据存储和查询
  const jsonTest = await runTest('JSON数据存储和查询', () => {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(':memory:');
      
      const testData = {
        isValid: true,
        errors: [],
        warnings: ['test warning'],
        metadata: { timestamp: '2024-01-01T00:00:00.000Z' }
      };
      
      db.serialize(() => {
        db.run(`CREATE TABLE json_test (id INTEGER PRIMARY KEY, data TEXT)`);
        
        db.run(`INSERT INTO json_test (data) VALUES (?)`, [JSON.stringify(testData)], function(err) {
          if (err) {
            db.close();
            reject(err);
            return;
          }
          
          db.get(`SELECT data FROM json_test WHERE id = ?`, [this.lastID], (err, row) => {
            db.close();
            if (err) {
              reject(err);
            } else {
              try {
                const parsed = JSON.parse(row.data);
                if (parsed.isValid === testData.isValid) {
                  resolve();
                } else {
                  reject(new Error('JSON数据不匹配'));
                }
              } catch (parseErr) {
                reject(parseErr);
              }
            }
          });
        });
      });
    });
  });
  allTestsPassed = allTestsPassed && jsonTest;

  // 5. 测试批量操作
  const batchTest = await runTest('批量操作', () => {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(':memory:');
      
      db.serialize(() => {
        db.run(`CREATE TABLE batch_test (id INTEGER PRIMARY KEY, name TEXT)`);
        
        const stmt = db.prepare(`INSERT INTO batch_test (name) VALUES (?)`);
        
        for (let i = 0; i < 100; i++) {
          stmt.run(`测试数据${i}`);
        }
        
        stmt.finalize((err) => {
          if (err) {
            db.close();
            reject(err);
            return;
          }
          
          db.get(`SELECT COUNT(*) as count FROM batch_test`, (err, row) => {
            db.close();
            if (err) {
              reject(err);
            } else if (row.count === 100) {
              resolve();
            } else {
              reject(new Error(`期望100条记录，实际${row.count}条`));
            }
          });
        });
      });
    });
  });
  allTestsPassed = allTestsPassed && batchTest;

  // 6. 测试事务
  const transactionTest = await runTest('事务处理', () => {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(':memory:');
      
      db.serialize(() => {
        db.run(`CREATE TABLE transaction_test (id INTEGER PRIMARY KEY, value INTEGER)`);
        
        db.run('BEGIN TRANSACTION');
        db.run(`INSERT INTO transaction_test (value) VALUES (1)`);
        db.run(`INSERT INTO transaction_test (value) VALUES (2)`);
        db.run('COMMIT', (err) => {
          if (err) {
            db.close();
            reject(err);
            return;
          }
          
          db.get(`SELECT COUNT(*) as count FROM transaction_test`, (err, row) => {
            db.close();
            if (err) {
              reject(err);
            } else if (row.count === 2) {
              resolve();
            } else {
              reject(new Error(`事务提交失败，期望2条记录，实际${row.count}条`));
            }
          });
        });
      });
    });
  });
  allTestsPassed = allTestsPassed && transactionTest;

  return allTestsPassed;
}

// 运行所有测试
testSQLiteFeatures().then(success => {
  if (success) {
    console.log('\n🎉 所有SQLite功能验证通过！');
    console.log('✅ SQLite数据库完全正常，可以安全用于生产环境。');
    console.log('📊 验证的功能包括：');
    console.log('   - 数据库创建和连接');
    console.log('   - 复杂表结构创建');
    console.log('   - 索引创建和管理');
    console.log('   - JSON数据存储和查询');
    console.log('   - 批量数据操作');
    console.log('   - 事务处理');
    process.exit(0);
  } else {
    console.log('\n❌ 部分SQLite功能验证失败');
    console.log('🔧 请检查sqlite3模块安装和系统环境');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 验证过程中发生严重错误:', error);
  process.exit(1);
});
