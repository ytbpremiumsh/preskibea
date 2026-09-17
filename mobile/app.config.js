const fs = require('fs');
const path = require('path');

function readRootEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, '')];
      }),
  );
}

const rootEnv = readRootEnv();

module.exports = {
  expo: {
    name: 'Prestasi Kita Admin',
    slug: 'prestasi-kita-admin',
    version: '1.1.2',
    orientation: 'portrait',
    icon: './assets/prestasi-kita-icon.png',
    userInterfaceStyle: 'light',
    scheme: 'prestasikitaadmin',
    android: {
      package: 'com.prestasikita.admin',
      versionCode: 5,
      adaptiveIcon: {
        foregroundImage: './assets/prestasi-kita-icon.png',
        backgroundColor: '#FFFFFF',
      },
      predictiveBackGestureEnabled: false,
      permissions: ['android.permission.POST_NOTIFICATIONS'],
    },
    plugins: [
      ['expo-notifications', {
        icon: './assets/notification-icon.png',
        color: '#082E67',
        defaultChannel: 'payments_sound',
      }],
      'expo-secure-store',
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || rootEnv.VITE_SUPABASE_URL,
      supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || rootEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
      easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '',
      eas: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } : undefined,
    },
  },
};
