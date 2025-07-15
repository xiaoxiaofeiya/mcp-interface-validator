#!/usr/bin/env node

/**
 * Pre-publish Check Script
 * 
 * Comprehensive checks before publishing to NPM
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 MCP Interface Validator - Pre-publish Check');
console.log('==============================================\n');

let hasErrors = false;
let hasWarnings = false;

function checkError(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${message}`);
  }
}

function checkWarning(condition, message) {
  if (!condition) {
    console.warn(`⚠️ ${message}`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${message}`);
  }
}

// 1. Check package.json
console.log('📦 Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

checkError(packageJson.name === 'mcp-interface-validator', 'Package name is correct');
checkError(packageJson.version, 'Version is set');
checkError(packageJson.description, 'Description is provided');
checkError(packageJson.main === 'build/index.js', 'Main entry point is correct');
checkError(packageJson.bin && packageJson.bin['mcp-interface-validator'], 'Binary is configured');
checkError(packageJson.repository && packageJson.repository.url, 'Repository URL is set');
checkError(packageJson.license === 'MIT', 'License is set to MIT');
checkError(packageJson.publishConfig && packageJson.publishConfig.access === 'public', 'Publish config is public');

// 2. Check required files
console.log('\n📁 Checking required files...');
checkError(fs.existsSync('build/index.js'), 'Main build file exists');
checkError(fs.existsSync('build/index.d.ts'), 'Type definitions exist');
checkError(fs.existsSync('README.md') || fs.existsSync('USER_README.md'), 'README file exists');
checkError(fs.existsSync('LICENSE'), 'License file exists');
checkError(fs.existsSync('.npmignore'), '.npmignore file exists');

// 3. Check build directory
console.log('\n🏗️ Checking build directory...');
const buildFiles = fs.readdirSync('build', { recursive: true });
checkError(buildFiles.length > 0, 'Build directory is not empty');
checkError(buildFiles.some(f => f.endsWith('.js')), 'JavaScript files exist in build');
checkError(buildFiles.some(f => f.endsWith('.d.ts')), 'Type definition files exist in build');

// 4. Check executable permissions
console.log('\n🔧 Checking executable...');
try {
  const stats = fs.statSync('build/index.js');
  const content = fs.readFileSync('build/index.js', 'utf8');
  checkError(content.startsWith('#!/usr/bin/env node'), 'Shebang is present');
} catch (error) {
  checkError(false, 'Build file is accessible');
}

// 5. Test build
console.log('\n🧪 Testing build...');
try {
  execSync('node build/index.js --version', { stdio: 'pipe' });
  checkError(true, 'Build executes successfully');
} catch (error) {
  checkError(false, 'Build execution test failed');
}

// 6. Check dependencies
console.log('\n📚 Checking dependencies...');
const deps = packageJson.dependencies || {};
const devDeps = packageJson.devDependencies || {};

checkWarning(Object.keys(deps).length > 0, 'Has runtime dependencies');
checkWarning(deps['@modelcontextprotocol/sdk'], 'MCP SDK dependency exists');
checkError(!deps['typescript'], 'TypeScript is not in runtime dependencies');
checkError(!deps['jest'], 'Jest is not in runtime dependencies');

// 7. Check documentation
console.log('\n📖 Checking documentation...');
checkError(fs.existsSync('docs'), 'Documentation directory exists');
checkError(fs.existsSync('docs/examples'), 'Examples directory exists');
checkWarning(fs.existsSync('INSTALLATION.md'), 'Installation guide exists');
checkWarning(fs.existsSync('PUBLISH_CHECKLIST.md'), 'Publish checklist exists');

// 8. Check configuration examples
console.log('\n⚙️ Checking configuration examples...');
checkError(fs.existsSync('docs/examples/claude-desktop-config-correct.json'), 'Correct Claude config example exists');
checkWarning(fs.existsSync('config/constraint-config.json'), 'Constraint config exists');

// 9. Final summary
console.log('\n📊 Summary');
console.log('==========');

if (hasErrors) {
  console.error(`❌ Found ${hasErrors} critical issues that must be fixed before publishing.`);
  process.exit(1);
} else if (hasWarnings) {
  console.warn(`⚠️ Found ${hasWarnings} warnings. Consider addressing them before publishing.`);
  console.log('✅ No critical issues found. Ready for publishing!');
} else {
  console.log('🎉 All checks passed! Ready for publishing!');
}

console.log('\n🚀 Next steps:');
console.log('1. npm run publish:check');
console.log('2. npm publish --access public');
console.log('3. Verify: npm info mcp-interface-validator');
