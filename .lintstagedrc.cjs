module.exports = {
  '*.{js,json,css,ts,tsx,jsx}': (filenames) => {
    const files = filenames.join(' ');
    return [`prettier --write ${files}`, `eslint ${files}`];
  },
  '*.md': (filenames) => {
    return [`prettier --write ${filenames.join(' ')}`];
  },
  '*.swift': (filenames) => {
    const files = filenames.join(' ');
    return [`mint run swiftformat ${files}`];
  },
};
