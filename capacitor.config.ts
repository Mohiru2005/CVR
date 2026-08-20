import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cvragencies.app',
  appName: 'CVR Agencies',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
