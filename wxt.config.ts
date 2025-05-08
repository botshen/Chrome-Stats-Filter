import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  runner: {
    disabled: true,
  },
  manifest: {
    // default_locale: 'en',
    action: {},
    name: 'chrome-stats',
    description: 'chrome-stats',
    version: '0.0.1',
    permissions: [
      'storage',
      'activeTab',
      'tabs',
    ],
  },
});
