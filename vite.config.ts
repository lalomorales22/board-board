import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'image-list-api',
      configureServer(server) {
        server.middlewares.use('/api/images', (_req, res) => {
          const dir = path.join(__dirname, 'public', 'images')
          try {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true })
            }
            const files = fs.readdirSync(dir)
              .filter((f: string) => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
              .map((f: string) => `/images/${f}`)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(files))
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.end('[]')
          }
        })
      },
    },
  ],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ''),
      },
    },
  },
})
