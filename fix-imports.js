#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImportsInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Fix relative imports that don't have .js extension
        const importRegex = /from\s+['"](\.[^'"]*?)['"];?/g;
        content = content.replace(importRegex, (match, importPath) => {
            // Skip if already has .js extension
            if (importPath.endsWith('.js')) {
                return match;
            }

            // Skip if not a relative path
            if (!importPath.startsWith('.')) {
                return match;
            }

            // Check if the path points to a directory that should have /index.js
            const fullPath = path.resolve(path.dirname(filePath), importPath);
            const indexPath = path.join(fullPath, 'index.js');

            let newImportPath;
            if (fs.existsSync(indexPath)) {
                // It's a directory with index.js
                newImportPath = importPath + '/index.js';
            } else {
                // It's a file, add .js extension
                newImportPath = importPath + '.js';
            }

            modified = true;
            return match.replace(importPath, newImportPath);
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed imports in: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

function walkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            walkDirectory(fullPath);
        } else if (file.endsWith('.js')) {
            fixImportsInFile(fullPath);
        }
    }
}

// Start from build directory
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
    console.log('Fixing ES module imports in build directory...');
    walkDirectory(buildDir);
    console.log('Import fixing completed!');
} else {
    console.error('Build directory not found!');
}
