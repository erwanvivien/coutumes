import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { signIn, signOut } from '@/lib/auth';
import { useAuthUser } from '@/lib/auth-context';

export default function Index() {
  const { user, hasLoadedOnce, refresh } = useAuthUser();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
      await refresh();
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    await refresh();
  };

  if (!hasLoadedOnce) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user !== null ? (
        <>
          <Text style={styles.title}>Signed in as {user.email}</Text>
          <Pressable style={styles.button} onPress={() => void handleSignOut()}>
            <Text style={styles.buttonText}>Sign out</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.title}>Not signed in</Text>
          <Pressable
            style={styles.button}
            onPress={() => void handleSignIn()}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#111',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
