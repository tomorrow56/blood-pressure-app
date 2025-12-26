import * as fs from "fs";
import * as path from "path";

const API_URL = "http://localhost:3000/api/trpc/ocr.recognizeBloodPressure";

async function testBackendOCR() {
  console.log("=== Backend OCR Test ===\n");

  const testImages = [
    "/home/ubuntu/blood_pressure_app/test-images/test1.jpg",
    "/home/ubuntu/blood_pressure_app/test-images/test2.jpg",
  ];

  for (const imagePath of testImages) {
    console.log(`Testing: ${path.basename(imagePath)}`);

    if (!fs.existsSync(imagePath)) {
      console.log(`  ❌ Image not found: ${imagePath}\n`);
      continue;
    }

    try {
      // 画像をBase64エンコード
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString("base64");
      const imageUri = `data:image/jpeg;base64,${base64Image}`;

      // tRPC経由でOCRエンドポイントを呼び出し
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            imageUri,
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

      if (result.result?.data) {
        const data = result.result.data;
        console.log(`  ✅ SYS: ${data.sys}, DIA: ${data.dia}, PUL: ${data.pul}`);
        console.log(`  Confidence: ${Math.round(data.confidence * 100)}%`);
      } else {
        console.log(`  ❌ No data in response`);
      }
    } catch (error) {
      console.log(`  ❌ Error:`, error);
    }

    console.log("");
  }
}

testBackendOCR().catch(console.error);
