/**
 * Vision OCRサービスのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setVisionAPIKey, getVisionAPIKey, hasVisionAPIKey } from '../services/vision-ocr';

describe('Vision OCR Service', () => {
  beforeEach(async () => {
    // テスト前にストレージをクリア
    await AsyncStorage.clear();
  });

  describe('APIキー管理', () => {
    it('APIキーを設定できる', async () => {
      const testKey = 'AIzaSyTest123456789';
      await setVisionAPIKey(testKey);

      const savedKey = await getVisionAPIKey();
      expect(savedKey).toBe(testKey);
    });

    it('APIキーが設定されていない場合はnullを返す', async () => {
      const key = await getVisionAPIKey();
      expect(key).toBeNull();
    });

    it('APIキーの有無を正しく判定できる', async () => {
      // 初期状態
      let hasKey = await hasVisionAPIKey();
      expect(hasKey).toBe(false);

      // APIキーを設定
      await setVisionAPIKey('AIzaSyTest123456789');
      hasKey = await hasVisionAPIKey();
      expect(hasKey).toBe(true);
    });

    it('空文字列のAPIキーは無効と判定される', async () => {
      await setVisionAPIKey('');
      const hasKey = await hasVisionAPIKey();
      expect(hasKey).toBe(false);
    });
  });
});
