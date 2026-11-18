import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/supabase-proxy': {
            target: 'https://giwyowsqmgwsaliiduqi.supabase.co',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/supabase-proxy/, ''),
          }
        }
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
                return 'react';
              }
              if (id.includes('node_modules/@supabase/')) {
                return 'supabase';
              }
              if (id.includes('node_modules/lucide-react/')) {
                return 'icons';
              }
              if (id.includes('node_modules/jspdf')) {
                return 'pdf';
              }
            }
          }
        }
      }
    };
});
