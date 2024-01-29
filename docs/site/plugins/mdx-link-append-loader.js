module.exports = function (source) {
  const filePath = this.resourcePath;
  const newContent = `${source}\n\n---\n\n[Help to improve this page](https://github.dev/playerui/player/blob/main/${filePath})`;
  return newContent;
};
