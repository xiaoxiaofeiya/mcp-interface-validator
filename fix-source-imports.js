#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImportsInSourceFile(filePath) {
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
            const indexPath = path.join(fullPath, 'index.ts');
            const directPath = fullPath + '.ts';
            
            let newImportPath;
            if (fs.existsSync(indexPath)) {
                // It's a directory with index.ts
                newImportPath = importPath + '/index.js';
            } else if (fs.existsSync(directPath)) {
                // It's a file, add .js extension
                newImportPath = importPath + '.js';
            } else {
                // Default to .js extension
                newImportPath = importPath + '.js';
            }
            
            modified = true;
            return match.replace(importPath, newImportPath);
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed source imports in: ${filePath}`);
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
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            fixImportsInSourceFile(fullPath);
        }
    }
}

// Start from src directory
const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
    console.log('Fixing ES module imports in source directory...');
    walkDirectory(srcDir);
    console.log('Source import fixing completed!');
} else {
    console.error('Source directory not found!');
}
