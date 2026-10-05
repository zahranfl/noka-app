import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'https://good-enforcer-linked.ngrok-free.dev'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      allowedHosts: ['.trycloudflare.com'],
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        },
      },
    },
  }
})
