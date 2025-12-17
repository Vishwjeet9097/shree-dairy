import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shreedairy.app",
  appName: "Shree Dairy",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
