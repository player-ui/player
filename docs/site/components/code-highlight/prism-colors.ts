import {
  coy,
  vscDarkPlus,
} from 'react-syntax-highlighter/dist/cjs/styles/prism';

export const light = {
  ...coy,
  pre: {
    margin: '.5em 0',
  },
  'pre[class*="language-"]': {
    fontSize: '13px',
    textShadow: 'none',
    fontFamily:
      'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto',
  },
  'code[class*="language-"]': {
    fontSize: '13px',
    textShadow: 'none',
    fontFamily:
      'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.5',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
  },
};

export const dark = {
  ...vscDarkPlus,
};
