import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 4000 },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
    // pre-bundle everything up front so the dev server never re-optimises
    // mid-session (that caused a duplicated React copy / "Invalid hook call")
    include: ['react', 'react-dom', 'react-dom/client', 'three', 'three/examples/jsm/environments/RoomEnvironment.js'],
  },
});
