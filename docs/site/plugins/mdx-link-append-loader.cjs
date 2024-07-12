const path = require("path");

module.exports = function (source) {
  const filePath = this.resourcePath;
  const rootDir = this.rootContext;
  const relativePath = path.relative(rootDir, filePath);
  const newContent = `${source}\n\n---\n\n[Help to improve this page](https://github.dev/player-ui/player/blob/main/docs/site/${relativePath})`;
  return newContent;
};
