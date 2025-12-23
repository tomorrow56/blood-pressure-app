/**
 * OCRサービス - Tesseract.jsを使用した血圧計画面の数値認識
 */

import { createWorker } from "tesseract.js";

export interface BloodPressureOCRResult {
  systolic: number;
  diastolic: number;
  pulse: number;
  confidence: number;
}

/**
 * 画像から血圧データを抽出
 */
export async function extractBloodPressureData(
  imageUri: string,
  onProgress?: (progress: number) => void,
): Promise<BloodPressureOCRResult | null> {
  try {
    // Tesseract.jsワーカーを初期化
    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(m.progress);
        }
      },
    });

    // OCR実行
    const {
      data: { text },
    } = await worker.recognize(imageUri);

    console.log("[OCR] Recognized text:", text);

    // ワーカーを終了
    await worker.terminate();

    // テキストから数値を抽出
    const result = parseBloodPressureText(text);

    return result;
  } catch (error) {
    console.error("[OCR] Error:", error);
    return null;
  }
}

/**
 * OCRで認識したテキストから血圧データをパース
 */
function parseBloodPressureText(text: string): BloodPressureOCRResult | null {
  // テキストを正規化（改行をスペースに、複数スペースを1つに）
  const normalizedText = text.replace(/\s+/g, " ").toUpperCase();

  console.log("[OCR] Normalized text:", normalizedText);

  // 数値を全て抽出
  const numbers = normalizedText.match(/\d{2,3}/g);

  if (!numbers || numbers.length < 3) {
    console.log("[OCR] Not enough numbers found:", numbers);
    return null;
  }

  console.log("[OCR] Found numbers:", numbers);

  // パターン1: "SYS", "DIA", "PUL" のラベルを探す
  const sysMatch = normalizedText.match(/SYS[:\s]*(\d{2,3})/);
  const diaMatch = normalizedText.match(/DIA[:\s]*(\d{2,3})/);
  const pulMatch = normalizedText.match(/PUL[:\s]*(\d{2,3})/);

  if (sysMatch && diaMatch && pulMatch) {
    const systolic = parseInt(sysMatch[1], 10);
    const diastolic = parseInt(diaMatch[1], 10);
    const pulse = parseInt(pulMatch[1], 10);

    if (isValidBloodPressure(systolic, diastolic, pulse)) {
      return {
        systolic,
        diastolic,
        pulse,
        confidence: 0.9,
      };
    }
  }

  // パターン2: 数値の順序から推測（大きい順に SYS, DIA, PUL）
  const numValues = numbers.map((n) => parseInt(n, 10)).filter((n) => n > 0 && n < 300);

  if (numValues.length >= 3) {
    // 血圧の範囲で妥当な値を探す
    const systolicCandidates = numValues.filter((n) => n >= 80 && n <= 250);
    const diastolicCandidates = numValues.filter((n) => n >= 40 && n <= 150);
    const pulseCandidates = numValues.filter((n) => n >= 40 && n <= 200);

    // 最も妥当な組み合わせを探す
    for (const sys of systolicCandidates) {
      for (const dia of diastolicCandidates) {
        for (const pul of pulseCandidates) {
          if (sys > dia && isValidBloodPressure(sys, dia, pul)) {
            return {
              systolic: sys,
              diastolic: dia,
              pulse: pul,
              confidence: 0.7,
            };
          }
        }
      }
    }
  }

  // パターン3: 最初の3つの数値を使用（フォールバック）
  if (numValues.length >= 3) {
    // 数値を降順にソート
    const sorted = [...numValues].sort((a, b) => b - a);

    // 最も大きい値をSYS、次をDIA、次をPULと仮定
    const systolic = sorted[0];
    const diastolic = sorted[1];
    const pulse = sorted[2];

    if (isValidBloodPressure(systolic, diastolic, pulse)) {
      return {
        systolic,
        diastolic,
        pulse,
        confidence: 0.5,
      };
    }
  }

  console.log("[OCR] Could not parse blood pressure data");
  return null;
}

/**
 * 血圧データの妥当性をチェック
 */
function isValidBloodPressure(systolic: number, diastolic: number, pulse: number): boolean {
  // 収縮期血圧: 80-250 mmHg
  if (systolic < 80 || systolic > 250) return false;

  // 拡張期血圧: 40-150 mmHg
  if (diastolic < 40 || diastolic > 150) return false;

  // 脈拍: 40-200 /min
  if (pulse < 40 || pulse > 200) return false;

  // 収縮期 > 拡張期
  if (systolic <= diastolic) return false;

  return true;
}
