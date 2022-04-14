import React from 'react';
import path from 'path';
import Link from 'next/link';
import {
  Heading,
  Text,
  UnorderedList,
  OrderedList,
  ListItem,
  Code as ChakraCode,
  useColorMode,
  useColorModeValue,
  Tabs as ChakraTabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Image,
  HStack,
  Table,
  Th,
  Tr,
  Td,
  Link as CLink,
} from '@chakra-ui/react';
import { MDXProviderComponents } from '@mdx-js/react';
import { withRouter, useRouter } from 'next/router';
import { CodeHighlight } from './code-highlight';
import { withBasePrefix } from './Image';
import { PlayerTeam } from './PlayerTeam';

/**
 * Generic Tab Component that extends Chakra's Tab
 */
const GenericTab = (props: any) => {
  const name = props.nameMap?.get(props.mdxType.toLowerCase()) ?? props.mdxType;
  return <Tab key={props.mdxType}>{name}</Tab>;
};

/**
 * Tab Component specifically for Gradle to handle its multiple languages
 */
const GradleTab = (props: any) => {
  const scriptLang = props.language;
  return <Tab key={`gradle-${scriptLang}`}>{`Gradle ${scriptLang}`}</Tab>;
};

const CodeTabsNameMap = new Map([
  ['core', 'Core'],
  ['react', 'React'],
  ['ios', 'iOS'],
  ['android', 'Android'],
]);

const CodeTabsMap = new Map([['gradle', GradleTab]]);

/**
 * Generic wrapper around Chakra's tab to make use in mdx easier.
 */
const Tabs = (props: any) => {
  return (
    <ChakraTabs
      colorScheme="blue"
      defaultIndex={props.defaultTab}
      onChange={(index) => props.callback?.(index)}
    >
      <TabList>
        {React.Children.map(props.children, (child: any) => {
          const TabComponent =
            CodeTabsMap.get(child.props.mdxType.toLowerCase()) ?? GenericTab;
          return (
            <TabComponent
              key={child.props.mdxType}
              nameMap={props.nameMap}
              {...child.props}
            />
          );
        })}
      </TabList>
      <TabPanels>
        {React.Children.map(props.children, (child: any) => {
          return (
            <TabPanel key={child.props.mdxType}>
              {child.props.children}
            </TabPanel>
          );
        })}
      </TabPanels>
    </ChakraTabs>
  );
};

/**
 * Tabs specifically for plugin docs that only allow certain tabs
 */
const PlatformTabs = (props: React.PropsWithChildren<unknown>) => {
  const router = useRouter();

  const children = React.Children.toArray(props.children).filter((c: any) =>
    CodeTabsNameMap.has(c.props.mdxType.toLowerCase())
  );

  if (!router.isReady) {
    return <Progress isIndeterminate size="xs" />;
  }

  const langPrefIndex = children.findIndex(
    (c: any) => c.props.mdxType.toLowerCase() === router.query.lang
  );

  const defaultTab = Math.max(langPrefIndex, 0);

  return (
    <Tabs
      defaultTab={defaultTab}
      nameMap={CodeTabsNameMap}
      callback={(tabIndex: number) => {
        const lang = (children[tabIndex] as any).props.mdxType.toLowerCase();
        router.push({
          pathname: router.pathname,
          query: {
            ...router.query,
            lang,
          },
        });
      }}
    >
      {children}
    </Tabs>
  );
};

const langMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
};

/**
 * Code Block comopnent
 */
const Code = (props: any) => {
  let lang = props.className?.split('-')[1];
  if (langMap[lang] !== undefined) {
    lang = langMap[lang];
  }

  return (
    <CodeHighlight language={lang} {...props}>
      {props.children.trim()}
    </CodeHighlight>
  );
};

/**
 * Image Component
 */
export const Img = (props: JSX.IntrinsicElements['img']) => {
  const darkModeInvert = props.src?.includes('darkModeInvert');
  const darkModeOnly = props.src?.includes('darkModeOnly');
  const lightModeOnly = props.src?.includes('lightModeOnly');

  const { colorMode } = useColorMode();

  const filterStyles = useColorModeValue(
    undefined,
    'invert(80%) hue-rotate(180deg);'
  );

  if (
    (colorMode === 'light' && darkModeOnly) ||
    (colorMode === 'dark' && lightModeOnly)
  ) {
    return null;
  }

  return (
    <HStack justifyContent="center">
      <Image
        {...props}
        src={withBasePrefix(props.src)}
        filter={darkModeInvert ? filterStyles : undefined}
      />
    </HStack>
  );
};

/**
 * Normalize URL to conform to local path rules
 */
export const useNormalizedUrl = (url: string) => {
  const router = useRouter();

  if (!url.startsWith('.')) {
    return url;
  }

  const ext = path.extname(url);
  let withoutExt = url;
  if (ext) {
    withoutExt = path.join(path.dirname(url), path.basename(url, ext));
  }

  return path.join(path.dirname(router.pathname), withoutExt);
};

export const InlineCode = (props: JSX.IntrinsicElements['code']) => {
  return (
    <ChakraCode
      colorScheme="gray"
      bg={useColorModeValue('blue.50', 'gray.800')}
      {...props}
    />
  );
};

/**
 * Anchor tab component wrapping Chakra's
 */
const A = (props: JSX.IntrinsicElements['a']) => {
  const { href, ...other } = props;
  return (
    <Link passHref href={useNormalizedUrl(href || '')}>
      <CLink color={useColorModeValue('blue.800', 'blue.600')} {...other} />
    </Link>
  );
};

export const MDXComponents: MDXProviderComponents = {
  h1: (props: any) => <Heading my="1.5rem" as="h1" size="xl" {...props} />,
  h2: (props: any) => <Heading my="1.5rem" as="h2" size="lg" {...props} />,
  h3: (props: any) => <Heading my="1.5rem" as="h3" size="md" {...props} />,
  h4: (props: any) => <Heading my="1.5rem" as="h4" size="sm" {...props} />,

  p: (props: any) => <Text as="div" my="1.5rem" {...props} />,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  img: Img,
  code: Code,

  a: A,

  Tabs,

  PlayerTeam,

  PlatformTabs: withRouter(PlatformTabs),

  table: Table,
  th: Th,
  tr: Tr,
  td: Td,

  inlineCode: InlineCode,
};
