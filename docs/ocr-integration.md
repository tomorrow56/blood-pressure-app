# OCR統合ガイド

現在、カメラ画面は実装済みですが、OCR機能はモックデータを返すようになっています。
実際のOCR APIを統合するには、以下の手順に従ってください。

## 推奨OCRサービス

### 1. Google Cloud Vision API
- **精度**: 高い
- **コスト**: 月1000リクエストまで無料、その後$1.50/1000リクエスト
- **統合の難易度**: 中程度

### 2. Tesseract.js（オープンソース）
- **精度**: 中程度（日本語数字の認識は良好）
- **コスト**: 無料
- **統合の難易度**: 低い

### 3. AWS Textract
- **精度**: 高い
- **コスト**: 月1000ページまで無料、その後$1.50/1000ページ
- **統合の難易度**: 中程度

## 実装手順（Google Cloud Vision APIの例）

### ステップ1: Google Cloud Vision APIの設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. Cloud Vision APIを有効化
3. APIキーを作成

### ステップ2: 依存関係のインストール

```bash
pnpm add @google-cloud/vision
```

### ステップ3: OCR関数の実装

`app/camera.tsx`の`extractBloodPressureData`関数を以下のように置き換えます：

```typescript
import vision from "@google-cloud/vision";

async function extractBloodPressureData(imageUri: string): Promise<{
  systolic: number;
  diastolic: number;
  pulse: number;
} | null> {
  try {
    // Google Cloud Vision APIクライアントを初期化
    const client = new vision.ImageAnnotatorClient({
      keyFilename: "path/to/your/service-account-key.json",
    });

    // 画像をBase64エンコード
    const imageBuffer = await fetch(imageUri).then((res) => res.arrayBuffer());
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // OCR実行
    const [result] = await client.textDetection({
      image: { content: base64Image },
    });

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      return null;
    }

    // テキストから数値を抽出
    const text = detections[0].description || "";
    console.log("Detected text:", text);

    // 正規表現で数値を抽出
    // 例: "SYS 153 DIA 102 PUL 88" のようなパターンを想定
    const sysMatch = text.match(/SYS[:\s]*(\d{2,3})/i);
    const diaMatch = text.match(/DIA[:\s]*(\d{2,3})/i);
    const pulMatch = text.match(/PUL[:\s]*(\d{2,3})/i);

    if (!sysMatch || !diaMatch || !pulMatch) {
      return null;
    }

    return {
      systolic: parseInt(sysMatch[1], 10),
      diastolic: parseInt(diaMatch[1], 10),
      pulse: parseInt(pulMatch[1], 10),
    };
  } catch (error) {
    console.error("OCR error:", error);
    return null;
  }
}
```

### ステップ4: 環境変数の設定

APIキーを安全に管理するため、環境変数を使用します：

1. `.env`ファイルを作成：

```
GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
```

2. `app.config.ts`で環境変数を読み込み：

```typescript
extra: {
  googleCloudVisionApiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
}
```

3. アプリ内で環境変数を使用：

```typescript
import Constants from "expo-constants";

const apiKey = Constants.expoConfig?.extra?.googleCloudVisionApiKey;
```

## テストデータ

現在のモック実装では、以下のデータを返します：

- 収縮期血圧（SYS）: 120 mmHg
- 拡張期血圧（DIA）: 80 mmHg
- 脈拍（PUL）: 72 /min

実際のOCR統合後は、撮影した画像から自動的にデータを抽出します。

## トラブルシューティング

### 認識精度が低い場合

1. **画像の明るさを調整**: カメラ撮影時に十分な照明を確保
2. **画像の解像度を上げる**: `takePictureAsync`のオプションで`quality: 1`を設定
3. **前処理を追加**: 画像のコントラストを上げる、グレースケール化など
4. **正規表現パターンを調整**: 血圧計の表示形式に合わせてパターンを最適化

### エラーハンドリング

OCR APIが失敗した場合、ユーザーに手動入力を促すようにしています。
エラーメッセージを改善して、ユーザーエクスペリエンスを向上させることができます。
