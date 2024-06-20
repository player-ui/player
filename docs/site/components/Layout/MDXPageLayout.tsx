import * as React from "react";
// import Head from 'next/head';
import { Container, Flex } from "@chakra-ui/react";
import { MDXProvider } from "@mdx-js/react";
import { MDXComponents } from "../mdx-components";
import { Page } from "../Page";

interface PageFrontmatter {
  title: string;

  tableOfContents: any;
}

export default function withDocs(p: PageFrontmatter) {
  const LayoutHome = (props: React.PropsWithChildren<unknown>) => {
    return (
      <Page>
        {/* <Head>
          <title>Player - {p.title}</title>
        </Head> */}
        <Flex alignItems="center">
          <Container maxW="container.lg">
            <MDXProvider components={MDXComponents}>
              {props.children}
            </MDXProvider>
          </Container>
        </Flex>
      </Page>
    );
  };

  return LayoutHome;
}
