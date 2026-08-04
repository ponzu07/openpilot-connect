import { copyFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';


function previewBranding() {
  return {
    name: 'preview-branding',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const srcDir = resolve(process.cwd(), 'public/preview-icons');
      const outDir = resolve(process.cwd(), 'dist');
      for (const file of readdirSync(srcDir)) {
        copyFileSync(resolve(srcDir, file), resolve(outDir, file));
      }
      console.log('[preview-branding] swapped in preview icons');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 3000,
      // Local development can use the same Athena client through a same-origin path.
      proxy: {
        '/athena': {
          target: 'https://openpilot.copirobo.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/athena/, ''),
        },
      },
    },
    plugins: [
      // TODO: compression plugin
      tailwindcss(),
      react(),
      VitePWA({
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,webp,svg,ico}'],
          // The visual report is written after the app build and must be served as a real file,
          // not interpreted by the application router as a dongle id.
          navigateFallbackDenylist: [/^\/connect-gallery(?:\.html)?$/],
          // TODO: revisit, throw error during build if too large?
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          sourcemap: true,
        },
      }),
      process.env.PREVIEW && previewBranding(),
    ].filter(Boolean),
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        // Required for Material UI v1
        define: {
          global: 'globalThis',
        },
      },
    },
  };
});
