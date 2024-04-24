import path from 'path';
import smartypants from 'remark-smartypants';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

// This will be replaced during the build stamping
export const BASE_PREFIX =
  process.env.NODE_ENV === 'production' ? '/DOCS_BASE_PATH' : undefined;

export default {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PREFIX,
  },
  basePath: BASE_PREFIX,
  assetPrefix: BASE_PREFIX,
  pageExtensions: ['jsx', 'js', 'ts', 'tsx', 'mdx', 'md'],
  webpack: (config, { dev, isServer, ...options }) => ({
    ...config,
    infrastructureLogging: {
      level: 'error',
    },
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /plugin-nav-data.json$/,
          use: [path.join(__dirname, './plugins/plugin-nav-generator')],
        },
        {
          test: /search-index.json$/,
          use: [path.join(__dirname, './plugins/search-index-loader')],
        },
        {
          test: /.mdx?$/, // load both .md and .mdx files
          use: [
            options.defaultLoaders.babel,
            {
              loader: '@mdx-js/loader',
              options: {
                jsx: true,
                remarkPlugins: [
                  smartypants, // Formatting (convert -- to em/en dash)
                ],
                rehypePlugins: [
                  rehypeSlug, // Add ids to headings
                  [rehypeAutolinkHeadings, { behavior: 'wrap' }], // Make headings links
                ],
              },
            },
            path.join(__dirname, './plugins/md-layout-loader'),
            path.join(__dirname, './plugins/mdx-link-append-loader.js'),
          ],
        },
      ],
    },
  }),
};
