import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { saveReading } from "@/services/storage";
import { extractBloodPressureData } from "@/services/ocr";

export default function CameraScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, styles.permissionContainer]}>
        <ThemedText style={styles.permissionText}>
          カメラへのアクセス許可が必要です
        </ThemedText>
        <Pressable
          style={[styles.permissionButton, { backgroundColor: colors.tint }]}
          onPress={requestPermission}
        >
          <ThemedText style={styles.permissionButtonText}>許可する</ThemedText>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={[styles.backButtonText, { color: colors.tint }]}>戻る</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const handleTakePicture = async () => {
    if (!cameraRef.current || processing) return;

    try {
      setProcessing(true);
      setOcrProgress(0);
      const photo = await cameraRef.current.takePictureAsync();
      
      if (!photo) {
        Alert.alert("エラー", "写真の撮影に失敗しました。");
        setProcessing(false);
        return;
      }

      // OCR処理
      const result = await extractBloodPressureData(photo.uri, (progress) => {
        setOcrProgress(Math.round(progress * 100));
      });

      if (!result) {
        Alert.alert(
          "認識失敗",
          "血圧データを認識できませんでした。手動で入力してください。",
        );
        setProcessing(false);
        router.back();
        return;
      }

      // データを保存
      await saveReading({
        systolic: result.systolic,
        diastolic: result.diastolic,
        pulse: result.pulse,
        measuredAt: new Date().toISOString(),
      });

      Alert.alert(
        "認識成功",
        `収縮期: ${result.systolic} mmHg
拡張期: ${result.diastolic} mmHg
脈拍: ${result.pulse} /min
信頼度: ${Math.round(result.confidence * 100)}%

データを保存しました。`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      console.error("Failed to process image:", error);
      Alert.alert("エラー", "画像の処理に失敗しました。");
    } finally {
      setProcessing(false);
    }
  };

  const handlePickImage = async () => {
    if (processing) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;

      setProcessing(true);
      setOcrProgress(0);
      const imageUri = result.assets[0].uri;

      // OCR処理
      const ocrResult = await extractBloodPressureData(imageUri, (progress) => {
        setOcrProgress(Math.round(progress * 100));
      });

      if (!ocrResult) {
        Alert.alert(
          "認識失敗",
          "血圧データを認識できませんでした。手動で入力してください。",
        );
        setProcessing(false);
        router.back();
        return;
      }

      // データを保存
      await saveReading({
        systolic: ocrResult.systolic,
        diastolic: ocrResult.diastolic,
        pulse: ocrResult.pulse,
        measuredAt: new Date().toISOString(),
      });

      Alert.alert(
        "認識成功",
        `収縮期: ${ocrResult.systolic} mmHg
拡張期: ${ocrResult.diastolic} mmHg
脈拍: ${ocrResult.pulse} /min
信頼度: ${Math.round(ocrResult.confidence * 100)}%

データを保存しました。`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      console.error("Failed to pick image:", error);
      Alert.alert("エラー", "画像の選択に失敗しました。");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <View
          style={[
            styles.overlay,
            {
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <Pressable
              style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.5)" }]}
              onPress={() => router.back()}
              disabled={processing}
            >
              <ThemedText style={styles.headerButtonText}>キャンセル</ThemedText>
            </Pressable>
          </View>

          {/* ガイドフレーム */}
          <View style={styles.guideContainer}>
            <View style={styles.guideFrame} />
            <ThemedText style={styles.guideText}>
              血圧計の画面をフレーム内に収めてください
            </ThemedText>
            {processing && ocrProgress > 0 && (
              <ThemedText style={styles.progressText}>
                認識中... {ocrProgress}%
              </ThemedText>
            )}
          </View>

          {/* コントロール */}
          <View style={styles.controls}>
            <Pressable
              style={[styles.controlButton, { backgroundColor: "rgba(0,0,0,0.5)" }]}
              onPress={handlePickImage}
              disabled={processing}
            >
              <IconSymbol name="paperplane.fill" size={24} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={[
                styles.captureButton,
                { backgroundColor: colors.tint },
                processing && styles.captureButtonDisabled,
              ]}
              onPress={handleTakePicture}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" size="large" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </Pressable>

            <View style={styles.controlButton} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  permissionContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 14,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  headerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  guideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  guideFrame: {
    width: "85%",
    aspectRatio: 4 / 3,
    maxWidth: 400,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  guideText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    paddingHorizontal: 20,
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
  },
});
