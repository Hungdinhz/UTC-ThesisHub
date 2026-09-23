import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // VITE_API_BASE_URL:
  // http://localhost:8080/api/v1
  //
  // Proxy target cần:
  // http://localhost:8080
  const apiBaseUrl = new URL(env.VITE_API_BASE_URL).origin

  return {
    plugins: [react()],

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },

    server: {
      port: 3000,

      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
        },

        '/documents': {
          target: apiBaseUrl,
          changeOrigin: true,
        },

        '/doc_templates': {
          target: apiBaseUrl,
          changeOrigin: true,
        },

        '/ws': {
          target: apiBaseUrl,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})