// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package exports to avoid warnings with @noble/hashes and @scure/bip39
// These packages work fine with file-based resolution (Metro's default behavior)
// The warnings occur because Metro's package exports resolver is strict about
// matching import paths to the exports field, even though the files exist and work
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
};

module.exports = config;

