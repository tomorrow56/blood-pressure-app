import * as fs from "fs";
import * as path from "path";

const API_URL = "http://localhost:3000/api/trpc/ocr.recognizeBloodPressure";

async function testBackendOCR() {
  console.log("=== Backend OCR Test ===\n");

  const testImages = [
    "./test-images/test1.jpg",
    "./test-images/test2.jpg",
  ];

  for (const imagePath of testImages) {
    console.log(`Testing: ${path.basename(imagePath)}`);

    if (!fs.existsSync(imagePath)) {
      console.log(`  ❌ Image not found: ${imagePath}\n`);
      continue;
    }

    try {
      // 画像をBase64エンコード（Node.jsファイルシステム使用）
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // tRPC経由でOCRエンドポイントを呼び出し
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: {
            imageBase64: base64Image,
          },
        }),
      });

      if (!response.ok) {
        console.log(`  ❌ HTTP Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`  Error details: ${errorText}\n`);
        continue;
      }

      const result = await response.json();
      console.log(`  Result:`, result);

      if (result.result?.data?.json) {
        const data = result.result.data.json;
        console.log(`  ✅ SYS: ${data.sys}, DIA: ${data.dia}, PUL: ${data.pul}`);
        console.log(`  Confidence: ${Math.round((data.confidence || 0) * 100)}%`);
        console.log(`  Full text: "${data.fullText}"`);
      } else {
        console.log(`  ❌ No data in response`);
        console.log(`  Response structure:`, JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.log(`  ❌ Error:`, error);
    }

    console.log("");
  }
}

testBackendOCR().catch(console.error);
