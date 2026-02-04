import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.femflow.app',
  appName: 'FemFlow',
  webDir: 'cap/www',
  bundledWebRuntime: false,

  server: {
    // permite chamadas para sua API Cloudflare
    allowNavigation: ['femflowapi.falling-wildflower-a8c0.workers.dev'],
  },
};

export default config;
