
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Define này sẽ thay thế các biến trong code lúc build
  // Chúng ta sẽ lấy cả 2 trường hợp tên biến để tránh lỗi typo của người dùng
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.API_Key || '')
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  }
});
