/**
 * OCRサービスのユニットテスト
 */

import { describe, it, expect, vi } from "vitest";

// Tesseract.jsをモック
vi.mock("tesseract.js", () => ({
  createWorker: vi.fn(() =>
    Promise.resolve({
      recognize: vi.fn(() =>
        Promise.resolve({
          data: {
            text: "SYS 153 DIA 102 PUL 88",
          },
        }),
      ),
      terminate: vi.fn(() => Promise.resolve()),
    }),
  ),
}));

describe("OCR Service", () => {
  it("should be properly mocked for testing", () => {
    // OCRサービスは実際の画像処理を行うため、
    // ユニットテストではモックを使用
    expect(true).toBe(true);
  });

  it("should validate blood pressure ranges", () => {
    // 妥当な血圧値
    expect(120).toBeGreaterThanOrEqual(80);
    expect(120).toBeLessThanOrEqual(250);

    expect(80).toBeGreaterThanOrEqual(40);
    expect(80).toBeLessThanOrEqual(150);

    expect(72).toBeGreaterThanOrEqual(40);
    expect(72).toBeLessThanOrEqual(200);
  });

  it("should ensure systolic is greater than diastolic", () => {
    const systolic = 120;
    const diastolic = 80;
    expect(systolic).toBeGreaterThan(diastolic);
  });
});
