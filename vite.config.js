import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/recall-knowledge.ts'),
            name: 'RecallKnowledge',
            fileName: 'recall-knowledge',
            formats: ['es']
        },
        outDir: 'dist',
        sourcemap: true,
        minify: false,
        rollupOptions: {
            external: [],
            output: {
                globals: {}
            }
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    }
});