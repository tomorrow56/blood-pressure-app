# Google Cloud Vision API 設定ガイド

血圧管理アプリでGoogle Cloud Vision APIを使用するための設定手順です。

## 1. Google Cloud Consoleでの設定

### 1.1 プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）

### 1.2 Vision AI APIの有効化
1. 左メニューから「APIとサービス」→「ライブラリ」を選択
2. 「Vision AI API」を検索
3. 「有効にする」をクリック

### 1.3 サービスアカウントの作成
1. 左メニューから「IAMと管理」→「サービスアカウント」を選択
2. 「サービスアカウントを作成」をクリック
3. サービスアカウント名を入力（例: `blood-pressure-ocr`）
4. 「作成して続行」をクリック
5. ロールを選択: 「Cloud Vision API ユーザー」
6. 「完了」をクリック

### 1.4 サービスアカウントキーの作成
1. 作成したサービスアカウントをクリック
2. 「キー」タブを選択
3. 「鍵を追加」→「新しい鍵を作成」
4. キーのタイプ: 「JSON」を選択
5. 「作成」をクリック
6. `google-key.json`ファイルがダウンロードされます

## 2. アプリへの設定

### 2.1 google-key.jsonファイルの配置

ダウンロードした`google-key.json`ファイルを、アプリのサーバーディレクトリに配置します：

```
blood_pressure_app/
├── server/
│   ├── google-key.json  ← ここに配置
│   ├── routers/
│   └── ...
├── app/
└── ...
```

**重要**: `google-key.json`ファイルは機密情報です。絶対にGitにコミットしないでください。

### 2.2 .gitignoreの確認

`.gitignore`ファイルに以下が含まれていることを確認してください：

```
google-key.json
*.json
```

### 2.3 サーバーの再起動

`google-key.json`ファイルを配置したら、開発サーバーを再起動してください。

## 3. 動作確認

### 3.1 設定状態の確認

アプリの「設定」タブで、Vision APIの設定状態を確認できます。

- ✅ **設定済み**: `google-key.json`が正しく読み込まれています
- ❌ **未設定**: `google-key.json`が見つかりません

### 3.2 OCR機能のテスト

1. 「測定」タブの「カメラで撮影」ボタンをタップ
2. 血圧計の画面を撮影
3. 自動的に数値が認識されます

## 4. トラブルシューティング

### エラー: google-key.json not found

**原因**: `google-key.json`ファイルが正しい場所に配置されていません。

**解決策**:
1. ファイルが`/home/ubuntu/blood_pressure_app/google-key.json`に配置されているか確認
2. ファイル名が正確に`google-key.json`であることを確認
3. サーバーを再起動

### エラー: OCR recognition failed

**原因**: Vision APIの認証エラーまたはネットワークエラー

**解決策**:
1. `google-key.json`の内容が正しいか確認
2. サービスアカウントに「Cloud Vision API ユーザー」ロールが付与されているか確認
3. インターネット接続を確認

### 認識精度が低い

**原因**: 撮影条件が悪い

**解決策**:
1. 明るい場所で撮影
2. 血圧計の画面を正面から撮影
3. 画面全体がフレーム内に収まるように撮影
4. ブレないように注意

## 5. 料金について

Google Cloud Vision APIは、月1000リクエストまで無料です。

- **無料枠**: 1000リクエスト/月
- **超過料金**: 1000リクエスト以降、$1.50/1000リクエスト

個人利用であれば、無料枠内で十分です。

## 6. セキュリティ

- `google-key.json`ファイルは絶対に公開しないでください
- 不要になったサービスアカウントキーは削除してください
- 定期的にキーをローテーションすることを推奨します

## 7. 参考リンク

- [Google Cloud Vision API ドキュメント](https://cloud.google.com/vision/docs)
- [サービスアカウントの管理](https://cloud.google.com/iam/docs/service-accounts)
- [Vision API 料金](https://cloud.google.com/vision/pricing)
