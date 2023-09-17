import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), viteTsconfigPaths()],
    server: {
        open: true,
    },
    root: './src',
    build: {
        outDir: '../build',
        emptyOutDir: true,
    },
});