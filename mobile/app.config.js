const fs = require("fs");
const path = require("path");

function readRootEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      }),
  );
}

const rootEnv = readRootEnv();
const googleServicesFile = process.env.GOOGLE_SERVICES_FILE || "./google-services.json";
const hasFirebase = fs.existsSync(path.resolve(__dirname, googleServicesFile));

module.exports = {
  expo: {
    name: "Prestasi Kita Admin",
    slug: "prestasi-kita-admin",
    version: "1.4.0",
    orientation: "portrait",
    runtimeVersion: { policy: "fingerprint" },
    updates: {
      enabled: Boolean(process.env.EXPO_PUBLIC_EAS_PROJECT_ID),
      ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? { url: `https://u.expo.dev/${process.env.EXPO_PUBLIC_EAS_PROJECT_ID}` } : {}),
      checkAutomatically: "NEVER",
      fallbackToCacheTimeout: 0,
      requestHeaders: { "expo-channel-name": "production" },
    },
    icon: "./assets/prestasi-kita-icon.png",
    userInterfaceStyle: "light",
    scheme: "prestasikitaadmin",
    android: {
      package: "com.prestasikita.admin",
      ...(hasFirebase ? { googleServicesFile } : {}),
      versionCode: 11,
      adaptiveIcon: {
        foregroundImage: "./assets/prestasi-kita-icon.png",
        backgroundColor: "#FFFFFF",
      },
      predictiveBackGestureEnabled: false,
      permissions: ["android.permission.POST_NOTIFICATIONS"],
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon-white.png",
          color: "#FFFFFF",
          defaultChannel: "payments_sound",
        },
      ],
      "expo-secure-store",
      "@react-native-community/datetimepicker",
    ],
    extra: {
      hasFirebase,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || rootEnv.VITE_SUPABASE_URL,
      supabasePublishableKey:
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || rootEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
      easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "",
      eas: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
        ? { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID }
        : undefined,
    },
  },
};
