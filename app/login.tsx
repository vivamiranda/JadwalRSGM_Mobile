import { useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../supabase";

export default function LoginScreen() {
  const [posisi, setPosisi] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const posisiList = ["Perawat", "Admin", "Kepegawaian", "Direktur"];

  const handleLogin = async () => {
    if (!posisi || !username || !password) {
      alert("Semua kolom harus diisi!");
      return;
    }

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .eq("role", posisi)
      .single();

    if (error || !data) {
      alert("Username, password, atau posisi salah!");
      return;
    }

    alert("Login berhasil! Selamat datang, " + data.nama_lengkap);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection} />
      <View style={styles.card}>
        <Text style={styles.title}>Log In</Text>
        <Text style={styles.subtitle}>Sistem Jadwal Perawat</Text>

        {/* Dropdown Posisi */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => setDropdownOpen(!dropdownOpen)}
        >
          <Text style={posisi ? styles.inputText : styles.placeholder}>
            {posisi || "Pilih Posisi"}
          </Text>
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdown}>
            {posisiList.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.dropdownItem}
                onPress={() => {
                  setPosisi(item);
                  setDropdownOpen(false);
                }}
              >
                <Text style={styles.dropdownText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Username */}
        <TextInput
          style={styles.input}
          placeholder="Masukkan Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />

        {/* Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Masukkan Password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        {/* Tombol Masuk */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Masuk</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d9488",
  },
  topSection: {
    flex: 1,
    backgroundColor: "#0d9488",
  },
  card: {
    flex: 2.5,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 36,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: "100%",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputText: {
    color: "#1a1a1a",
    fontSize: 14,
  },
  placeholder: {
    color: "#999",
    fontSize: 14,
  },
  arrow: {
    color: "#999",
    fontSize: 12,
  },
  dropdown: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: "100%",
    marginTop: -12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownText: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  passwordContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: "100%",
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a1a",
  },
  eyeIcon: {
    fontSize: 16,
  },
  button: {
    backgroundColor: "#EAB308",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
