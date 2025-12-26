# 血圧ノート (Blood Pressure Note)

スマートフォンカメラで血圧計の画面を撮影し、OCRで自動的にデータを抽出・記録するReact Nativeアプリ。測定データをグラフ化し、経過を視覚的に確認できます。

## 📱 アプリ概要

血圧管理を簡単にするモバイルアプリケーション。以下の特徴があります：

- 📸 **カメラOCR機能**: 血圧計の画面を撮影するだけで自動で数値を認識
- 📊 **履歴管理**: 測定データの記録、表示、編集、削除
- 📈 **統計表示**: 期間別の平均値と測定回数を表示
- 🎨 **ダークモード対応**: システム設定に合わせてテーマが自動切り替え
- 📱 **クロスプラットフォーム**: iOS/Android対応（Expo）

## 🚀 主要機能

### 1. ホーム画面（測定入力）
- カメラ撮影ボタンで血圧計の画面を撮影
- Google Cloud Vision APIによる高精度OCR認識
- 手動入力フォーム（収縮期/拡張期血圧、脈拍）
- 最新測定データのリアルタイム表示
- 血圧レベルの色分け表示

### 2. 履歴・グラフ画面
- 期間選択（1週間/1ヶ月/半年/1年）
- 測定データの一覧表示
- 統計情報（平均値、測定回数）
- 個別データの編集・削除機能

### 3. 設定画面
- アプリバージョン情報
- OCR設定状態の確認
- （今後の拡張機能：目標血圧値、通知設定、データエクスポート）

## 🛠 技術スタック

### フロントエンド
- **React Native** (0.81.5) + **Expo** (~54.0.29)
- **TypeScript** (~5.9.2)
- **Expo Router** (~6.0.19) - ファイルベースルーティング
- **React Query** (@tanstack/react-query) - データフェッチング
- **tRPC** - 型安全なAPI通信

### UI/UX
- **Expo Symbols** - SF Symbols互換アイコン
- **React Native Gesture Handler** - ジェスチャー処理
- **React Native Reanimated** - アニメーション
- **React Native Safe Area Context** - セーフエリア対応

### OCR機能
- **Google Cloud Vision API** - 高精度テキスト認識
- **expo-camera** - カメラ機能
- **expo-image-picker** - 画像選択
- **sharp** - 画像前処理

### バックエンド
- **Node.js** + **Express**
- **tRPC Server** - 型安全API
- **Drizzle ORM** - データベースORM
- **MySQL2** - データベース接続

### 開発ツール
- **ESLint** + **Prettier** - コード品質管理
- **Vitest** - テストフレームワーク
- **Concurrently** - 並列実行
- **pnpm** - パッケージマネージャー

## 📁 プロジェクト構造

```
blood-pressure-app/
├── app/                    # Expo Router画面ファイル
│   ├── (tabs)/            # タブナビゲーション
│   │   ├── index.tsx      # ホーム画面
│   │   ├── history.tsx    # 履歴画面
│   │   └── settings.tsx   # 設定画面
│   ├── camera.tsx         # カメラ画面
│   └── _layout.tsx        # レイアウト
├── components/            # UIコンポーネント
│   ├── themed-*.tsx       # テーマ対応コンポーネント
│   └── ui/               # 基本UIコンポーネント
├── services/             # サービス層
│   ├── storage.ts        # データ保存
│   ├── ocr-backend.ts    # OCRサービス
│   └── vision-ocr.ts     # Vision API連携
├── server/               # バックエンドサーバー
│   ├── _core/           # コア機能
│   └── routers/         # tRPCルーター
├── utils/               # ユーティリティ関数
├── types/               # TypeScript型定義
├── constants/           # 定数ファイル
├── drizzle/            # データベース関連
├── assets/             # 静的アセット（画像、アイコン）
├── hooks/              # Reactカスタムフック
├── lib/                # ライブラリファイル
├── scripts/            # ビルドスクリプト
├── shared/             # 共有コード
├── app.config.ts       # Expoアプリ設定
├── tsconfig.json       # TypeScript設定
└── package.json        # パッケージ情報
```

## 🎨 デザインシステム

### カラー
- **プライマリー**: `#E53935`（医療・健康を連想させる赤系）
- **セカンダリー**: `#1E88E5`（拡張期血圧用の青系）
- **ダークモード**: 完全対応

### タイポグラフィ
- タイトル: 28pt/太字
- 数値表示: 32pt/太字（血圧値）
- ボディ: 16pt/標準

## 🚀 セットアップ

### 環境要件
- Node.js 18+
- pnpm 9.12.0+
- Expo CLI
- Google Cloud Vision APIキー

### インストール手順

1. **リポジトリをクローン**
```bash
git clone <repository-url>
cd blood-pressure-app
```

2. **依存関係をインストール**
```bash
pnpm install
```

3. **環境変数を設定**
```bash
# .env.localファイルを作成し、必要な環境変数を設定
touch .env.local
# 以下の環境変数を設定: DATABASE_URL, JWT_SECRET, OAUTH_SERVER_URL など
```

4. **Google Cloud Vision APIの設定**
- 詳細な設定方法: [Google Cloud Vision API 設定ガイド](./docs/google-vision-setup.md)
- `google-key.json` をプロジェクトルートに配置
- APIキーを環境変数に設定

5. **開発サーバーを起動**
```bash
pnpm dev
```

これによりフロントエンド（Metro）とバックエンドサーバーが同時に起動します。

## 📱 実行方法

### 開発モード
```bash
# フロントエンドのみ
pnpm dev:metro

# バックエンドのみ
pnpm dev:server

# 両方同時に
pnpm dev
```

### ビルド
```bash
# 本番ビルド
pnpm build

# 本番実行
pnpm start
```

### プラットフォーム別実行
```bash
# iOSシミュレーター
pnpm ios

# Androidエミュレーター
pnpm android
# Webブラウザー
pnpm dev:metro
pnpm web
```

## 🧪 テスト

```bash
# 単体テスト実行
pnpm test

# 型チェック
pnpm check

# リント
pnpm lint

# フォーマット
pnpm format
```

## 📊 OCR機能について

### サポートしている血圧計
- デジタル血圧計の表示画面
- 収縮期血圧（SYS）、拡張期血圧（DIA）、脈拍（PUL）の同時認識

### 画像前処理
- コントラスト強調（CLAHE）
- ガンマ補正（2.5）
- シャープネス処理
- リサイズと最適化

### 認識精度
- Google Cloud Vision API使用で高精度認識
- 数値範囲フィルタリング（SYS: 50-250, DIA: 30-150, PUL: 30-200）
- エラーハンドリングと再試行機能

## 🔧 設定

### 環境変数
```env
# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=./google-key.json

# API設定
API_URL=http://localhost:3000
EXPO_PORT=8081
```

### データベース
```bash
# マイグレーション実行
pnpm db:push
```

## 📝 開発計画

### 完了済み
- ✅ 基本的なCRUD機能
- ✅ カメラOCR連携
- ✅ 履歴表示と統計
- ✅ ダークモード対応
- ✅ Google Cloud Vision API統合

### 今後の機能
- ⏳ グラフ表示機能
- ⏳ 目標血圧値設定
- ⏳ 測定リマインダー通知
- ⏳ CSVデータエクスポート
- ⏳ クラウド同期

## 🤝 貢献

1. Forkする
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

問題やご質問がある場合は、GitHub Issuesをご利用ください。

---

**バージョン**: 1.1.0  
**最終更新**: 2024年12月
