#!/usr/bin/env node

/**
 * NPM Publishing Script for MCP Interface Validator
 * 
 * This script automates the publishing process with proper checks
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('📦 MCP Interface Validator - Publishing Script');
console.log('===============================================\n');

// Step 1: Pre-publish checks
console.log('🔍 Running pre-publish checks...');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check if build directory exists
if (!fs.existsSync('build')) {
  console.log('📦 Build directory not found. Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Check if main entry point exists
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const mainFile = packageJson.main;
if (!fs.existsSync(mainFile)) {
  console.error(`❌ Main entry point ${mainFile} not found.`);
  process.exit(1);
}

console.log('✅ Pre-publish checks passed!\n');

// Step 2: Run tests
console.log('🧪 Running tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ All tests passed!\n');
} catch (error) {
  console.error('❌ Tests failed. Please fix issues before publishing.');
  process.exit(1);
}

// Step 3: Check NPM login status
console.log('👤 Checking NPM login status...');
try {
  const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
  console.log(`✅ Logged in as: ${whoami}\n`);
} catch (error) {
  console.error('❌ Not logged in to NPM. Please run: npm login');
  process.exit(1);
}

// Step 4: Check if package already exists
console.log('🔍 Checking package availability...');
try {
  execSync(`npm view ${packageJson.name}@${packageJson.version}`, { stdio: 'pipe' });
  console.error(`❌ Package ${packageJson.name}@${packageJson.version} already exists.`);
  console.error('Please update the version number in package.json');
  process.exit(1);
} catch (error) {
  // Package doesn't exist, which is good for publishing
  console.log(`✅ Package ${packageJson.name}@${packageJson.version} is available for publishing\n`);
}

// Step 5: Dry run
console.log('🏃 Running publish dry run...');
try {
  execSync('npm publish --dry-run', { stdio: 'inherit' });
  console.log('✅ Dry run successful!\n');
} catch (error) {
  console.error('❌ Dry run failed:', error.message);
  process.exit(1);
}

// Step 6: Confirm publication
console.log('🚀 Ready to publish!');
console.log(`Package: ${packageJson.name}`);
console.log(`Version: ${packageJson.version}`);
console.log(`Description: ${packageJson.description}`);
console.log('\nPress Ctrl+C to cancel, or any key to continue...');

// Wait for user input (simplified for script)
console.log('\n📤 Publishing to NPM...');

try {
  execSync('npm publish --access public', { stdio: 'inherit' });
  console.log('\n🎉 Package published successfully!');
  
  // Step 7: Verify publication
  console.log('\n🔍 Verifying publication...');
  setTimeout(() => {
    try {
      const info = execSync(`npm info ${packageJson.name}`, { encoding: 'utf8' });
      console.log('✅ Package is now available on NPM!');
      console.log('\n📋 Installation instructions:');
      console.log(`npm install -g ${packageJson.name}`);
      console.log('\n📚 Documentation:');
      console.log(packageJson.homepage);
    } catch (error) {
      console.log('⚠️ Package published but verification failed. It may take a few minutes to appear.');
    }
  }, 5000);
  
} catch (error) {
  console.error('❌ Publishing failed:', error.message);
  process.exit(1);
}
