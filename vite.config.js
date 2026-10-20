import { defineConfig } from 'vite';
const buildId = process.env.GITHUB_SHA || process.env.POP_BUILD_ID || 'local-development';
export default defineConfig({ base: '/pop-squadron/', define: { __POP_BUILD_ID__: JSON.stringify(buildId) } });
