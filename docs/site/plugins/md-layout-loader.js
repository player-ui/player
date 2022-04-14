const path = require('path');
const fm = require('gray-matter');
const slugger = require('github-slugger');
const removeMarkdown = require('remove-markdown');

// https://github.com/chakra-ui/chakra-ui-docs/blob/main/src/utils/mdx-utils.ts
function getTableOfContents(mdxContent) {
  const regexp = new RegExp(/^(#+\s)(.*)\n/, 'gm');
  // @ts-ignore
  const headings = [...mdxContent.matchAll(regexp)];
  let tableOfContents = [];

  if (headings.length) {
    tableOfContents = headings.map((heading) => {
      const headingText = removeMarkdown(heading[2].trim());
      const headingType = heading[1].trim().length;
      const headingLink = slugger.slug(headingText, false);

      return {
        text: headingText,
        id: headingLink,
        level: headingType,
      };
    });
  }

  return tableOfContents;
}

module.exports = async function (src) {
  const callback = this.async();
  const { data, content } = fm(src);

  const compDir = path.relative(
    this.context,
    path.join(__dirname, '..', 'components', 'Layout', `MDXPageLayout`)
  );

  const code = `import withLayout from '${compDir}';
export default withLayout(${JSON.stringify({
    ...data,
    tableOfContents: getTableOfContents(content),
  })})
${content}`;

  return callback(null, code);
};
