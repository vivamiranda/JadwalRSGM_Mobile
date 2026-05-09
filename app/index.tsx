import { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function SplashScreen() {
  useEffect(() => {
    setTimeout(() => {
      router.replace('/onboarding');
    }, 2500);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logorsgm1.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});