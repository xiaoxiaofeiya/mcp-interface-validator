#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixSpecificImports(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Fix specific problematic imports
        const fixes = [
            {
                from: "from '../intelligent-context.js'",
                to: "from '../intelligent-context/index.js'"
            },
            {
                from: "from '../intelligent-context'",
                to: "from '../intelligent-context/index.js'"
            },
            {
                from: "from './intelligent-context.js'",
                to: "from './intelligent-context/index.js'"
            },
            {
                from: "from './intelligent-context'",
                to: "from './intelligent-context/index.js'"
            }
        ];

        for (const fix of fixes) {
            if (content.includes(fix.from)) {
                content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed specific imports in: ${filePath}`);
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
            fixSpecificImports(fullPath);
        }
    }
}

// Start from build directory
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
    console.log('Fixing specific import issues in build directory...');
    walkDirectory(buildDir);
    console.log('Specific import fixing completed!');
} else {
    console.error('Build directory not found!');
}
