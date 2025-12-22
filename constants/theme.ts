/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#E53935";
const tintColorDark = "#EF5350";

export const Colors = {
  light: {
    text: "#212121",
    background: "#FFFFFF",
    tint: tintColorLight,
    icon: "#757575",
    tabIconDefault: "#757575",
    tabIconSelected: tintColorLight,
    card: "#F5F5F5",
    secondary: "#1E88E5",
  },
  dark: {
    text: "#FFFFFF",
    background: "#121212",
    tint: tintColorDark,
    icon: "#B0B0B0",
    tabIconDefault: "#B0B0B0",
    tabIconSelected: tintColorDark,
    card: "#1E1E1E",
    secondary: "#42A5F5",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
