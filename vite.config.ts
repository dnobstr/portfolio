import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base =
    env.VITE_BASE_PATH ||
    (mode === 'production' ? '/portfolio/' : '/');

  return {
    base,
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-markdown': ['react-markdown', 'remark-gfm'],
          },
        },
      },
    },
  };
});
