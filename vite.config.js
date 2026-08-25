import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import reactNativeWeb from 'vite-plugin-react-native-web'

export default defineConfig({
  plugins: [react(), reactNativeWeb()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  server: {
    host: true,          // makes Vite listen on 0.0.0.0 so ngrok can reach it
    port: 2000,          // optional – you already force it via CLI, but harmless
    strictPort: true,    // same as your --strictPort flag
    allowedHosts: 'all', // THIS fixes the ngrok "Blocked request" error
  },
})