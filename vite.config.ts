import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/SO_Load-workflow/',
  esbuild: {
    target: 'esnext',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.js')) {
            return 'assets/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    target: 'esnext',
    minify: false,
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    fs: {
      strict: false,
    },
    cors: true,
    host: true,
    port: 5173,
    middlewareMode: false,
    hmr: {
      port: 5173,
    },
  },
})
