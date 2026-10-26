import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // Cache-busts the unversioned /locales/:lng/:ns URLs on every deploy
    'import.meta.env.BUILD_ID': JSON.stringify(
      process.env.BUILD_ID ?? Date.now().toString(36),
    ),
  },
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    // Pre-bundle the heavy client deps up front; discovering them on first
    // visit makes Vite re-bundle mid-session with a second copy of React
    include: [
      'recharts',
      'react-pdf',
      'react-syntax-highlighter',
      'katex',
      'rehype-katex',
      'remark-math',
      'remark-gfm',
      'react-markdown',
    ],
  },
  ssr: {
    // Vendored yeos libraries import CSS, so they must be bundled for SSR
    noExternal: [/vendor\/eos/],
  },
});
