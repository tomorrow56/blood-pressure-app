import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { clearAllReadings } from "@/services/storage";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const handleClearData = () => {
    Alert.alert(
      "データ削除",
      "すべての測定データを削除しますか？この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllReadings();
              Alert.alert("完了", "すべてのデータを削除しました。");
            } catch (error) {
              console.error("Failed to clear data:", error);
              Alert.alert("エラー", "データの削除に失敗しました。");
            }
          },
        },
      ],
    );
  };

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
      <ThemedText type="title" style={styles.title}>
        設定
      </ThemedText>

      {/* アプリ情報 */}
      <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          アプリ情報
        </ThemedText>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>アプリ名</ThemedText>
          <ThemedText style={styles.infoValue}>血圧ノート</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>バージョン</ThemedText>
          <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
        </View>
      </ThemedView>

      {/* 血圧の基準値 */}
      <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          血圧の基準値
        </ThemedText>
        <View style={styles.guidelineRow}>
          <View style={[styles.guidelineBadge, { backgroundColor: "#4CAF50" }]} />
          <ThemedText style={styles.guidelineText}>正常: 120未満 / 80未満</ThemedText>
        </View>
        <View style={styles.guidelineRow}>
          <View style={[styles.guidelineBadge, { backgroundColor: "#FFC107" }]} />
          <ThemedText style={styles.guidelineText}>正常高値: 120-129 / 80未満</ThemedText>
        </View>
        <View style={styles.guidelineRow}>
          <View style={[styles.guidelineBadge, { backgroundColor: "#FF9800" }]} />
          <ThemedText style={styles.guidelineText}>高血圧Ⅰ度: 130-139 / 85-89</ThemedText>
        </View>
        <View style={styles.guidelineRow}>
          <View style={[styles.guidelineBadge, { backgroundColor: "#E53935" }]} />
          <ThemedText style={styles.guidelineText}>高血圧Ⅱ度: 140以上 / 90以上</ThemedText>
        </View>
        <View style={styles.guidelineRow}>
          <View style={[styles.guidelineBadge, { backgroundColor: "#B71C1C" }]} />
          <ThemedText style={styles.guidelineText}>高血圧緊急症: 180以上 / 120以上</ThemedText>
        </View>
      </ThemedView>

      {/* 使い方 */}
      <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          使い方
        </ThemedText>
        <ThemedText style={styles.instructionText}>
          1. 血圧計で測定後、「測定」タブで「カメラで撮影」をタップ
        </ThemedText>
        <ThemedText style={styles.instructionText}>
          2. 血圧計の画面を撮影すると、自動的にデータが入力されます
        </ThemedText>
        <ThemedText style={styles.instructionText}>
          3. 手動入力も可能です。数値を入力して「保存」をタップ
        </ThemedText>
        <ThemedText style={styles.instructionText}>
          4. 「履歴」タブで過去のデータとグラフを確認できます
        </ThemedText>
      </ThemedView>

      {/* データ管理 */}
      <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          データ管理
        </ThemedText>
        <Pressable
          style={[styles.dangerButton, { borderColor: "#E53935" }]}
          onPress={handleClearData}
        >
          <IconSymbol name="trash.fill" size={20} color="#E53935" />
          <ThemedText style={styles.dangerButtonText}>すべてのデータを削除</ThemedText>
        </Pressable>
      </ThemedView>

      {/* 注意事項 */}
      <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          注意事項
        </ThemedText>
        <ThemedText style={styles.warningText}>
          このアプリは血圧の記録と管理を目的としたものです。医療診断や治療の代わりにはなりません。血圧に関する医療上の判断は、必ず医師にご相談ください。
        </ThemedText>
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
  title: {
    marginBottom: 16,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  guidelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  guidelineBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  guidelineText: {
    fontSize: 14,
    lineHeight: 20,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dangerButtonText: {
    color: "#E53935",
    fontSize: 14,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.7,
  },
});
