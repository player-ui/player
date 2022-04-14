const path = require('path');
const fm = require('gray-matter');
const slugger = require('github-slugger');
const removeMarkdown = require('remove-markdown');
const globby = require('globby');
const fs = require('fs/promises');

const pagesDir = path.join(__dirname, '..', 'pages');
const exts = ['md', 'mdx'];

const getLinkForPath = (p) => {
  const dirName = path.dirname(p);
  const baseName = path.basename(p, path.extname(p))

  return baseName === 'index' ? `/${dirName}` : `/${dirName}/${baseName}`
}

const withHeading = (p, heading) => heading ? `${p}#${heading}` : p


const splitContentByHeadings = (title, contents, basePath) => {
  const regexp = new RegExp(/^(#+\s)(.*)\n/, 'gm');
  const headings = [...contents.matchAll(regexp)];
  const matches = {};
  
  if (!contents) {
    return matches;
  }

  let workingContentString = contents;
  let workingHeading;

  headings.forEach(heading => {
    if (!workingContentString) {
      return;
    }
    
    // Remove everything from workingContentString until we hit this heading
    const [contentsBeforeMatch, contentsAfterMatch] = workingContentString.split(heading[0])

    const result = {
      path: withHeading(basePath, slugger.slug(workingHeading, false)),
      content: [workingHeading, removeMarkdown(contentsBeforeMatch)].join('\n'),
      header: workingHeading,
      title,
    }

    matches[result.path] = result;

    workingContentString = contentsAfterMatch;
    workingHeading = removeMarkdown(heading[2]).trim();
  })

  return matches;
}

module.exports = async function () {
  
  const callback = this.async();
  
  try {
    let searchIndex = {};

    const matches = exts.map(e => path.join(pagesDir, '**', `*.${e}`));
    const pages = await globby(matches);

    await Promise.all(pages.map(async page => {
      const pageContents = await fs.readFile(page, 'utf-8');
      const pageRef = getLinkForPath(path.relative(pagesDir, page));
      const { data, content } = fm(pageContents);

      searchIndex = {
        ...searchIndex,
        ...splitContentByHeadings(data.title, content, pageRef)
      }
    }))


    return callback(null, JSON.stringify(searchIndex, null, 2));
  } catch (e) {
    console.error(e)
    return callback(e, null);
  }
}