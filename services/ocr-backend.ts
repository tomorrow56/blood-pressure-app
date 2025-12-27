/**
 * OCRサービス（バックエンド経由）
 * 
 * バックエンドサーバーのVision APIエンドポイントを使用して血圧計の数字を認識します。
 */

import { trpc } from '@/lib/trpc';
import { getApiBaseUrl } from '@/constants/oauth';
import superjson from 'superjson';

export interface OCRResult {
  sys: number | null;
  dia: number | null;
  pul: number | null;
  confidence: number;
  fullText: string;
}

/**
 * 血圧計の画像を認識する
 */
export async function recognizeBloodPressureImage(imageUri: string): Promise<OCRResult> {
  try {
    console.log('[OCR] Starting recognition via backend...');

    // 画像をBase64に変換
    const imageResponse = await fetch(imageUri);
    const blob = await imageResponse.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // data:image/jpeg;base64, を削除
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    console.log('[OCR] Image converted to base64, calling backend...');

    // API URLをログ出力
    const apiUrl = `${getApiBaseUrl()}/api/trpc/ocr.recognizeBloodPressure`;
    console.log('[OCR] API URL:', apiUrl);

    // バックエンドのOCRエンドポイントを呼び出す
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        json: { imageBase64: base64 },
      }),
    });

    console.log('[OCR] Response status:', apiResponse.status);
    console.log('[OCR] Response ok:', apiResponse.ok);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log('[OCR] Error response:', errorText);
      throw new Error(`HTTP error! status: ${apiResponse.status}, details: ${errorText}`);
    }
    
    const data = await apiResponse.json();
    console.log('[OCR] Raw response data:', data);

    if (!data || !data.result || !data.result.data) {
      console.log('[OCR] Invalid response structure:', data);
      throw new Error('Invalid response structure from backend');
    }

    console.log('[OCR] Response data.json:', data.result.data.json);

    // superjson を使わずに直接解析
    const result = data.result.data.json as {
      success: boolean;
      fullText: string;
      sys: number | null;
      dia: number | null;
      pul: number | null;
      confidence: number;
    };

    console.log('[OCR] Backend response:', result);

    if (!result.success) {
      throw new Error('OCR recognition failed');
    }

    return {
      sys: result.sys,
      dia: result.dia,
      pul: result.pul,
      confidence: result.confidence,
      fullText: result.fullText,
    };
  } catch (error) {
    console.error('[OCR] Recognition error:', error);
    throw error;
  }
}

/**
 * Vision APIの設定状態を確認
 */
export async function checkOCRConfiguration(): Promise<{
  configured: boolean;
  message: string;
}> {
  try {
    const configResponse = await fetch(`${getApiBaseUrl()}/api/trpc/ocr.checkConfiguration`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!configResponse.ok) {
      throw new Error(`HTTP error! status: ${configResponse.status}`);
    }
    
    const data = await configResponse.json();
    const result = superjson.deserialize(data.result.data.json) as {
      configured: boolean;
      message: string;
    };
    return result;
  } catch (error) {
    console.error('[OCR] Configuration check error:', error);
    return {
      configured: false,
      message: 'Failed to check configuration',
    };
  }
}
