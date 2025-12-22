import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getLatestReading, saveReading } from "@/services/storage";
import type { BloodPressureReading } from "@/types/blood-pressure";
import { formatDateTime, getBloodPressureLevel } from "@/utils/blood-pressure-utils";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [latestReading, setLatestReading] = useState<BloodPressureReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 入力フォームの状態
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");

  // 最新の測定データを読み込み
  const loadLatestReading = useCallback(async () => {
    setLoading(true);
    try {
      const reading = await getLatestReading();
      setLatestReading(reading);
    } catch (error) {
      console.error("Failed to load latest reading:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 画面がフォーカスされたときに最新データを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadLatestReading();
    }, [loadLatestReading]),
  );

  // データ保存
  const handleSave = async () => {
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    const pul = parseInt(pulse, 10);

    // バリデーション
    if (!systolic || !diastolic || !pulse) {
      Alert.alert("入力エラー", "すべての項目を入力してください。");
      return;
    }

    if (isNaN(sys) || isNaN(dia) || isNaN(pul)) {
      Alert.alert("入力エラー", "数値を入力してください。");
      return;
    }

    if (sys < 50 || sys > 250) {
      Alert.alert("入力エラー", "収縮期血圧は50〜250の範囲で入力してください。");
      return;
    }

    if (dia < 30 || dia > 150) {
      Alert.alert("入力エラー", "拡張期血圧は30〜150の範囲で入力してください。");
      return;
    }

    if (pul < 30 || pul > 200) {
      Alert.alert("入力エラー", "脈拍は30〜200の範囲で入力してください。");
      return;
    }

    setSaving(true);
    try {
      await saveReading({
        systolic: sys,
        diastolic: dia,
        pulse: pul,
        measuredAt: new Date().toISOString(),
      });

      Alert.alert("保存完了", "測定データを保存しました。");
      setSystolic("");
      setDiastolic("");
      setPulse("");
      await loadLatestReading();
    } catch (error) {
      console.error("Failed to save reading:", error);
      Alert.alert("エラー", "データの保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  // カメラ画面へ遷移
  const handleOpenCamera = () => {
    router.push("/camera" as any);
  };

  const bpLevel = latestReading
    ? getBloodPressureLevel(latestReading.systolic, latestReading.diastolic)
    : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">血圧測定</ThemedText>
      </ThemedView>

      {/* カメラ撮影ボタン */}
      <Pressable
        style={[styles.cameraButton, { backgroundColor: colors.tint }]}
        onPress={handleOpenCamera}
      >
        <IconSymbol name="camera.fill" size={32} color="#FFFFFF" />
        <ThemedText style={styles.cameraButtonText}>カメラで撮影</ThemedText>
      </Pressable>

      {/* 最新の測定データ */}
      {loading ? (
        <ThemedView style={[styles.card, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.tint} />
        </ThemedView>
      ) : latestReading ? (
        <ThemedView style={[styles.card, { backgroundColor: colors.card }]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            最新の測定
          </ThemedText>
          <ThemedText style={styles.dateText}>{formatDateTime(latestReading.measuredAt)}</ThemedText>

          <View style={styles.readingRow}>
            <View style={styles.readingItem}>
              <ThemedText style={styles.readingLabel}>収縮期</ThemedText>
              <ThemedText style={[styles.readingValue, { color: colors.tint }]}>
                {latestReading.systolic}
              </ThemedText>
              <ThemedText style={styles.readingUnit}>mmHg</ThemedText>
            </View>

            <View style={styles.readingItem}>
              <ThemedText style={styles.readingLabel}>拡張期</ThemedText>
              <ThemedText style={[styles.readingValue, { color: colors.secondary }]}>
                {latestReading.diastolic}
              </ThemedText>
              <ThemedText style={styles.readingUnit}>mmHg</ThemedText>
            </View>

            <View style={styles.readingItem}>
              <ThemedText style={styles.readingLabel}>脈拍</ThemedText>
              <ThemedText style={[styles.readingValue, { color: colors.icon }]}>
                {latestReading.pulse}
              </ThemedText>
              <ThemedText style={styles.readingUnit}>/min</ThemedText>
            </View>
          </View>

          {bpLevel && (
            <View style={[styles.levelBadge, { backgroundColor: bpLevel.color }]}>
              <ThemedText style={styles.levelText}>{bpLevel.label}</ThemedText>
            </View>
          )}
        </ThemedView>
      ) : (
        <ThemedView style={[styles.card, { backgroundColor: colors.card }]}>
          <ThemedText style={styles.emptyText}>まだ測定データがありません</ThemedText>
        </ThemedView>
      )}

      {/* 手動入力フォーム */}
      <ThemedView style={[styles.card, { backgroundColor: colors.card }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          手動入力
        </ThemedText>

        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>収縮期 (SYS)</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              value={systolic}
              onChangeText={setSystolic}
              keyboardType="numeric"
              placeholder="120"
              placeholderTextColor={colors.icon}
            />
            <ThemedText style={styles.inputUnit}>mmHg</ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>拡張期 (DIA)</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              value={diastolic}
              onChangeText={setDiastolic}
              keyboardType="numeric"
              placeholder="80"
              placeholderTextColor={colors.icon}
            />
            <ThemedText style={styles.inputUnit}>mmHg</ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>脈拍 (PUL)</ThemedText>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
              value={pulse}
              onChangeText={setPulse}
              keyboardType="numeric"
              placeholder="72"
              placeholderTextColor={colors.icon}
            />
            <ThemedText style={styles.inputUnit}>/min</ThemedText>
          </View>
        </View>

        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: colors.tint },
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="checkmark.circle.fill" size={24} color="#FFFFFF" />
              <ThemedText style={styles.saveButtonText}>保存</ThemedText>
            </>
          )}
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
    backgroundColor: "transparent",
  },
  cameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  cameraButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7,
  },
  readingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  readingItem: {
    flex: 1,
    alignItems: "center",
  },
  readingLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  readingValue: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 40,
  },
  readingUnit: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  levelBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "center",
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.5,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  inputUnit: {
    fontSize: 10,
    textAlign: "center",
    opacity: 0.7,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
