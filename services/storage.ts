/**
 * 血圧測定データのローカルストレージ管理
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BloodPressureReading, TimePeriod } from "@/types/blood-pressure";

const STORAGE_KEY = "blood_pressure_readings";

/**
 * すべての測定データを取得
 */
export async function getAllReadings(): Promise<BloodPressureReading[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const readings = JSON.parse(data) as BloodPressureReading[];
    // 日付の降順でソート（新しい順）
    return readings.sort(
      (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
    );
  } catch (error) {
    console.error("Failed to load readings:", error);
    return [];
  }
}

/**
 * 指定期間の測定データを取得
 */
export async function getReadingsByPeriod(period: TimePeriod): Promise<BloodPressureReading[]> {
  const allReadings = await getAllReadings();
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "halfYear":
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  return allReadings.filter((reading) => new Date(reading.measuredAt) >= startDate);
}

/**
 * 新しい測定データを保存
 */
export async function saveReading(
  reading: Omit<BloodPressureReading, "id" | "createdAt" | "updatedAt">,
): Promise<BloodPressureReading> {
  try {
    const allReadings = await getAllReadings();
    const now = new Date().toISOString();
    const newReading: BloodPressureReading = {
      ...reading,
      id: `bp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    allReadings.push(newReading);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allReadings));
    return newReading;
  } catch (error) {
    console.error("Failed to save reading:", error);
    throw error;
  }
}

/**
 * 測定データを更新
 */
export async function updateReading(
  id: string,
  updates: Partial<Omit<BloodPressureReading, "id" | "createdAt" | "updatedAt">>,
): Promise<BloodPressureReading | null> {
  try {
    const allReadings = await getAllReadings();
    const index = allReadings.findIndex((r) => r.id === id);

    if (index === -1) return null;

    const updatedReading: BloodPressureReading = {
      ...allReadings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    allReadings[index] = updatedReading;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allReadings));
    return updatedReading;
  } catch (error) {
    console.error("Failed to update reading:", error);
    throw error;
  }
}

/**
 * 測定データを削除
 */
export async function deleteReading(id: string): Promise<boolean> {
  try {
    const allReadings = await getAllReadings();
    const filteredReadings = allReadings.filter((r) => r.id !== id);

    if (filteredReadings.length === allReadings.length) return false;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredReadings));
    return true;
  } catch (error) {
    console.error("Failed to delete reading:", error);
    throw error;
  }
}

/**
 * 最新の測定データを取得
 */
export async function getLatestReading(): Promise<BloodPressureReading | null> {
  const readings = await getAllReadings();
  return readings.length > 0 ? readings[0] : null;
}

/**
 * すべてのデータをクリア（開発用）
 */
export async function clearAllReadings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear readings:", error);
    throw error;
  }
}
