/**
 * OCRサービス - Google Cloud Vision APIを使用した血圧計画面の数値認識
 */

import { recognizeWithVisionAPI, hasVisionAPIKey } from './vision-ocr';

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
    console.log('[OCR] Starting blood pressure recognition...');
    onProgress?.(0.1);

    // Vision APIキーが設定されているか確認
    const hasApiKey = await hasVisionAPIKey();
    if (!hasApiKey) {
      console.error('[OCR] Vision API key not set');
      throw new Error('Google Cloud Vision APIキーが設定されていません。設定画面でAPIキーを設定してください。');
    }

    // Vision APIで認識
    const result = await recognizeWithVisionAPI(imageUri, onProgress);

    if (!result) {
      console.error('[OCR] Vision API returned no result');
      return null;
    }

    // 結果を変換
    if (!result.systolic && !result.diastolic) {
      console.error('[OCR] No valid blood pressure data extracted');
      return null;
    }

    return {
      systolic: result.systolic || 120,
      diastolic: result.diastolic || 80,
      pulse: result.pulse || 72,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error('[OCR] Error during OCR:', error);
    throw error;
  }
}

// 後方互換性のため、vision-ocrの関数をエクスポート
export { setVisionAPIKey, getVisionAPIKey, hasVisionAPIKey } from './vision-ocr';
