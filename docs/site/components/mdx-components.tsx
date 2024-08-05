import React from "react";
import {
  Alert as ChakraAlert,
  AlertStatus,
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
  AlertIcon,
  Box,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { MDXProviderComponents } from "@mdx-js/react";
import { useNavigate } from "react-router";
import { Link, useSearchParams } from "react-router-dom";
import { CodeHighlight } from "./code-highlight";
import { withBasePrefix } from "./Image";
import { PlayerTeam } from "./PlayerTeam";

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
  ["core", "Core"],
  ["react", "React"],
  ["ios", "iOS"],
  ["android", "Android"],
]);

const ContentTabsNameMap = new Map([
  ["json", "JSON"],
  ["tsx", "TSX"],
]);

const CodeTabsMap = new Map([["gradle", GradleTab]]);

/**
 * Generic wrapper around Chakra's tab to make use in mdx easier.
 */
const Tabs = (props: any) => {
  return (
    <ChakraTabs
      colorScheme="blue"
      index={props.defaultTab}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const children = React.Children.toArray(props.children).filter((c: any) =>
    CodeTabsNameMap.has(c.props.mdxType.toLowerCase()),
  );

  const langPrefIndex = children.findIndex(
    (c: any) => c.props.mdxType.toLowerCase() === searchParams.get("lang"),
  );

  const defaultTab = Math.max(langPrefIndex, 0);

  return (
    <Tabs
      defaultTab={defaultTab}
      nameMap={CodeTabsNameMap}
      callback={(tabIndex: number) => {
        const lang = (children[tabIndex] as any).props.mdxType.toLowerCase();

        setSearchParams(
          Object.fromEntries([...searchParams.entries(), ["lang", lang]]),
        );
      }}
    >
      {children}
    </Tabs>
  );
};

/**
 * Tab section for Content Authoring. This should include tsx and/or example JSON files.
 */
const ContentTabs = (props: React.PropsWithChildren<unknown>) => {
  const children = React.Children.toArray(props.children).filter((c: any) => {
    return ContentTabsNameMap.has(c.props.mdxType.toLowerCase());
  });

  return <Tabs nameMap={ContentTabsNameMap}>{children}</Tabs>;
};

const langMap: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
};

/**
 * Code Block comopnent
 */
const Code = (props: any) => {
  let lang = props.className?.split("-")[1];
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
export const Img = (props: JSX.IntrinsicElements["img"]) => {
  const darkModeInvert = props.src?.includes("darkModeInvert");
  const darkModeOnly = props.src?.includes("darkModeOnly");
  const lightModeOnly = props.src?.includes("lightModeOnly");

  const { colorMode } = useColorMode();

  const filterStyles = useColorModeValue(
    undefined,
    "invert(80%) hue-rotate(180deg);",
  );

  if (
    (colorMode === "light" && darkModeOnly) ||
    (colorMode === "dark" && lightModeOnly)
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
  // Ignore any external urls
  if (!url.startsWith(".") && !url.startsWith("/")) {
    return url;
  }

  if (url.startsWith(".")) {
    return url;
  }

  const prefixed = withBasePrefix(url) ?? url;
  return prefixed;
};

export const InlineCode = (props: JSX.IntrinsicElements["code"]) => {
  return (
    <ChakraCode
      colorScheme="gray"
      bg={useColorModeValue("blue.50", "gray.800")}
      {...props}
    />
  );
};

type ChakraAlertProps = React.PropsWithChildren<{
  status?: AlertStatus;
  title?: string;
  description?: string;
}>;

export const Alert = (props: ChakraAlertProps) => {
  return (
    <ChakraAlert status={props.status} variant="left-accent">
      <AlertIcon />
      <Box flex={1}>
        {props.title && <AlertTitle>{props.title}</AlertTitle>}
        {props.description && (
          <AlertDescription>{props.description}</AlertDescription>
        )}
        {props.children}
      </Box>
    </ChakraAlert>
  );
};

/**
 * Anchor tab component wrapping Chakra's
 */
const A = (props: JSX.IntrinsicElements["a"]) => {
  const { href, ...other } = props;

  if (href?.startsWith(".")) {
    return (
      <CLink
        as={Link}
        to={useNormalizedUrl(href || "")}
        color={useColorModeValue("blue.800", "blue.600")}
        {...other}
      />
    );
  }

  return (
    <CLink
      href={useNormalizedUrl(href || "")}
      color={useColorModeValue("blue.800", "blue.600")}
      {...other}
    />
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

  PlatformTabs,

  ContentTabs,

  table: Table,
  th: Th,
  tr: Tr,
  td: Td,

  inlineCode: InlineCode,

  Alert,
  AlertTitle,
  AlertDescription,
};
