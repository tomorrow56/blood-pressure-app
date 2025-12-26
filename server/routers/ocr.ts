/**
 * OCR Router
 * Google Cloud Vision APIを使用した血圧計画像認識
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Google Vision APIクライアントの初期化
let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient() {
  if (!visionClient) {
    const keyPath = path.join(process.cwd(), 'google-key.json');
    
    if (fs.existsSync(keyPath)) {
      visionClient = new ImageAnnotatorClient({
        keyFilename: keyPath,
      });
      console.log('[OCR] Google Vision API initialized with service account');
    } else {
      console.warn('[OCR] google-key.json not found. OCR will not work.');
    }
  }
  
  return visionClient;
}

/**
 * 血圧計画像を前処理する
 * 添付コードで成功した画像処理パラメータを使用
 */
async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize({ width: 2200 }) // 1. 巨大化して細い線を太くする
    .grayscale()
    .clahe({ width: 100, height: 100 }) // 2. 適応的ヒストグラム均等化（影と反射を均一化）
    .gamma(2.5) // 3. ガンマ補正（文字のグレーを濃く沈める）
    .sharpen({ sigma: 1.5 }) // 4. シャープネス（輪郭をパキッとさせる）
    .toBuffer();
}

/**
 * 血圧計の数値を抽出する
 */
function extractBloodPressureValues(text: string): {
  sys: number | null;
  dia: number | null;
  pul: number | null;
  confidence: number;
} {
  // 2〜3桁の数字を抽出
  const numbers = text.match(/\d{2,3}/g);
  
  if (!numbers || numbers.length === 0) {
    return { sys: null, dia: null, pul: null, confidence: 0 };
  }

  // 40-250の範囲でフィルタリング（日付などのノイズを除去）
  const filtered = numbers
    .map(n => parseInt(n))
    .filter(n => n >= 40 && n <= 250);

  // 重複を削除
  const unique = [...new Set(filtered)];

  console.log('[OCR] Extracted numbers:', unique);

  // 血圧値の推定
  // 通常、SYS > DIA > PUL の順で大きい
  let sys: number | null = null;
  let dia: number | null = null;
  let pul: number | null = null;

  if (unique.length >= 3) {
    // 3つ以上の数値がある場合、大きい順にソート
    const sorted = unique.sort((a, b) => b - a);
    sys = sorted[0]; // 最大値 = SYS
    dia = sorted[1]; // 2番目 = DIA
    pul = sorted[2]; // 3番目 = PUL
  } else if (unique.length === 2) {
    // 2つの場合、大きい方がSYS、小さい方がDIA
    const sorted = unique.sort((a, b) => b - a);
    sys = sorted[0];
    dia = sorted[1];
  } else if (unique.length === 1) {
    // 1つの場合、SYSとして扱う
    sys = unique[0];
  }

  // 信頼度の計算（3つ全て取得できた場合は高信頼度）
  const confidence = unique.length >= 3 ? 0.9 : unique.length >= 2 ? 0.6 : 0.3;

  return { sys, dia, pul, confidence };
}

export const ocrRouter = router({
  /**
   * 血圧計画像を認識する
   */
  recognizeBloodPressure: publicProcedure
    .input(
      z.object({
        imageBase64: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const client = getVisionClient();
      
      if (!client) {
        throw new Error('Google Vision API is not configured. Please add google-key.json to the server directory.');
      }

      try {
        // Base64をBufferに変換
        const imageBuffer = Buffer.from(input.imageBase64, 'base64');

        // 画像を前処理
        console.log('[OCR] Preprocessing image...');
        const processedImageBuffer = await preprocessImage(imageBuffer);

        // Vision APIで認識
        console.log('[OCR] Calling Vision API...');
        const request = {
          image: { content: processedImageBuffer },
          features: [{ type: 'TEXT_DETECTION' as const }],
          imageContext: { languageHints: ['en'] },
        };

        const [result] = await client.annotateImage(request);
        const fullText = result.fullTextAnnotation?.text || '';

        console.log('[OCR] Recognition result:', fullText);

        // 血圧値を抽出
        const values = extractBloodPressureValues(fullText);

        return {
          success: true,
          fullText,
          sys: values.sys,
          dia: values.dia,
          pul: values.pul,
          confidence: values.confidence,
        };
      } catch (error) {
        console.error('[OCR] Recognition error:', error);
        throw new Error(`OCR recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Vision APIの設定状態を確認
   */
  checkConfiguration: publicProcedure.query(() => {
    const keyPath = path.join(process.cwd(), 'google-key.json');
    const exists = fs.existsSync(keyPath);
    
    return {
      configured: exists,
      message: exists
        ? 'Google Vision API is configured'
        : 'google-key.json not found. Please add it to the server directory.',
    };
  }),
});
