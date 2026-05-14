import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../supabase";
import { SHIFT_LIST } from "./admin-edit-jadwal";

const HIJAU  = "#2C7A6E";
const KUNING = "#E8C840";

const fmtInput = (val: string): string => {
  const d = val.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

const parseInputTgl = (s: string): string | null => {
  const p = s.split("/");
  if (p.length !== 3 || p[0].length !== 2 || p[1].length !== 2 || p[2].length !== 4) return null;
  return `${p[2]}-${p[1]}-${p[0]}`;
};

const tglToDisplay = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminEditFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    nama_perawat: string;
    tanggal: string;
    shift: string;
    poli: string;
  }>();

  // Data lama (untuk info di header)
  const shiftLama = SHIFT_LIST.find(s => s.key === params.shift);
  const tglLamaDisplay = tglToDisplay(params.tanggal ?? "");

  // State form — pre-filled dari params
  const [tanggal, setTanggal]           = useState(tglLamaDisplay);
  const [selectedShift, setSelectedShift] = useState<string>(params.shift ?? "");
  const [loading, setLoading]           = useState(false);

  // Modal konfirmasi simpan
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const selectedShiftInfo = SHIFT_LIST.find(s => s.key === selectedShift);
  const isValid = selectedShift && parseInputTgl(tanggal);

  const handleSimpan = async () => {
    if (!isValid) return;
    setLoading(true);
    setShowKonfirmasi(false);
    try {
      const tglParsed = parseInputTgl(tanggal)!;
      const { error } = await supabase.from("jadwal").update({
        tanggal: tglParsed,
        shift:   selectedShift,
        poli:    selectedShiftInfo?.label ?? "",
      }).eq("id", params.id);

      if (error) throw error;
      Alert.alert("✅ Berhasil", "Jadwal berhasil diperbarui!");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── MODAL KONFIRMASI SIMPAN ─────────────────────────────────────── */}
      <Modal visible={showKonfirmasi} transparent animationType="fade"
        onRequestClose={() => setShowKonfirmasi(false)}>
        <View style={st.konfirmasiOverlay}>
          <View style={st.konfirmasiBox}>
            <View style={st.konfirmasiIcon}>
              <Ionicons name="create-outline" size={30} color={HIJAU} />
            </View>
            <Text style={st.konfirmasiTitle}>Simpan Perubahan?</Text>
            <Text style={st.konfirmasiMsg}>
              Jadwal <Text style={{ fontWeight: "700" }}>{params.nama_perawat}</Text> akan diubah menjadi:{"\n"}
              Tanggal: <Text style={{ fontWeight: "700" }}>{tanggal}</Text>{"\n"}
              Shift: <Text style={{ fontWeight: "700" }}>{selectedShiftInfo?.label}</Text>
            </Text>
            <View style={st.konfirmasiActions}>
              <TouchableOpacity
                style={[st.konfirmasiBtn, st.btnBatal]}
                onPress={() => setShowKonfirmasi(false)}
              >
                <Text style={st.btnBatalTxt}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.konfirmasiBtn, st.btnSimpan]}
                onPress={handleSimpan}
              >
                <Text style={st.btnSimpanTxt}>Ya, Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── STICKY TOPBAR ──────────────────────────────────────────────── */}
      <View style={[st.topbar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={st.topbarTitle}>Edit Jadwal</Text>
      </View>

      {/* ── INFO JADWAL LAMA (chip di bawah topbar) ────────────────────── */}
      <View style={st.lamaChipWrap}>
        <View style={st.lamaChip}>
          <Ionicons name="time-outline" size={13} color={HIJAU} />
          <Text style={st.lamaChipTxt}>
            Jadwal lama: {shiftLama?.key ?? params.shift} - {shiftLama?.label?.split(" - ")[1] ?? ""} | {tglLamaDisplay}
          </Text>
        </View>
      </View>

      {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Perawat — tidak bisa diubah */}
        <Text style={st.label}>Perawat</Text>
        <Text style={st.subLabel}>Tidak dapat diubah</Text>
        <View style={[st.inputBox, st.inputBoxLocked]}>
          <Text style={st.inputTxtLocked}>{params.nama_perawat}</Text>
          <Ionicons name="lock-closed-outline" size={18} color="#BBBBBB" />
        </View>

        {/* Pilih Tanggal */}
        <Text style={st.label}>Pilih Tanggal</Text>
        <View style={st.inputBox}>
          <TextInput
            style={st.inputTxt}
            placeholder="dd/mm/tttt"
            placeholderTextColor="#BBBBBB"
            value={tanggal}
            keyboardType="numeric"
            maxLength={10}
            onChangeText={v => setTanggal(fmtInput(v))}
          />
          <Ionicons name="calendar-outline" size={20} color="#888" />
        </View>

        {/* Pilih Shift */}
        <Text style={st.label}>Pilih Shift</Text>
        <Text style={st.subLabel}>Scroll untuk lihat semua pilihan</Text>

        {SHIFT_LIST.map(shift => (
          <TouchableOpacity
            key={shift.key}
            style={[st.shiftItem, selectedShift === shift.key && st.shiftItemActive]}
            onPress={() => setSelectedShift(shift.key)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={[st.shiftLabel, selectedShift === shift.key && st.shiftLabelActive]}>
                {shift.label}
              </Text>
              {shift.jam ? (
                <Text style={[st.shiftJam, selectedShift === shift.key && st.shiftJamActive]}>
                  {shift.jam}
                </Text>
              ) : null}
            </View>
            <View style={[st.radio, selectedShift === shift.key && st.radioActive]}>
              {selectedShift === shift.key && <View style={st.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── STICKY BOTTOM BUTTONS ──────────────────────────────────────── */}
      <View style={[st.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={st.btnBatal} onPress={() => router.back()}>
          <Text style={st.btnBatalTxt}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.btnSimpan, !isValid && st.btnDisabled]}
          onPress={() => { if (isValid) setShowKonfirmasi(true); }}
          disabled={!isValid || loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={st.btnSimpanTxt}>Simpan Jadwal</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  // Topbar
  topbar: {
    backgroundColor: HIJAU,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingBottom: 16, gap: 4,
  },
  backBtn:     { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topbarTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },

  // Chip jadwal lama
  lamaChipWrap: {
    backgroundColor: HIJAU, paddingHorizontal: 16, paddingBottom: 14,
  },
  lamaChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#E8F5F3",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    alignSelf: "flex-start",
    borderWidth: 1, borderColor: "#C2E0DB",
  },
  lamaChipTxt: { fontSize: 12, color: HIJAU, fontWeight: "600" },

  // Scroll
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },

  // Label
  label:    { fontSize: 14, fontWeight: "700", color: "#222", marginBottom: 4 },
  subLabel: { fontSize: 12, color: "#999", marginBottom: 10 },

  // Input box
  inputBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E0E0E0",
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  inputBoxLocked: { backgroundColor: "#F8F8F8" },
  inputTxt:       { flex: 1, fontSize: 15, color: "#111" },
  inputTxtLocked: { flex: 1, fontSize: 15, color: "#AAAAAA" },

  // Shift item
  shiftItem: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E8E8E8",
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  shiftItemActive: { borderColor: HIJAU, backgroundColor: "#F0FAF8" },
  shiftLabel:      { fontSize: 14, fontWeight: "600", color: "#222" },
  shiftLabelActive:{ color: HIJAU },
  shiftJam:        { fontSize: 12, color: "#888", marginTop: 2 },
  shiftJamActive:  { color: "#5BA89E" },

  // Radio
  radio:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#CCC", alignItems: "center", justifyContent: "center" },
  radioActive:{ borderColor: HIJAU },
  radioDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: HIJAU },

  // Bottom bar
  bottomBar: {
    flexDirection: "row", gap: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: "#EEEEEE",
    shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: -2 }, elevation: 8,
  },
  btnBatal:    { flex: 1, backgroundColor: "#F0F0F0", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnBatalTxt: { color: "#555", fontWeight: "600", fontSize: 15 },
  btnSimpan:   { flex: 2, backgroundColor: HIJAU, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnSimpanTxt:{ color: "#fff", fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.45 },

  // Modal konfirmasi
  konfirmasiOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 32,
  },
  konfirmasiBox: {
    backgroundColor: "#fff", borderRadius: 20, padding: 24,
    width: "100%", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 10,
  },
  konfirmasiIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#E8F5F3", alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  konfirmasiTitle:   { fontSize: 17, fontWeight: "700", color: "#111", marginBottom: 8 },
  konfirmasiMsg:     { fontSize: 13, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 20 },
  konfirmasiActions: { flexDirection: "row", gap: 12, width: "100%" },
  konfirmasiBtn:     { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
});