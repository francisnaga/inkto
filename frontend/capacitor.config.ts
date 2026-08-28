import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.inkto.app',
  appName: 'Inkto',
  webDir: 'out',
  plugins: { CapacitorHttp: { enabled: true } }
};
export default config;