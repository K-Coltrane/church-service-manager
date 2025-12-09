const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper module resolution
config.resolver.sourceExts.push('cjs');

// Explicitly resolve node_modules
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
];

module.exports = config;

