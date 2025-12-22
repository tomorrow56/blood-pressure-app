/**
 * 血圧ユーティリティ関数のユニットテスト
 */

import { describe, it, expect } from "vitest";
import {
  getBloodPressureLevel,
  calculateStats,
  convertToChartData,
  formatDateTime,
  formatDate,
  formatTime,
} from "../utils/blood-pressure-utils";
import type { BloodPressureReading } from "../types/blood-pressure";

describe("Blood Pressure Utils", () => {
  describe("getBloodPressureLevel", () => {
    it("should return normal for healthy blood pressure", () => {
      const result = getBloodPressureLevel(115, 75);
      expect(result.level).toBe("normal");
      expect(result.label).toBe("正常");
      expect(result.color).toBe("#4CAF50");
    });

    it("should return elevated for slightly high systolic", () => {
      const result = getBloodPressureLevel(125, 75);
      expect(result.level).toBe("elevated");
      expect(result.label).toBe("正常高値");
      expect(result.color).toBe("#FFC107");
    });

    it("should return high1 for stage 1 hypertension", () => {
      const result = getBloodPressureLevel(135, 87);
      expect(result.level).toBe("high1");
      expect(result.label).toBe("高血圧（Ⅰ度）");
      expect(result.color).toBe("#FF9800");
    });

    it("should return high2 for stage 2 hypertension", () => {
      const result = getBloodPressureLevel(145, 95);
      expect(result.level).toBe("high2");
      expect(result.label).toBe("高血圧（Ⅱ度）");
      expect(result.color).toBe("#E53935");
    });

    it("should return crisis for hypertensive crisis", () => {
      const result = getBloodPressureLevel(185, 125);
      expect(result.level).toBe("crisis");
      expect(result.label).toBe("高血圧緊急症");
      expect(result.color).toBe("#B71C1C");
    });

    it("should prioritize diastolic when determining level", () => {
      const result = getBloodPressureLevel(115, 92);
      expect(result.level).toBe("high2");
    });
  });

  describe("calculateStats", () => {
    it("should return zeros for empty readings", () => {
      const stats = calculateStats([]);
      expect(stats.avgSystolic).toBe(0);
      expect(stats.avgDiastolic).toBe(0);
      expect(stats.avgPulse).toBe(0);
      expect(stats.totalReadings).toBe(0);
    });

    it("should calculate correct averages", () => {
      const readings: BloodPressureReading[] = [
        {
          id: "1",
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          measuredAt: "2024-01-01T10:00:00Z",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
        },
        {
          id: "2",
          systolic: 130,
          diastolic: 90,
          pulse: 78,
          measuredAt: "2024-01-02T10:00:00Z",
          createdAt: "2024-01-02T10:00:00Z",
          updatedAt: "2024-01-02T10:00:00Z",
        },
      ];

      const stats = calculateStats(readings);

      expect(stats.avgSystolic).toBe(125);
      expect(stats.avgDiastolic).toBe(85);
      expect(stats.avgPulse).toBe(75);
      expect(stats.minSystolic).toBe(120);
      expect(stats.maxSystolic).toBe(130);
      expect(stats.minDiastolic).toBe(80);
      expect(stats.maxDiastolic).toBe(90);
      expect(stats.totalReadings).toBe(2);
    });
  });

  describe("convertToChartData", () => {
    it("should convert readings to chart data points", () => {
      // 入力は新しい順（getAllReadingsの戻り値を想定）
      const readings: BloodPressureReading[] = [
        {
          id: "2",
          systolic: 130,
          diastolic: 90,
          pulse: 78,
          measuredAt: "2024-01-02T10:00:00Z",
          createdAt: "2024-01-02T10:00:00Z",
          updatedAt: "2024-01-02T10:00:00Z",
        },
        {
          id: "1",
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          measuredAt: "2024-01-01T10:00:00Z",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
        },
      ];

      const chartData = convertToChartData(readings);

      expect(chartData).toHaveLength(2);
      // convertToChartDataはreverse()するので、古い順に並び替えられる
      expect(chartData[0].systolic).toBe(120); // 1月1日
      expect(chartData[0].diastolic).toBe(80);
      expect(chartData[0].pulse).toBe(72);
      expect(chartData[1].systolic).toBe(130); // 1月2日
      expect(chartData[0].date).toBeDefined();
    });

    it("should reverse order for chronological display", () => {
      const readings: BloodPressureReading[] = [
        {
          id: "1",
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          measuredAt: "2024-01-02T10:00:00Z",
          createdAt: "2024-01-02T10:00:00Z",
          updatedAt: "2024-01-02T10:00:00Z",
        },
        {
          id: "2",
          systolic: 130,
          diastolic: 90,
          pulse: 78,
          measuredAt: "2024-01-01T10:00:00Z",
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-01T10:00:00Z",
        },
      ];

      const chartData = convertToChartData(readings);

      // 古い順に並び替えられているはず
      expect(chartData[0].systolic).toBe(130); // 1月1日
      expect(chartData[1].systolic).toBe(120); // 1月2日
    });
  });

  describe("formatDateTime", () => {
    it("should format ISO string to Japanese datetime", () => {
      const isoString = "2024-01-15T14:30:00Z";
      const formatted = formatDateTime(isoString);
      // 日本語ロケールでフォーマットされることを確認
      expect(formatted).toContain("2024");
      expect(formatted).toContain("01");
      expect(formatted).toContain("15");
    });
  });

  describe("formatDate", () => {
    it("should format ISO string to Japanese date", () => {
      const isoString = "2024-01-15T14:30:00Z";
      const formatted = formatDate(isoString);
      expect(formatted).toContain("2024");
      expect(formatted).toContain("01");
      expect(formatted).toContain("15");
    });
  });

  describe("formatTime", () => {
    it("should format ISO string to Japanese time", () => {
      const isoString = "2024-01-15T14:30:00Z";
      const formatted = formatTime(isoString);
      // 時刻が含まれることを確認
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });
  });
});
