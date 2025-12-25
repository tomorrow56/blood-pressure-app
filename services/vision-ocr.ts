/**
 * Google Cloud Vision API OCRサービス
 * 
 * Google Cloud Vision APIを使用して血圧計の数字を認識します。
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VISION_API_KEY_STORAGE_KEY = '@vision_api_key';
const VISION_API_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

export interface VisionOCRResult {
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  confidence: number;
  rawText: string;
}

/**
 * Google Cloud Vision APIキーを設定
 */
export async function setVisionAPIKey(apiKey: string): Promise<void> {
  await AsyncStorage.setItem(VISION_API_KEY_STORAGE_KEY, apiKey);
}

/**
 * Google Cloud Vision APIキーを取得
 */
export async function getVisionAPIKey(): Promise<string | null> {
  return await AsyncStorage.getItem(VISION_API_KEY_STORAGE_KEY);
}

/**
 * Google Cloud Vision APIキーが設定されているか確認
 */
export async function hasVisionAPIKey(): Promise<boolean> {
  const apiKey = await getVisionAPIKey();
  return apiKey !== null && apiKey.length > 0;
}

/**
 * 画像をBase64エンコード
 */
async function encodeImageToBase64(imageUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
    return base64;
  } catch (error) {
    console.error('[Vision OCR] Error encoding image:', error);
    throw new Error('画像のエンコードに失敗しました');
  }
}

/**
 * Google Cloud Vision APIで画像を認識
 */
export async function recognizeWithVisionAPI(
  imageUri: string,
  onProgress?: (progress: number) => void,
): Promise<VisionOCRResult | null> {
  try {
    onProgress?.(0.1);
    console.log('[Vision OCR] Starting recognition...');

    // APIキーを取得
    const apiKey = await getVisionAPIKey();
    if (!apiKey) {
      console.error('[Vision OCR] API key not set');
      throw new Error('Google Cloud Vision APIキーが設定されていません');
    }

    onProgress?.(0.2);

    // 画像をBase64エンコード
    const base64Image = await encodeImageToBase64(imageUri);
    onProgress?.(0.4);

    // Vision APIリクエスト
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 10,
            },
          ],
          imageContext: {
            languageHints: ['en'], // 数字認識のため英語を指定
          },
        },
      ],
    };

    console.log('[Vision OCR] Sending request to Vision API...');
    onProgress?.(0.5);

    const response = await fetch(`${VISION_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    onProgress?.(0.7);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Vision OCR] API error:', errorText);
      throw new Error(`Vision API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    onProgress?.(0.8);

    // レスポンスを解析
    if (!data.responses || !data.responses[0] || !data.responses[0].textAnnotations) {
      console.error('[Vision OCR] No text detected');
      return null;
    }

    const textAnnotations = data.responses[0].textAnnotations;
    const fullText = textAnnotations[0]?.description || '';
    
    console.log('[Vision OCR] Detected text:', fullText);

    // 血圧データを抽出
    const result = extractBloodPressureFromText(fullText);
    onProgress?.(1.0);

    return result;
  } catch (error) {
    console.error('[Vision OCR] Error:', error);
    throw error;
  }
}

/**
 * 認識したテキストから血圧データを抽出
 */
function extractBloodPressureFromText(text: string): VisionOCRResult {
  console.log('[Vision OCR] Extracting blood pressure data from text...');

  // 改行とスペースを正規化
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  console.log('[Vision OCR] Normalized text:', normalizedText);

  // 数字を抽出
  const numbers = normalizedText.match(/\d+/g)?.map(Number) || [];
  console.log('[Vision OCR] Extracted numbers:', numbers);

  let systolic: number | null = null;
  let diastolic: number | null = null;
  let pulse: number | null = null;

  // パターン1: SYS/DIA/PULラベルを探す
  const sysMatch = text.match(/SYS[^\d]*(\d{2,3})/i);
  const diaMatch = text.match(/DIA[^\d]*(\d{2,3})/i);
  const pulMatch = text.match(/PUL[^\d]*(\d{2,3})/i);

  if (sysMatch) {
    systolic = parseInt(sysMatch[1]);
    console.log('[Vision OCR] Found SYS label:', systolic);
  }
  if (diaMatch) {
    diastolic = parseInt(diaMatch[1]);
    console.log('[Vision OCR] Found DIA label:', diastolic);
  }
  if (pulMatch) {
    pulse = parseInt(pulMatch[1]);
    console.log('[Vision OCR] Found PUL label:', pulse);
  }

  // パターン2: 数値の範囲と順序で推測
  if (!systolic || !diastolic || !pulse) {
    // 血圧値の範囲でフィルタリング
    const validNumbers = numbers.filter(n => n >= 30 && n <= 250);
    console.log('[Vision OCR] Valid numbers (30-250):', validNumbers);

    if (validNumbers.length >= 3) {
      // 最初の3つを使用
      systolic = systolic || validNumbers[0];
      diastolic = diastolic || validNumbers[1];
      pulse = pulse || validNumbers[2];
      console.log('[Vision OCR] Using first 3 valid numbers');
    } else if (validNumbers.length === 2) {
      // 2つの場合は収縮期と拡張期のみ
      systolic = systolic || validNumbers[0];
      diastolic = diastolic || validNumbers[1];
      console.log('[Vision OCR] Using first 2 valid numbers');
    }
  }

  // 信頼度を計算
  let confidence = 0;
  if (systolic && diastolic && pulse) {
    confidence = 0.9; // 3つ全て取得できた
  } else if (systolic && diastolic) {
    confidence = 0.7; // 2つ取得できた
  } else if (systolic || diastolic) {
    confidence = 0.4; // 1つだけ取得できた
  }

  console.log('[Vision OCR] Extracted values:', { systolic, diastolic, pulse, confidence });

  return {
    systolic,
    diastolic,
    pulse,
    confidence,
    rawText: text,
  };
}
