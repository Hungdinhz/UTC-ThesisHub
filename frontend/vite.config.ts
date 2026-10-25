import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // VITE_API_BASE_URL:
  // http://localhost:8081/api/v1
  //
  // Proxy target: Spring Boot runs on 8080
  let apiBaseUrl = 'http://localhost:8080'
  if (env.VITE_API_BASE_URL) {
    try {
      apiBaseUrl = new URL(env.VITE_API_BASE_URL).origin
    } catch {
      apiBaseUrl = 'http://localhost:8080'
    }
  }

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

        '/uploads': {
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