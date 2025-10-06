import path from 'path';
// FIX: Explicitly import `process` to provide types for `process.cwd()` and fix type errors.
import process from 'process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // FIX: `__dirname` is not available in ES modules. Using `process.cwd()` to resolve the project root.
          '@': path.resolve(process.cwd(), '.'),
        }
      },
      assetsInclude: ['**/*.wasm'],
      build: {
        rollupOptions: {
          output: {
            // Ensure .wasm files are copied to the output directory
            assetFileNames: (assetInfo) => {
              if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
                return 'assets/[name][extname]';
              }
              return 'assets/[name]-[hash][extname]';
            }
          }
        }
      }
    };
});
