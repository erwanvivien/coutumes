#!/usr/bin/env node
// Writes versionCode/buildNumber into app.config.js, the single source of truth
// that `expo prebuild` reads when regenerating android/ and ios/.
// app.config.js is a JS module (not static JSON, e.g. it can read process.env),
// so we patch it in place with a regex rather than JSON.parse/stringify, which
// would drop the JS and clobber formatting.
// Usage: node scripts/set-native-version.js <android|ios> <value>

const fs = require('fs');
const path = require('path');

const [, , platform, value] = process.argv;

if (!['android', 'ios'].includes(platform) || !value) {
  console.error('Usage: node scripts/set-native-version.js <android|ios> <value>');
  process.exit(1);
}

const appConfigPath = path.join(__dirname, '..', 'app.config.js');
const appConfig = fs.readFileSync(appConfigPath, 'utf8');

let updated;
if (platform === 'android') {
  const versionCode = Number.parseInt(value, 10);
  if (!Number.isInteger(versionCode) || versionCode < 1) {
    console.error(`Invalid Android versionCode: ${value}`);
    process.exit(1);
  }
  if (!/versionCode:\s*\d+/.test(appConfig)) {
    console.error(`Could not find "versionCode" in ${appConfigPath}`);
    process.exit(1);
  }
  updated = appConfig.replace(/versionCode:\s*\d+/, `versionCode: ${versionCode}`);
} else {
  if (!/buildNumber:\s*'[^']*'/.test(appConfig)) {
    console.error(`Could not find "buildNumber" in ${appConfigPath}`);
    process.exit(1);
  }
  updated = appConfig.replace(/buildNumber:\s*'[^']*'/, `buildNumber: '${value}'`);
}

fs.writeFileSync(appConfigPath, updated);
console.info(
  `Set expo.${platform}.${platform === 'android' ? 'versionCode' : 'buildNumber'} = ${value}`,
);
