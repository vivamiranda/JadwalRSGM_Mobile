import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logorsgm2.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>Sistem Jadwal Perawat</Text>
      <Text style={styles.subtitle}>
        membantu kelola jadwal perawat{"\n"}dengan sistematis
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.buttonText}>Masuk</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#0d9488",
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
