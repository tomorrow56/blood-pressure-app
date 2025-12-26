# OCR機能テスト手順書

血圧管理アプリのOCR機能をテストするための手順書です。

## 🎯 テスト概要

このアプリでは2種類のOCRテストが利用可能です：

1. **バックエンドOCRテスト** (推奨) - Google Cloud Vision API使用
2. **Tesseract OCRテスト** - ローカルOCR処理

## 📋 前提条件

### 必要な環境
- ✅ Node.js 18+
- ✅ pnpm 9.12.0+
- ✅ Google Cloud Vision API設定済み
- ✅ `google-key.json` ファイル配置済み

### API設定確認
```bash
# 設定状態を確認
curl http://localhost:3000/api/trpc/ocr.checkConfiguration
```

## 🖼️ テスト画像の準備

### 1. テスト画像ディレクトリ作成
```bash
mkdir -p test-images
```

### 2. 血圧計画像の配置
血圧計の画面を撮影した画像を以下の名前で配置：
- `test-images/test1.jpg`
- `test-images/test2.jpg`

**推奨される画像条件**:
- 明るい環境で撮影
- 血圧計の画面全体が含まれている
- 数字が鮮明に見える
- ブレていない画像

## 🧪 テスト方法

### 方法1: バックエンドOCRテスト (推奨)

#### 1. バックエンドサーバー起動
```bash
pnpm dev:server
```

#### 2. 別のターミナルでテスト実行
```bash
npx tsx scripts/test-backend-ocr.ts
```

#### 期待される結果
```
=== Backend OCR Test ===

Testing: test1.jpg
  ✅ SYS: 120, DIA: 80, PUL: 72
  Confidence: 95%

Testing: test2.jpg
  ✅ SYS: 135, DIA: 85, PUL: 78
  Confidence: 92%
```

### 方法2: Tesseract OCRテスト (旧バージョン)

```bash
npx tsx scripts/test-ocr.ts
```

#### 期待される結果
```
Blood Pressure OCR Test
=======================

=== Testing OCR on: test1.jpg ===
Progress: 100%

Raw OCR Text:
SYS 120
DIA 80
PUL 72

Extracted numbers: 120, 80, 72
Extracted values:
  SYS: 120
  DIA: 80
  PUL: 72
```

## 🔧 スクリプトの修正方法

### パスの修正が必要な場合

現在のスクリプトは古いパスを参照しています。必要に応じて修正してください：

#### `scripts/test-backend-ocr.ts` の修正
```typescript
// 修正前
const testImages = [
  "/home/ubuntu/blood_pressure_app/test-images/test1.jpg",
  "/home/ubuntu/blood_pressure_app/test-images/test2.jpg",
];

// 修正後
const testImages = [
  "./test-images/test1.jpg",
  "./test-images/test2.jpg",
];
```

#### `scripts/test-ocr.ts` の修正
```typescript
// 修正前
const testImagesDir = '/home/ubuntu/blood_pressure_app/test-images';

// 修正後
const testImagesDir = './test-images';
```

## 🐛 トラブルシューティング

### エラー: google-key.json not found
**原因**: APIキーファイルが見つからない

**解決策**:
1. `google-key.json` がプロジェクトルートにあるか確認
2. ファイル名が正しいか確認
3. サーバーを再起動

### エラー: HTTP 500 Internal Server Error
**原因**: Vision APIの認証エラー

**解決策**:
1. `google-key.json` の内容が正しいか確認
2. サービスアカウントに「Cloud Vision API ユーザー」ロールがあるか確認
3. APIが有効化されているか確認

### OCR認識精度が低い
**原因**: 画像の品質問題

**解決策**:
1. より明るい画像を使用
2. 画面を正面から撮影
3. 数字が鮮明な画像を選択

### 画像が見つからないエラー
**原因**: テスト画像のパスが間違っている

**解決策**:
1. `test-images/` ディレクトリに画像があるか確認
2. ファイル名が正しいか確認
3. スクリプトのパスを修正

## 📊 テスト結果の評価

### 成功基準
- ✅ SYS: 90-140 の範囲の数値
- ✅ DIA: 60-90 の範囲の数値  
- ✅ PUL: 60-100 の範囲の数値
- ✅ 信頼度: 80% 以上

### 結果の解釈
- **95%以上**: 優秀な認識精度
- **80-94%**: 実用的な認識精度
- **80%未満**: 改善が必要

## 🚀 アプリでのテスト

### 1. 開発サーバー起動
```bash
pnpm dev
```

### 2. アプリでテスト
1. アプリを起動
2. 「カメラで撮影」ボタンをタップ
3. 血圧計の画面を撮影
4. OCR結果を確認

### 3. 結果の確認
- 数値が自動入力されるか
- 正しい値が認識されるか
- エラーが発生しないか

## 📝 テスト記録

テスト結果を記録するテンプレート：

```
=== OCRテスト結果 ===
日時: 2024-XX-XX XX:XX
テスト画像: test1.jpg
結果: SYS: XXX, DIA: XXX, PUL: XXX
信頼度: XX%
備考:
```

## 🔗 関連ドキュメント

- [Google Cloud Vision API 設定ガイド](./docs/google-vision-setup.md)
- [OCR連携ドキュメント](./docs/ocr-integration.md)

---

**注意**: テストにはGoogle Cloud Vision APIの利用料金が発生する場合があります。無料枠（月1000リクエスト）を超えないようご注意ください。
