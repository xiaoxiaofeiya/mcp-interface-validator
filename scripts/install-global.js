#!/usr/bin/env node

/**
 * Global Installation Script for MCP Interface Validator
 * 
 * This script helps users install the package globally and set up MCP configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('🚀 MCP Interface Validator - Global Installation');
console.log('================================================\n');

// Step 1: Install package globally
console.log('📦 Installing package globally...');
try {
  execSync('npm install -g mcp-interface-validator', { stdio: 'inherit' });
  console.log('✅ Package installed successfully!\n');
} catch (error) {
  console.error('❌ Failed to install package:', error.message);
  process.exit(1);
}

// Step 2: Verify installation
console.log('🔍 Verifying installation...');
try {
  const version = execSync('mcp-interface-validator --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Version ${version} installed successfully!\n`);
} catch (error) {
  console.error('❌ Failed to verify installation:', error.message);
  process.exit(1);
}

// Step 3: Generate MCP configuration
console.log('⚙️ Generating MCP configuration...');

const mcpConfig = {
  mcpServers: {
    "interface-validator": {
      command: "mcp-interface-validator",
      transport: "stdio",
      env: {
        NODE_ENV: "production"
      },
      autoStart: true
    }
  }
};

// Determine config path based on OS
let configPath;
const platform = os.platform();

if (platform === 'win32') {
  configPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
} else if (platform === 'darwin') {
  configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
} else {
  configPath = path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
}

// Create config directory if it doesn't exist
const configDir = path.dirname(configPath);
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Write or update config file
let existingConfig = {};
if (fs.existsSync(configPath)) {
  try {
    existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.log('⚠️ Existing config file is invalid, creating new one...');
  }
}

// Merge configurations
if (!existingConfig.mcpServers) {
  existingConfig.mcpServers = {};
}
existingConfig.mcpServers['interface-validator'] = mcpConfig.mcpServers['interface-validator'];

// Write config file
fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
console.log(`✅ MCP configuration saved to: ${configPath}\n`);

// Step 4: Display next steps
console.log('🎉 Installation Complete!');
console.log('========================\n');
console.log('Next steps:');
console.log('1. Restart Claude Desktop');
console.log('2. In Claude, you should now see the interface-validator tools available');
console.log('3. Try using: .use interface 开发用户登录功能');
console.log('\nFor more information, visit:');
console.log('📚 Documentation: https://github.com/xiaoxiaofeiya/mcp-interface-validator');
console.log('🐛 Issues: https://github.com/xiaoxiaofeiya/mcp-interface-validator/issues');
console.log('\n✨ Happy coding with intelligent interface validation!');
