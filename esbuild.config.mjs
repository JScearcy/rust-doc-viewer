import { build } from 'esbuild';

build({
  bundle: true,
  entryPoints: ['./src/test/runTest.ts', './src/test/index.ts', './src/extension.ts', './src/client/clientHandler.ts', './src/client/clientHandlerStyles.css'],
  external: ['jest-cli', 'vscode'],
  format: 'cjs',
  minify: false,
  outdir: 'out',
  platform: 'node',
});
