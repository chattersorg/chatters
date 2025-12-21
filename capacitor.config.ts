import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chatters.kiosk',
  appName: 'Chatters Kiosk',
  webDir: 'build',
  server: {
    // For development, you can use your local server
    // url: 'http://localhost:3000',
    // cleartext: true
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    // Prevent status bar from showing
    // You'll also need to set UIStatusBarHidden in Info.plist
  },
  android: {
    // Keep screen on while app is in foreground
    allowMixedContent: true,
  },
  plugins: {
    // Add any Capacitor plugins here
  }
};

export default config;
