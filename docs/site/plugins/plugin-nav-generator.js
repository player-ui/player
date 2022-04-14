const path = require('path');
const fm = require('gray-matter');
const globby = require('globby');
const fs = require('fs/promises');

const pluginsDir = path.join(__dirname, '..', 'pages', 'plugins');
const exts = ['md', 'mdx'];

const platformOrder = ['core', 'react', 'ios', 'android'];

const cleanPlatforms = (platforms) => (platforms?.toLowerCase().split(',') ?? []).map(a => a.trim()).sort((a, b) => platformOrder.indexOf(a) - platformOrder.indexOf(b));

const genPath = (filepath) => path.basename(filepath).split('.')[0];

module.exports = async function () {
  const callback = this.async();

  try {
    const pluginRoutes = [
      {
        title: 'Overview',
        path: '/plugins',
      },
    ];

    const matches = exts.map((e) => path.join(pluginsDir, '**', `*.${e}`));
    const plugins = await globby(matches);

    await Promise.all(
      plugins
        .filter((page) => !page.includes('index.md'))
        .map(async (page) => {
          const pageContents = await fs.readFile(page, 'utf-8');
          const { data } = fm(pageContents);

          const route = {
            title: data.title,
            path: `/plugins/${genPath(page)}`,
            metaData: {
              platform: cleanPlatforms(data.platform),
            },
          };

          pluginRoutes.push(route);
        })
    );

    const code = JSON.stringify({
      routes: pluginRoutes.sort((a, b) => a.path > b.path ? 1 : -1)
    })
  
    return callback(null, code);
  } catch (e) {
    console.error(e)
    return callback(e, null)
  }
};
