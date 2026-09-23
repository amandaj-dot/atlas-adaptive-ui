import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleInterpretContext } from './server/interpretContextHandler.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loaded here (Node/config context only) and copied into process.env
  // for the dev-server middleware below to read. This does NOT expose
  // it to client code: only import.meta.env.VITE_-prefixed variables
  // are ever bundled into the browser, and ANTHROPIC_API_KEY has no
  // VITE_ prefix on purpose.
  const env = loadEnv(mode, process.cwd(), '')
  if (env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY
  }
  if (env.ANTHROPIC_WORKSPACE_ID) {
    process.env.ANTHROPIC_WORKSPACE_ID = env.ANTHROPIC_WORKSPACE_ID
  }

  return {
    plugins: [
      react(),
      {
        name: 'dev-interpret-context-api',
        configureServer(server) {
          // DEV-ONLY endpoint — exists only while `npm run dev` is
          // running this middleware; there is no equivalent in a
          // production build (see server/interpretContextHandler.ts).
          server.middlewares.use('/api/interpret-context', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end('Method not allowed')
              return
            }
            handleInterpretContext(req, res)
          })
        },
      },
    ],
  }
})
