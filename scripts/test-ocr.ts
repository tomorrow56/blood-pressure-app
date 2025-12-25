/**
 * OCR認識テストスクリプト
 * 
 * 添付された血圧計画像でOCR認識をテストし、結果を出力します。
 */

import { createWorker } from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OCRResult {
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  confidence: number;
  rawText: string;
}

async function testOCR(imagePath: string): Promise<OCRResult> {
  console.log(`\n=== Testing OCR on: ${path.basename(imagePath)} ===`);
  
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        process.stdout.write(`\rProgress: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  try {
    // OCR設定
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789SYSDIAPULmHg/in',
      tessedit_pageseg_mode: 11 as any, // SPARSE_TEXT
    });

    const { data } = await worker.recognize(imagePath);
    console.log(`\n\nRaw OCR Text:\n${data.text}`);
    console.log(`\nConfidence: ${data.confidence.toFixed(2)}%`);

    // 数値を抽出
    const numbers = data.text.match(/\d+/g)?.map(Number) || [];
    console.log(`\nExtracted numbers: ${numbers.join(', ')}`);

    // 血圧データを推測
    let systolic: number | null = null;
    let diastolic: number | null = null;
    let pulse: number | null = null;

    // パターン1: SYS/DIA/PULラベルを探す
    const sysMatch = data.text.match(/SYS[^\d]*(\d{2,3})/i);
    const diaMatch = data.text.match(/DIA[^\d]*(\d{2,3})/i);
    const pulMatch = data.text.match(/PUL[^\d]*(\d{2,3})/i);

    if (sysMatch) systolic = parseInt(sysMatch[1]);
    if (diaMatch) diastolic = parseInt(diaMatch[1]);
    if (pulMatch) pulse = parseInt(pulMatch[1]);

    // パターン2: 数値の範囲で推測
    if (!systolic || !diastolic || !pulse) {
      const validNumbers = numbers.filter(n => n >= 30 && n <= 250);
      
      if (validNumbers.length >= 3) {
        // 最初の3つの数値を使用
        systolic = systolic || validNumbers[0];
        diastolic = diastolic || validNumbers[1];
        pulse = pulse || validNumbers[2];
      }
    }

    console.log(`\nExtracted values:`);
    console.log(`  SYS: ${systolic || 'N/A'}`);
    console.log(`  DIA: ${diastolic || 'N/A'}`);
    console.log(`  PUL: ${pulse || 'N/A'}`);

    return {
      systolic,
      diastolic,
      pulse,
      confidence: data.confidence,
      rawText: data.text,
    };
  } finally {
    await worker.terminate();
  }
}

async function main() {
  const testImagesDir = '/home/ubuntu/blood_pressure_app/test-images';
  const images = [
    path.join(testImagesDir, '認識テスト用1.jpg'),
    path.join(testImagesDir, '認識テスト用2.jpg'),
  ];

  console.log('Blood Pressure OCR Test');
  console.log('=======================\n');

  const results: { image: string; result: OCRResult }[] = [];

  for (const imagePath of images) {
    if (!fs.existsSync(imagePath)) {
      console.error(`Image not found: ${imagePath}`);
      continue;
    }

    const result = await testOCR(imagePath);
    results.push({ image: path.basename(imagePath), result });
  }

  // サマリー
  console.log('\n\n=== Summary ===');
  results.forEach(({ image, result }) => {
    console.log(`\n${image}:`);
    console.log(`  SYS: ${result.systolic || 'Failed'}`);
    console.log(`  DIA: ${result.diastolic || 'Failed'}`);
    console.log(`  PUL: ${result.pulse || 'Failed'}`);
    console.log(`  Confidence: ${result.confidence.toFixed(2)}%`);
  });

  // 成功率
  const successCount = results.filter(r => 
    r.result.systolic && r.result.diastolic && r.result.pulse
  ).length;
  console.log(`\nSuccess rate: ${successCount}/${results.length} (${(successCount / results.length * 100).toFixed(0)}%)`);
}

main().catch(console.error);
