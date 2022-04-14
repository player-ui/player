module.exports = {
  '*.{js,json,css,ts,tsx,jsx}': (filenames) => {
    const files = filenames.join(' ');
    return [`prettier --write ${files}`, `eslint ${files}`];
  },
  '*.md': (filenames) => {
    return [`prettier --write ${filenames.join(' ')}`];
  },
};
