/** Use a single .env value everywhere */
const fs = require('fs');

function readEnv(k, fallback='') {
  if (!process.env[k]) {
    try {
      const env = Object.fromEntries(
        fs.readFileSync('.env','utf8')
          .split('\n')
          .filter(Boolean)
          .map(l => l.split('='))
      );
      process.env[k] = env[k] || process.env[k] || '';
    } catch {}
  }
  return process.env[k] || fallback;
}

const GMAPS = readEnv('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY', '');

module.exports = {
  expo: {
    name: "SceneSnitch",
    slug: "scenesnitch-clean",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/SceneSnitch.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/SceneSnitch.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "SceneSnitch uses your location to find filming locations near you."
      },
      // ✅ iOS Google Maps key (used if you choose Google provider on iOS)
      config: {
        googleMapsApiKey: GMAPS
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/SceneSnitch.png",
        backgroundColor: "#000000"
      },
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      // ✅ Android Google Maps key
      config: {
        googleMaps: { apiKey: GMAPS }
      }
    },
    plugins: [
      "expo-location"
      // (do NOT add "react-native-maps" here)
    ],
    extra: {
      // Available at runtime via expo-constants or process.env in EAS builds
      googleMapsApiKey: GMAPS
    }
  }
};
