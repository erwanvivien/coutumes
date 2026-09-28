import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { storeToken } from '@/lib/auth';

// Landed on when the website redirects to template://auth?token=… after sign-in. Expo Router
// treats any incoming deep link as a navigation target regardless of whether WebBrowser's
// openAuthSessionAsync is also watching for it, so — even though that promise usually resolves
// with the same URL — this route is the one guaranteed place the token actually gets stored.
export default function AuthCallbackScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  useEffect(() => {
    void (async () => {
      if (typeof token === 'string') {
        await storeToken(token);
      }
      // dismissBrowser is iOS-only (it's not a Promise on Android — calling it there throws). On
      // Android the Custom Tab that hosted the sign-in flow has already closed itself by the time
      // this deep link lands here, so there's nothing to dismiss.
      if (Platform.OS === 'ios') {
        await WebBrowser.dismissBrowser().catch(() => {});
      }
      router.replace('/');
    })();
  }, [token]);

  return (
    <View style={styles.wrapper}>
      <ActivityIndicator size="large" />
      <Text>Signing in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});
