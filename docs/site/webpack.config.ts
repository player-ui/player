import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";
import smartypants from "remark-smartypants";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { URL } from "url";
import webpack from "webpack";
import HTMLWebpackPlugin from "html-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";

import fs from "fs";

const __dirname = new URL(".", import.meta.url).pathname;

const findPageRoutes = (searchPath = "./pages") => {
  const files = fs.readdirSync(searchPath);
  const routes: string[] = [];

  files.forEach((file) => {
    const filePath = path.join(searchPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      routes.push(...findPageRoutes(filePath));
    } else if ([".mdx", ".tsx", ".md", ".ts"].includes(path.extname(file))) {
      // without extension
      const ext = path.extname(file);
      const fileName = file.replace(ext, "");

      routes.push(path.relative("./pages", path.join(searchPath, fileName)));
    }
  });

  return routes;
};

const pageRoutes = findPageRoutes();

const config = {
  mode: process.env.NODE_ENV ?? "development",
  devtool: "source-map",
  entry: "./components/App.tsx",
  optimization: {
    minimize: process.env.NODE_ENV === "production",
    minimizer: [new TerserPlugin()],
    splitChunks: {
      chunks: "all",
    },
  },
  output: {
    publicPath: "auto",
    filename: "[name].[hash].js",
  },
  module: {
    rules: [
      {
        test: /plugin-nav-data.json$/,
        use: [path.join(__dirname, "./plugins/plugin-nav-generator.cjs")],
      },
      {
        test: /search-index.json$/,
        use: [path.join(__dirname, "./plugins/search-index-loader.cjs")],
      },
      {
        test: /.mdx?$/, // load both .md and .mdx files
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-env", { targets: "defaults" }],
                "@babel/preset-react",
              ],
            },
          },
          {
            loader: "@mdx-js/loader",
            options: {
              jsx: true,
              remarkPlugins: [
                smartypants, // Formatting (convert -- to em/en dash)
              ],
              rehypePlugins: [
                rehypeSlug, // Add ids to headings
                [rehypeAutolinkHeadings, { behavior: "wrap" }], // Make headings links
              ],
            },
          },
          path.join(__dirname, "./plugins/md-layout-loader.cjs"),
          path.join(__dirname, "./plugins/mdx-link-append-loader.cjs"),
        ],
      },
      {
        test: /\.css$/,
        oneOf: [
          { include: /node_modules/, use: ["style-loader", "css-loader"] },
          { exclude: /node_modules/, use: ["style-loader", "css-loader"] },
        ],
      },
      {
        exclude: /(node_modules)/,
        loader: "ts-loader",
        test: /\.tsx?$/,
      },
    ],
  },
  resolve: {
    extensions: [".js", ".cjs", ".jsx", ".ts", ".tsx", ".md", ".mdx"],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        CHANGE_ID: JSON.stringify(process.env.CHANGE_ID || "latest"),
      },
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./public",
        },
      ],
    }),

    ...pageRoutes.map((key) => {
      return new HTMLWebpackPlugin({
        title: "Player UI",
        template: "./config/index.html",
        filename: `${key}.html`,
      });
    }),
  ],
};

export default config;
