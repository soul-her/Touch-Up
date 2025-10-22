import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // *** ADDED CONFIGURATION BLOCK ***
  server: {
    // Setting 'host: true' makes the Vite server listen on all network interfaces (0.0.0.0).
    // This allows devices (like your phone) on the same Wi-Fi network to access the app
    // using your computer's local IP address.
    host: true, 
    
    // Vite usually defaults to 5173. You can explicitly set it if needed,
    // but the default should work fine.
    // port: 5173 
  }
  // **********************************
})
