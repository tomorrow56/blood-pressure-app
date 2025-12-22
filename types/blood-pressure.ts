/**
 * 血圧測定データの型定義
 */

export interface BloodPressureReading {
  id: string;
  systolic: number; // 収縮期血圧 (SYS)
  diastolic: number; // 拡張期血圧 (DIA)
  pulse: number; // 脈拍 (PUL)
  measuredAt: string; // ISO 8601形式の日時文字列
  note?: string; // メモ（オプション）
  createdAt: string; // 作成日時
  updatedAt: string; // 更新日時
}

export interface BloodPressureStats {
  avgSystolic: number;
  avgDiastolic: number;
  avgPulse: number;
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
  totalReadings: number;
}

export type TimePeriod = "week" | "month" | "halfYear" | "year";

export interface ChartDataPoint {
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
}
