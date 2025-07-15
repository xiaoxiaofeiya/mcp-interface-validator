#!/usr/bin/env node

/**
 * Simple NPM Publishing Script (Skip Tests)
 * 
 * This script publishes the package without running tests
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 MCP Interface Validator - Simple Publishing');
console.log('==============================================\n');

// Step 1: Check if we're logged in
console.log('👤 Checking NPM login status...');
try {
  const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
  console.log(`✅ Logged in as: ${whoami}\n`);
} catch (error) {
  console.error('❌ Not logged in to NPM.');
  console.error('Please run: npm login');
  console.error('Then try again.');
  process.exit(1);
}

// Step 2: Check package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`📦 Package: ${packageJson.name}@${packageJson.version}`);

// Step 3: Check if package already exists
console.log('🔍 Checking if package version already exists...');
try {
  execSync(`npm view ${packageJson.name}@${packageJson.version}`, { stdio: 'pipe' });
  console.error(`❌ Package ${packageJson.name}@${packageJson.version} already exists.`);
  console.error('Please update the version number in package.json');
  process.exit(1);
} catch (error) {
  console.log(`✅ Version ${packageJson.version} is available for publishing\n`);
}

// Step 4: Ensure build exists
if (!fs.existsSync('build/index.js')) {
  console.log('📦 Build not found. Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Step 5: Dry run
console.log('🏃 Running publish dry run...');
try {
  execSync('npm publish --dry-run --access public', { stdio: 'inherit' });
  console.log('✅ Dry run successful!\n');
} catch (error) {
  console.error('❌ Dry run failed:', error.message);
  process.exit(1);
}

// Step 6: Actual publish
console.log('📤 Publishing to NPM...');
try {
  execSync('npm publish --access public', { stdio: 'inherit' });
  console.log('\n🎉 Package published successfully!');
  
  // Step 7: Verify publication
  console.log('\n🔍 Verifying publication...');
  setTimeout(() => {
    try {
      execSync(`npm info ${packageJson.name}`, { stdio: 'inherit' });
      console.log('\n✅ Package is now available on NPM!');
      console.log('\n📋 Installation instructions:');
      console.log(`npm install -g ${packageJson.name}`);
      console.log('\n🎯 Test installation:');
      console.log(`npx ${packageJson.name} --version`);
    } catch (error) {
      console.log('⚠️ Package published but verification failed. It may take a few minutes to appear.');
    }
  }, 3000);
  
} catch (error) {
  console.error('❌ Publishing failed:', error.message);
  process.exit(1);
}
