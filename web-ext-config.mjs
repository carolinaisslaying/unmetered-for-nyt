export default {
  ignoreFiles: [
    'node_modules',
    'pnpm-lock.yaml',
    'package.json',
    'web-ext-config.mjs',
    'web-ext-artifacts',
    'dist',
    'README.md',
    '.github',
    '.idea',
    '.git'
  ],
  build: { overwriteDest: true }
};
