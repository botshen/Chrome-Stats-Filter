import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  runner: {
    disabled: true,
  },
  manifest: {
    action: {},
    name: 'chrome-stats-filter-helper',
    description: 'chrome-stats filter helper',
    version: '0.0.1',
  },
});
