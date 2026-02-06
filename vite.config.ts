import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
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
      'process.env': env
    },
    server: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: true,
    },
  };
});
