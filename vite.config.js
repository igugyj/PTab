import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const isFirefox = mode === 'firefox'

  return {
    plugins: [
      react(),
      {
        name: 'browser-manifest',
        closeBundle() {
          const outDir = path.resolve(__dirname, isFirefox ? 'dist-firefox' : 'dist')
          const manifestPath = path.resolve(outDir, 'manifest.json')
          if (!fs.existsSync(manifestPath)) return
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
          if (isFirefox) {
            manifest.browser_specific_settings = {
              gecko: {
                id: "hello@pg25-lsae.eu.org",
                strict_min_version: "109.0",
                data_collection_permissions: {
                  required: ["none"],
                },
              },
            };
          }
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        },
      },
    ],
    build: {
      outDir: isFirefox ? 'dist-firefox' : 'dist',
    },
  }
})
