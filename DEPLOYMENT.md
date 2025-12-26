# バックエンドデプロイ手順書

ビルド済みアプリでOCR機能を使用するためのバックエンドデプロイ手順書です。

## 🎯 概要

このアプリはクライアント・サーバーアーキテクチャのため、OCR機能を利用するにはバックエンドサーバーのデプロイが必要です。

```
[スマホアプリ] ←→ [バックエンドサーバー] ←→ [Google Vision API]
     (単体動作)      (デプロイ必須)      (OCR処理)
```


## 🚀 デプロイ選択肢

### 選択肢1: Vercel（推奨）

#### メリット
- ✅ 無料プランあり
- ✅ 簡単なデプロイ
- ✅ 自動HTTPS
- ✅ GitHub連携

#### デプロイ手順
```bash
# 1. Vercel CLIをインストール
npm i -g vercel

# 2. Vercelにログイン
vercel login

# 3. プロジェクトルートでデプロイ
cd blood-pressure-app
vercel

# 4. 本番環境にデプロイ
vercel --prod

# 5. デプロイURLを確認
# 例: https://blood-pressure-api.vercel.app
```

### 選択肢2: Railway

#### メリット
- ✅ Node.jsに最適化
- ✅ 環境変数管理が簡単
- ✅ データベースも利用可能

#### デプロイ手順
```bash
# 1. Railway CLIをインストール
npm install -g @railway/cli

# 2. ログイン
railway login

# 3. 新規プロジェクト作成
railway new

# 4. デプロイ実行
railway up

# 5. 環境変数を設定
railway variables set GOOGLE_APPLICATION_CREDENTIALS="./google-key.json"
```

### 選択肢3: Docker + 自前サーバー

#### Dockerfileの作成
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 依存関係をインストール
COPY package*.json ./
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# ビルド
RUN npm run build

# ポートを公開
EXPOSE 3000

# 起動
CMD ["npm", "start"]
```

#### デプロイ手順
```bash
# 1. Dockerイメージをビルド
docker build -t blood-pressure-api .

# 2. コンテナを実行
docker run -d \
  --name blood-pressure-api \
  -p 3000:3000 \
  -v $(pwd)/google-key.json:/app/google-key.json \
  blood-pressure-api

# 3. 動作確認
curl http://localhost:3000/api/trpc/ocr.checkConfiguration
```

## 📱 アプリ側の設定変更

### ステップ1: APIエンドポイントの更新

#### constants/oauth.ts を編集
```typescript
// constants/oauth.ts
export const getApiBaseUrl = () => {
  // 開発環境
  if (__DEV__) {
    return 'http://localhost:3000';
  }
  
  // 本番環境（デプロイ先のURLに変更）
  return 'https://your-deployed-api.vercel.app';
};
```

### ステップ2: 環境変数の設定

#### .env.production を作成
```bash
# .env.production
API_URL=https://your-deployed-api.vercel.app
NODE_ENV=production
```

### ステップ3: app.config.ts の更新
```typescript
// app.config.ts
const config: ExpoConfig = {
  // ...他の設定
  extra: {
    apiUrl: process.env.API_URL || 'https://your-deployed-api.vercel.app',
  },
};
```

## 🔧 完全なデプロイ手順

### ステップ1: バックエンドの準備
```bash
# 1. プロジェクトディレクトリに移動
cd blood-pressure-app

# 2. 本番用ビルド
pnpm build

# 3. Google Cloud Vision APIの確認
ls google-key.json  # ファイル存在確認

# 4. 環境変数を設定
export GOOGLE_APPLICATION_CREDENTIALS="./google-key.json"
```

### ステップ2: Vercelでのデプロイ例
```bash
# 1. Vercelでデプロイ
vercel --prod

# 2. デプロイURLを取得（例: https://blood-pressure-api.vercel.app）

# 3. API動作確認
curl https://blood-pressure-api.vercel.app/api/trpc/ocr.checkConfiguration
```

### ステップ3: アプリの設定更新
```bash
# 1. constants/oauth.ts を編集
# 本番URLをデプロイ先に変更

# 2. アプリを再ビルド
npx expo build:android
# または
npx expo build:ios
```

### ステップ4: テスト
```bash
# 1. ビルド済みアプリをインストール
# 2. OCR機能をテスト
# 3. カメラで血圧計を撮影して認識確認
```

## 💰 コスト管理

### 無料プランの比較

| プラットフォーム | 無料枠 | 制限 |
|----------------|--------|------|
| Vercel | Hobbyプラン | 100GB bandwidth/月 |
| Railway | $5クレジット | 500時間/月 |
| Heroku | Ecoプラン | 550時間/月 |

### Google Cloud Vision API
```bash
# 無料枠: 月1000リクエスト
# 超過料金: $1.50/1000リクエスト

# 利用量モニタリング
gcloud logging read "resource.type=cloud_function" --limit=10
```

## 🔒 セキュリティ設定

### APIキーの管理
```bash
# 1. google-key.jsonを安全に配置
# 2. 環境変数でパスを指定
# 3. Gitに含めない（.gitignore確認）

# .gitignore に含まれていることを確認
google-key.json
*.json
```

### CORS設定
```typescript
// server/_core/index.ts でCORSを設定
app.use(cors({
  origin: ['exp://localhost:8081', 'https://your-app-domain.com'],
  credentials: true,
}));
```

## 🚨 トラブルシューティング

### エラー: API接続失敗
**原因**: アプリが間違ったURLを参照

**解決策**:
1. `constants/oauth.ts` のURLを確認
2. デプロイ先のURLが正しいか確認
3. アプリを再ビルド

### エラー: OCR認識失敗
**原因**: Google Cloud Vision APIの設定問題

**解決策**:
1. `google-key.json` がサーバーにあるか確認
2. サービスアカウントの権限を確認
3. APIが有効化されているか確認

### エラー: CORSエラー
**原因**: クロスオリジンリクエストがブロック

**解決策**:
1. サーバーのCORS設定を確認
2. アプリのドメインを許可リストに追加

## 📋 本番環境チェックリスト

### デプロイ前
- [ ] バックエンドがローカルで正常に動作
- [ ] google-key.json が配置済み
- [ ] 環境変数が設定済み
- [ ] ビルドが成功する

### デプロイ後
- [ ] APIエンドポイントがHTTPSで応答
- [ ] OCR設定確認APIが正常に応答
- [ ] アプリのAPI URLが更新済み
- [ ] アプリが再ビルド済み

### 最終テスト
- [ ] ビルド済みアプリでOCR機能が動作
- [ ] 血圧計画像で数値認識が成功
- [ ] エラーハンドリングが正常
- [ ] パフォーマンスが実用的

## 🔗 関連ドキュメント

- [Google Cloud Vision API 設定ガイド](./docs/google-vision-setup.md)
- [OCR機能テスト手順書](./OCR_TEST.md)
- [README.md](./README.md)

---

**注意**: デプロイにはGoogle Cloud Vision APIの利用料金が発生する場合があります。無料枠を超えないようご注意ください。

**サポート**: 問題が発生した場合はGitHub Issuesをご利用ください。
