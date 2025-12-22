/**
 * ストレージサービスのユニットテスト
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAllReadings,
  getReadingsByPeriod,
  saveReading,
  updateReading,
  deleteReading,
  getLatestReading,
  clearAllReadings,
} from "../services/storage";
import type { BloodPressureReading } from "../types/blood-pressure";

// AsyncStorageをモック
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("Storage Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllReadings", () => {
    it("should return empty array when no data exists", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const readings = await getAllReadings();
      expect(readings).toEqual([]);
    });

    it("should return sorted readings in descending order", async () => {
      const mockData: BloodPressureReading[] = [
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
          diastolic: 85,
          pulse: 75,
          measuredAt: "2024-01-02T10:00:00Z",
          createdAt: "2024-01-02T10:00:00Z",
          updatedAt: "2024-01-02T10:00:00Z",
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));
      const readings = await getAllReadings();

      expect(readings).toHaveLength(2);
      expect(readings[0].id).toBe("2"); // 新しい順
      expect(readings[1].id).toBe("1");
    });
  });

  describe("saveReading", () => {
    it("should save a new reading with generated id", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const newReading = {
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        measuredAt: "2024-01-01T10:00:00Z",
      };

      const saved = await saveReading(newReading);

      expect(saved.id).toBeDefined();
      expect(saved.systolic).toBe(120);
      expect(saved.diastolic).toBe(80);
      expect(saved.pulse).toBe(72);
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe("updateReading", () => {
    it("should update an existing reading", async () => {
      const mockData: BloodPressureReading[] = [
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

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const updated = await updateReading("1", { systolic: 125 });

      expect(updated).not.toBeNull();
      expect(updated?.systolic).toBe(125);
      expect(updated?.diastolic).toBe(80); // 変更されていない
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it("should return null for non-existent reading", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([]));

      const updated = await updateReading("non-existent", { systolic: 125 });

      expect(updated).toBeNull();
    });
  });

  describe("deleteReading", () => {
    it("should delete an existing reading", async () => {
      const mockData: BloodPressureReading[] = [
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

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const result = await deleteReading("1");

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it("should return false for non-existent reading", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([]));

      const result = await deleteReading("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("getLatestReading", () => {
    it("should return the most recent reading", async () => {
      const mockData: BloodPressureReading[] = [
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
          diastolic: 85,
          pulse: 75,
          measuredAt: "2024-01-02T10:00:00Z",
          createdAt: "2024-01-02T10:00:00Z",
          updatedAt: "2024-01-02T10:00:00Z",
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const latest = await getLatestReading();

      expect(latest).not.toBeNull();
      expect(latest?.id).toBe("2");
    });

    it("should return null when no readings exist", async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);

      const latest = await getLatestReading();

      expect(latest).toBeNull();
    });
  });

  describe("clearAllReadings", () => {
    it("should remove all readings", async () => {
      vi.mocked(AsyncStorage.removeItem).mockResolvedValue();

      await clearAllReadings();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("blood_pressure_readings");
    });
  });

  describe("getReadingsByPeriod", () => {
    it("should filter readings by week", async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const mockData: BloodPressureReading[] = [
        {
          id: "1",
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          measuredAt: weekAgo.toISOString(),
          createdAt: weekAgo.toISOString(),
          updatedAt: weekAgo.toISOString(),
        },
        {
          id: "2",
          systolic: 130,
          diastolic: 85,
          pulse: 75,
          measuredAt: twoWeeksAgo.toISOString(),
          createdAt: twoWeeksAgo.toISOString(),
          updatedAt: twoWeeksAgo.toISOString(),
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const readings = await getReadingsByPeriod("week");

      expect(readings).toHaveLength(1);
      expect(readings[0].id).toBe("1");
    });
  });
});
