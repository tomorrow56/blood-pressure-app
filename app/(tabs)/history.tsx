import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { deleteReading, getReadingsByPeriod } from "@/services/storage";
import type { BloodPressureReading, TimePeriod } from "@/types/blood-pressure";
import {
  calculateStats,
  formatDate,
  formatTime,
  getBloodPressureLevel,
} from "@/utils/blood-pressure-utils";

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: "week", label: "1週間" },
  { key: "month", label: "1ヶ月" },
  { key: "halfYear", label: "半年" },
  { key: "year", label: "1年" },
];

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReadings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReadingsByPeriod(selectedPeriod);
      setReadings(data);
    } catch (error) {
      console.error("Failed to load readings:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      loadReadings();
    }, [loadReadings]),
  );

  const handleDelete = (id: string) => {
    Alert.alert("削除確認", "この測定データを削除しますか?", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReading(id);
            await loadReadings();
          } catch (error) {
            console.error("Failed to delete reading:", error);
            Alert.alert("エラー", "削除に失敗しました。");
          }
        },
      },
    ]);
  };

  const stats = calculateStats(readings);

  const renderReading = ({ item }: { item: BloodPressureReading }) => {
    const level = getBloodPressureLevel(item.systolic, item.diastolic);

    return (
      <ThemedView style={[styles.readingCard, { backgroundColor: colors.card }]}>
        <View style={styles.readingHeader}>
          <View>
            <ThemedText style={styles.readingDate}>{formatDate(item.measuredAt)}</ThemedText>
            <ThemedText style={styles.readingTime}>{formatTime(item.measuredAt)}</ThemedText>
          </View>
          <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
            <IconSymbol name="trash.fill" size={20} color={colors.icon} />
          </Pressable>
        </View>

        <View style={styles.readingValues}>
          <View style={styles.valueItem}>
            <ThemedText style={styles.valueLabel}>収縮期</ThemedText>
            <ThemedText style={[styles.valueNumber, { color: colors.tint }]}>
              {item.systolic}
            </ThemedText>
          </View>
          <View style={styles.valueItem}>
            <ThemedText style={styles.valueLabel}>拡張期</ThemedText>
            <ThemedText style={[styles.valueNumber, { color: colors.secondary }]}>
              {item.diastolic}
            </ThemedText>
          </View>
          <View style={styles.valueItem}>
            <ThemedText style={styles.valueLabel}>脈拍</ThemedText>
            <ThemedText style={[styles.valueNumber, { color: colors.icon }]}>
              {item.pulse}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.levelIndicator, { backgroundColor: level.color }]}>
          <ThemedText style={styles.levelText}>{level.label}</ThemedText>
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <ThemedText type="title" style={styles.title}>
          測定履歴
        </ThemedText>

        {/* 期間選択タブ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodTabs}
          contentContainerStyle={styles.periodTabsContent}
        >
          {PERIODS.map((period) => (
            <Pressable
              key={period.key}
              style={[
                styles.periodTab,
                {
                  backgroundColor:
                    selectedPeriod === period.key ? colors.tint : colors.card,
                },
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <ThemedText
                style={[
                  styles.periodTabText,
                  {
                    color: selectedPeriod === period.key ? "#FFFFFF" : colors.text,
                  },
                ]}
              >
                {period.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* 統計情報 */}
        {!loading && readings.length > 0 && (
          <ThemedView style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <ThemedText type="subtitle" style={styles.statsTitle}>
              統計情報
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>平均収縮期</ThemedText>
                <ThemedText style={[styles.statValue, { color: colors.tint }]}>
                  {stats.avgSystolic}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>平均拡張期</ThemedText>
                <ThemedText style={[styles.statValue, { color: colors.secondary }]}>
                  {stats.avgDiastolic}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>平均脈拍</ThemedText>
                <ThemedText style={[styles.statValue, { color: colors.icon }]}>
                  {stats.avgPulse}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>測定回数</ThemedText>
                <ThemedText style={styles.statValue}>{stats.totalReadings}</ThemedText>
              </View>
            </View>
          </ThemedView>
        )}

        {/* 測定データリスト */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : readings.length === 0 ? (
          <ThemedView style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.emptyText}>この期間の測定データがありません</ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={readings}
            renderItem={renderReading}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  title: {
    marginBottom: 16,
  },
  periodTabs: {
    marginBottom: 16,
  },
  periodTabsContent: {
    gap: 8,
  },
  periodTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statsTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 32,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
  },
  listContainer: {
    gap: 12,
  },
  readingCard: {
    padding: 16,
    borderRadius: 12,
  },
  readingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  readingDate: {
    fontSize: 16,
    fontWeight: "600",
  },
  readingTime: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  deleteButton: {
    padding: 4,
  },
  readingValues: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  valueItem: {
    alignItems: "center",
  },
  valueLabel: {
    fontSize: 10,
    marginBottom: 4,
    opacity: 0.7,
  },
  valueNumber: {
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 32,
  },
  levelIndicator: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "center",
  },
  levelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
