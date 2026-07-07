import path from 'path';
import { Configuration } from 'webpack';
import nodeExternals from 'webpack-node-externals';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
const config: Configuration = {
  target: 'node',
  mode: 'production',
  entry: './src/infrastructure/main.ts',
  externals: [nodeExternals()], // Ignora node_modules para optimizar el bundle de servidor
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "package.json", to: "package.json" },
        { from: "package-lock.json", to: "package-lock.json" },
        {
          from: path.resolve(__dirname, ".env-prod"),
          to: ".env", // O simplemente ".env"
          toType: 'file', // <--- Esto fuerza a Webpack a tratarlo como archivo, no como carpeta
          noErrorOnMissing: true
        },
        {
          from: path.resolve(__dirname, "config"), // Ruta de la carpeta origen
          to: "config" // Nombre de la carpeta en tu directorio de salida (dist/build)
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [
      new TsconfigPathsPlugin(),
    ],
    alias: {
      // Alias para capas DDD (Asegúrate de que coincidan con tsconfig.json)
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@app': path.resolve(__dirname, 'src/application'),
      '@infra': path.resolve(__dirname, 'src/infrastructure'),
      '@core': path.resolve(__dirname, 'src/core/'),
      '@shared': path.resolve(__dirname, 'src/shared/'),
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js', // Mantenemos tu bundle.js estándar
    libraryTarget: 'commonjs' // 🛡️ 2. Forzar que la estructura de salida sea CommonJS
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true, // 👈 ¡ESTA ES LA REGLA DE ORO!
          keep_fnames: true,     // Protege también los nombres de funciones
        },
      }),
    ],
  },
};

export default config;
