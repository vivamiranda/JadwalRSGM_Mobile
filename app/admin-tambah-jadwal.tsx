import React, { useState, useEffect, useCallback } from "react";
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
import { useRouter } from "expo-router";
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

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminTambahJadwalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [perawatList, setPerawatList] = useState<{username: string; nama_lengkap: string}[]>([]);
  const [selectedPerawat, setSelectedPerawat] = useState<{username: string; nama_lengkap: string} | null>(null);
  const [selectedShift, setSelectedShift]     = useState<string | null>(null);
  const [tanggal, setTanggal]                 = useState("");
  const [loading, setLoading]                 = useState(false);
  const [loadingPerawat, setLoadingPerawat]   = useState(true);

  // Modal dropdown perawat
  const [showPerawatModal, setShowPerawatModal] = useState(false);
  // Modal konfirmasi simpan
  const [showKonfirmasi, setShowKonfirmasi]     = useState(false);

  // Load daftar perawat dari DB
  useEffect(() => {
    (async () => {
      setLoadingPerawat(true);
      const { data } = await supabase
        .from("user").select("nama_lengkap, username")
        .ilike("role", "perawat")
        .ilike("status", "aktif");
      setPerawatList((data ?? []).map((u: any) => ({ username: u.username, nama_lengkap: u.nama_lengkap })));
      setLoadingPerawat(false);
    })();
  }, []);

  const selectedShiftInfo = SHIFT_LIST.find(s => s.key === selectedShift);

  const isValid = selectedPerawat && selectedShift && parseInputTgl(tanggal);

  const handleSimpan = async () => {
    if (!isValid) return;
    setLoading(true);
    setShowKonfirmasi(false);
    try {
      const tglParsed = parseInputTgl(tanggal)!;

      // Cek apakah perawat sudah punya jadwal di tanggal yang sama
      const { data: existing } = await supabase
        .from("jadwal").select("id, shift")
        .eq("nama_perawat", selectedPerawat.username).eq("tanggal", tglParsed).maybeSingle();

      if (existing) {
        Alert.alert(
          "⚠️ Jadwal Sudah Ada",
          `${selectedPerawat.nama_lengkap} sudah punya jadwal shift ${existing.shift} di tanggal ini. Ganti shift lama?`,
          [
            { text: "Batal", onPress: () => setLoading(false) },
            {
              text: "Ya, Ganti",
              onPress: async () => {
                await supabase.from("jadwal")
                  .update({ shift: selectedShift, poli: selectedShiftInfo?.label ?? "" })
                  .eq("id", existing.id);
                Alert.alert("✅ Berhasil", "Jadwal berhasil diperbarui!");
                setLoading(false);
                router.back();
              },
            },
          ]
        );
        return;
      }

      await supabase.from("jadwal").insert({
        nama_perawat: selectedPerawat.username,
        tanggal:      tglParsed,
        shift:        selectedShift,
        poli:         selectedShiftInfo?.label ?? "",
      });
      Alert.alert("✅ Berhasil", "Jadwal baru berhasil ditambahkan!");
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

      {/* ── MODAL PILIH PERAWAT ─────────────────────────────────────────── */}
      <Modal visible={showPerawatModal} transparent animationType="slide"
        onRequestClose={() => setShowPerawatModal(false)}>
        <View style={st.modalOverlay}>
          <View style={st.modalSheet}>
            <View style={st.modalSheetHandle} />
            <Text style={st.modalSheetTitle}>Pilih Perawat</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {perawatList.map(p => (
                <TouchableOpacity
                  key={p.username}
                  style={[st.modalItem, selectedPerawat?.username === p.username && st.modalItemActive]}
                  onPress={() => { setSelectedPerawat(p); setShowPerawatModal(false); }}
                >
                  <View style={st.modalItemAvatar}>
                    <Ionicons name="person" size={18} color="#fff" />
                  </View>
                  <Text style={[st.modalItemTxt, selectedPerawat?.username === p.username && st.modalItemTxtActive]}>
                    {p.nama_lengkap}
                  </Text>
                  {selectedPerawat?.username === p.username && (
                    <Ionicons name="checkmark-circle" size={20} color={HIJAU} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={st.modalCloseBtn} onPress={() => setShowPerawatModal(false)}>
              <Text style={st.modalCloseTxt}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL KONFIRMASI SIMPAN ─────────────────────────────────────── */}
      <Modal visible={showKonfirmasi} transparent animationType="fade"
        onRequestClose={() => setShowKonfirmasi(false)}>
        <View style={st.konfirmasiOverlay}>
          <View style={st.konfirmasiBox}>
            <View style={st.konfirmasiIcon}>
              <Ionicons name="calendar-outline" size={30} color={HIJAU} />
            </View>
            <Text style={st.konfirmasiTitle}>Simpan Jadwal?</Text>
            <Text style={st.konfirmasiMsg}>
              Tambah jadwal untuk{" "}
              <Text style={{ fontWeight: "700" }}>{selectedPerawat?.nama_lengkap}</Text>
              {"\n"}Tanggal: <Text style={{ fontWeight: "700" }}>{tanggal}</Text>
              {"\n"}Shift: <Text style={{ fontWeight: "700" }}>{selectedShiftInfo?.label}</Text>
            </Text>
            <View style={st.konfirmasiActions}>
              <TouchableOpacity
                style={[st.konfirmasiBtn, st.konfirmaBtnBatal]}
                onPress={() => setShowKonfirmasi(false)}
              >
                <Text style={st.konfirmaBtnBatalTxt}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.konfirmasiBtn, st.konfirmaBtnSimpan]}
                onPress={handleSimpan}
              >
                <Text style={st.konfirmaBtnSimpanTxt}>Ya, Simpan</Text>
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
        <Text style={st.topbarTitle}>Tambah Jadwal Baru</Text>
      </View>

      {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pilih Perawat */}
        <Text style={st.label}>Pilih Perawat</Text>
        <TouchableOpacity
          style={st.dropdownBtn}
          onPress={() => setShowPerawatModal(true)}
          disabled={loadingPerawat}
        >
          {loadingPerawat ? (
            <ActivityIndicator size="small" color={HIJAU} />
          ) : (
            <>
              <Text style={[st.dropdownTxt, !selectedPerawat && st.dropdownPlaceholder]}>
                {selectedPerawat?.nama_lengkap ?? "Pilih perawat..."}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#888" />
            </>
          )}
        </TouchableOpacity>

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

        {/* Spacer agar konten tidak tertutup tombol bawah */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── STICKY BOTTOM BUTTONS ──────────────────────────────────────── */}
      <View style={[st.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={st.btnBatal}
          onPress={() => router.back()}
        >
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
  backBtn:      { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topbarTitle:  { color: "#fff", fontSize: 20, fontWeight: "700" },

  // Scroll
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },

  // Label
  label:    { fontSize: 14, fontWeight: "700", color: "#222", marginBottom: 8 },
  subLabel: { fontSize: 12, color: "#999", marginBottom: 10, marginTop: -4 },

  // Dropdown perawat
  dropdownBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E0E0E0",
    paddingHorizontal: 16, paddingVertical: 16,
    marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  dropdownTxt:         { fontSize: 15, color: "#111", fontWeight: "500" },
  dropdownPlaceholder: { color: "#BBBBBB", fontWeight: "400" },

  // Input tanggal
  inputBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E0E0E0",
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  inputTxt: { flex: 1, fontSize: 15, color: "#111" },

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

  // Radio button
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: "#CCC",
    alignItems: "center", justifyContent: "center",
  },
  radioActive: { borderColor: HIJAU },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: HIJAU },

  // Bottom bar
  bottomBar: {
    flexDirection: "row", gap: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: "#EEEEEE",
    shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: -2 }, elevation: 8,
  },
  btnBatal: {
    flex: 1, backgroundColor: "#F0F0F0",
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  btnBatalTxt:  { color: "#555", fontWeight: "600", fontSize: 15 },
  btnSimpan: {
    flex: 2, backgroundColor: HIJAU,
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
  },
  btnSimpanTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnDisabled:  { opacity: 0.45 },

  // Modal perawat (bottom sheet)
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: "70%",
  },
  modalSheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#DDD",
    alignSelf: "center", marginBottom: 16,
  },
  modalSheetTitle: { fontSize: 17, fontWeight: "700", color: "#111", marginBottom: 14 },
  modalItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: "#F5F5F5",
  },
  modalItemActive:  { backgroundColor: "#F0FAF8", borderRadius: 10, paddingHorizontal: 8 },
  modalItemAvatar:  {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: HIJAU, alignItems: "center", justifyContent: "center",
  },
  modalItemTxt:       { flex: 1, fontSize: 15, color: "#222" },
  modalItemTxtActive: { fontWeight: "700", color: HIJAU },
  modalCloseBtn: {
    marginTop: 16, backgroundColor: "#F0F0F0",
    borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  modalCloseTxt: { color: "#555", fontWeight: "600", fontSize: 15 },

  // Modal konfirmasi simpan
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
  konfirmaBtnBatal:     { backgroundColor: "#F0F0F0" },
  konfirmaBtnBatalTxt:  { color: "#555", fontWeight: "600", fontSize: 14 },
  konfirmaBtnSimpan:    { backgroundColor: HIJAU },
  konfirmaBtnSimpanTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});