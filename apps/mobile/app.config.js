module.exports = {
  expo: {
    name: 'template',
    slug: 'template',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'template',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      bundleIdentifier: 'com.example.template',
      buildNumber: '1',
    },
    android: {
      versionCode: 1,
      package: 'com.example.template',
    },
    web: {
      output: 'static',
    },
    plugins: ['expo-router', 'expo-secure-store'],
    experiments: {
      typedRoutes: true,
    },
  },
};
