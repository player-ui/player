import type { Asset } from '@player-ui/types';
import type {
  Blockquote,
  Code,
  Emphasis,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  Strong,
  Text,
  ThematicBreak,
} from 'mdast-util-from-markdown/lib';
import type { Transformer } from '../types';

/**
 * Swap markdown type to text
 */
function swapMarkdownType(asset: Asset): Asset {
  return { ...asset, type: 'text' };
}

/**
 * Transforms Text AST Node into Player Content
 */
const textTransformer: Transformer<Text> = ({ astNode, asset, mappers }) => {
  const { value } = astNode;

  return mappers.text({
    originalAsset: asset,
    value,
  });
};

/**
 * Transforms Emphasis AST Node into Player Content
 */
const emphasisTransformer: Transformer<Emphasis> = ({
  astNode,
  asset,
  mappers,
  transformers,
}) => {
  if (mappers.emphasis) {
    const { children } = astNode;

    const value = children.map((node) =>
      transformers[node.type]({ astNode: node, asset, mappers, transformers })
    );

    return mappers.emphasis({
      originalAsset: asset,
      value,
    });
  }

  return swapMarkdownType(asset);
};

/**
 * Transforms Strong AST Node into Player Content
 */
const strongTransformer: Transformer<Strong> = ({
  astNode,
  asset,
  mappers,
  transformers,
}) => {
  if (mappers.strong) {
    const { children } = astNode;

    const value = children.map((node) =>
      transformers[node.type]({ astNode: node, asset, mappers, transformers })
    );

    return mappers.strong({
      originalAsset: asset,
      value,
    });
  }

  return swapMarkdownType(asset);
};

/**
 * Transforms Paragraph AST Node into Player Content
 */
const paragraphTransformer: Transformer<Paragraph> = ({
  astNode,
  asset,
  mappers,
  transformers,
}) => {
  const { children } = astNode;

  if (
    children.every(({ type }) => Boolean(mappers[type as keyof typeof mappers]))
  ) {
    const value = children.map((node) =>
      transformers[node.type]({ astNode: node, asset, mappers, transformers })
    );

    return mappers.paragraph({
      originalAsset: asset,
      value,
    });
  }

  return swapMarkdownType(asset);
};

/**
 * Transforms List AST Node into Player Content
 */
const listTransformer: Transformer<List> = ({
  astNode,
  asset,
  mappers,
  transformers,
}) => {
  if (mappers.list) {
    const { children, ordered, start } = astNode;

    const value = children.map((node) =>
      transformers[node.type]({ astNode: node, asset, mappers, transformers })
    );

    return mappers.list({
      originalAsset: asset,
      value,
      ordered: Boolean(ordered),
      start: start || undefined,
    });
  }

  return swapMarkdownType(asset);
};

/**
 * Transforms ListItem AST Node into Player Content
 */
const listItemTransformer: Transformer<ListItem> = ({
  astNode,
  asset,
  mappers,
  transformers,
}) => {
  const { children } = astNode;

  const value = children.map((node) =>
    transformers[node.type]({ astNode: node, asset, mappers, transformers })
  );

  const mapper = mappers.listItem || mappers.paragraph;

  return mapper({
    originalAsset: asset,
    value,
  });
};

/**
 * Transforms Link AST Node into Player Content
 */
const linkTransformer: Transformer<Link> = ({
  astNode,
  asset,
  mappers,
  transformers,
}) => {
  if (mappers.link) {
    const { children, url } = astNode;

    const value = children.map((node) =>
      transformers[node.type]({ astNode: node, asset, mappers, transformers })
    );

    return mappers.link({
      originalAsset: asset,
      href: url,
      value,
    });
  }

  return swapMarkdownType(asset);
};

/**
 * Transforms Image AST Node into Player Content
 */
const imageTransformer: Transformer<Image> = ({ astNode, asset, mappers }) => {
  if (mappers.image) {
    const { title, url, alt } = astNode;

    return mappers.image({
      originalAsset: asset,
      src: url,
      value: title || alt || '',
    });
  }

  return swapMarkdownType(asset);
};

/**
 * Transforms Blockquote AST Node into Player Content
 */
const blockquoteTransformer: Transformer<Blockquote> = ({
  astNode,
  asset,
  mappers,
  transformers,
}) => {
  if (mappers.blockquote) {
    const { children } = astNode;

    const value = children.map((node) =>
      transformers[node.type]({ astNode: node, asset, mappers, transformers })
    );

    return mappers.blockquote({
      originalAsset: asset,
      value,
    });
  }

  return swapMarkdownType(asset);
};

/**
 * Transforms InlineCode AST Node into Player Content
 */
const inlineCodeTransformer: Transformer<InlineCode> = ({
  astNode,
  asset,
  mappers,
}) => {
  if (mappers.inlineCode) {
    const { value } = astNode;

    return mappers.inlineCode({
      originalAsset: asset,
      value,
    });
  }

  return swapMarkdownType(asset);
};

/**
 * Transforms Code block AST Node into Player Content
 */
const codeTransformer: Transformer<Code> = ({ astNode, asset, mappers }) => {
  if (mappers.code) {
    const { value, lang } = astNode;

    return mappers.code({
      originalAsset: asset,
      value,
      lang: lang || undefined,
    });
  }

  return swapMarkdownType(asset);
};

/**
 * Transforms Horizontal Rule (Thematic Break) AST Node into Player Content
 */
const horizontalRuleTransformer: Transformer<ThematicBreak> = ({
  asset,
  mappers,
}) => {
  if (mappers.horizontalRule) {
    return mappers.horizontalRule({
      originalAsset: asset,
      value: '---',
    });
  }

  return swapMarkdownType(asset);
};

/**
 * Transforms Heading AST Node into Player Content
 */
const headingTransformer: Transformer<Heading> = ({
  astNode,
  asset,
  mappers,
  transformers,
}) => {
  if (mappers.heading) {
    const { children, depth } = astNode;

    const value = children.map((node) =>
      transformers[node.type]({ astNode: node, asset, mappers, transformers })
    );

    return mappers.heading({
      originalAsset: asset,
      value,
      depth,
    });
  }

  return swapMarkdownType(asset);
};

export const transformers: Record<string, Transformer> = {
  horizontalRule: horizontalRuleTransformer,
  text: textTransformer,
  emphasis: emphasisTransformer,
  strong: strongTransformer,
  blockquote: blockquoteTransformer,
  list: listTransformer,
  listItem: listItemTransformer,
  link: linkTransformer,
  image: imageTransformer,
  paragraph: paragraphTransformer,
  code: codeTransformer,
  heading: headingTransformer,
  inlineCode: inlineCodeTransformer,
};
