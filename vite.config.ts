import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode, command }) => {
  // Use __dirname instead of process.cwd() to avoid CJS API deprecation warning
  const env = loadEnv(mode, __dirname, '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./"),
      },
    },
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_API_KEY || env.VITE_GEMINI_API_KEY || ''),
      'process.env.OPENCITATIONS_API_KEY': JSON.stringify(env.OPENCITATIONS_API_KEY || env.OPENCITATIONS_TOKEN || ''),
    }
  };
});
