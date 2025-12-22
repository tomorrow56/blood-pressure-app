/**
 * 血圧データの統計計算とユーティリティ関数
 */

import type { BloodPressureReading, BloodPressureStats, ChartDataPoint } from "@/types/blood-pressure";

/**
 * 血圧レベルの判定
 */
export function getBloodPressureLevel(systolic: number, diastolic: number): {
  level: "normal" | "elevated" | "high1" | "high2" | "crisis";
  label: string;
  color: string;
} {
  if (systolic >= 180 || diastolic >= 120) {
    return { level: "crisis", label: "高血圧緊急症", color: "#B71C1C" };
  } else if (systolic >= 140 || diastolic >= 90) {
    return { level: "high2", label: "高血圧（Ⅱ度）", color: "#E53935" };
  } else if (systolic >= 130 || diastolic >= 85) {
    return { level: "high1", label: "高血圧（Ⅰ度）", color: "#FF9800" };
  } else if (systolic >= 120) {
    return { level: "elevated", label: "正常高値", color: "#FFC107" };
  } else {
    return { level: "normal", label: "正常", color: "#4CAF50" };
  }
}

/**
 * 測定データから統計情報を計算
 */
export function calculateStats(readings: BloodPressureReading[]): BloodPressureStats {
  if (readings.length === 0) {
    return {
      avgSystolic: 0,
      avgDiastolic: 0,
      avgPulse: 0,
      minSystolic: 0,
      maxSystolic: 0,
      minDiastolic: 0,
      maxDiastolic: 0,
      totalReadings: 0,
    };
  }

  const systolicValues = readings.map((r) => r.systolic);
  const diastolicValues = readings.map((r) => r.diastolic);
  const pulseValues = readings.map((r) => r.pulse);

  return {
    avgSystolic: Math.round(systolicValues.reduce((a, b) => a + b, 0) / readings.length),
    avgDiastolic: Math.round(diastolicValues.reduce((a, b) => a + b, 0) / readings.length),
    avgPulse: Math.round(pulseValues.reduce((a, b) => a + b, 0) / readings.length),
    minSystolic: Math.min(...systolicValues),
    maxSystolic: Math.max(...systolicValues),
    minDiastolic: Math.min(...diastolicValues),
    maxDiastolic: Math.max(...diastolicValues),
    totalReadings: readings.length,
  };
}

/**
 * グラフ用のデータポイントに変換
 */
export function convertToChartData(readings: BloodPressureReading[]): ChartDataPoint[] {
  return readings
    .map((reading) => ({
      date: new Date(reading.measuredAt).toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      }),
      systolic: reading.systolic,
      diastolic: reading.diastolic,
      pulse: reading.pulse,
    }))
    .reverse(); // 古い順に並べ替え（グラフ表示用）
}

/**
 * 日時を読みやすい形式にフォーマット
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 日付のみをフォーマット
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 時刻のみをフォーマット
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
