// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactNativeWeb from 'vite-plugin-react-native-web';
import mkcert from 'vite-plugin-mkcert'; // ← Add this import

export default defineConfig({
  plugins: [
    react(),
    reactNativeWeb(),
    mkcert(), // ← Now it's imported and safely added here
  ],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  /*
  server: {
    https: true,         // Required when using mkcert
    host: true,          // Exposes to network (shows your local IP)
    port: 2000,          // Match your --port 2000
    strictPort: true,    // Matches your CLI flag
    // allowedHosts: 'all' is NOT a valid Vite option
    // If you're having ngrok issues, handle it differently (see note below)
  },*/
});