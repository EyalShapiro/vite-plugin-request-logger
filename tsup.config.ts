import { defineConfig } from 'tsup';

const config = defineConfig({
  entry: ['lib/index.ts'],
  format: ['cjs', 'esm'],
  dts: { resolve: true },
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'es2022',
  tsconfig: './tsconfig.json',
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});

export default config;
