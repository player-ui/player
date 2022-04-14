import { Box, Flex, Divider, OrderedList } from '@chakra-ui/react';
import { SkipNavContent, SkipNavLink } from '@chakra-ui/skip-nav';
import React from 'react';
import { AppContext } from './Context';
import { TopNavigation, SideNavigation, Footer } from './Navigation';

const TableOfContents = (props: PageProps) => {
  return (
    <Box display={{ base: 'none', xl: 'block' }}>
      Table Of Contents
      <OrderedList spacing={1} ml="0" mt="4" styleType="none">
        {props.tableOfContents?.map((h) => {
          return (
            <li key={h.text}>
              <a href={`#${h.id}`}>{h.text}</a>
            </li>
          );
        })}
      </OrderedList>
    </Box>
  );
};

interface PageProps {
  tableOfContents?: Array<{
    text: string;
    id: string;
    level: string;
  }>;
}

export const Page = (props: React.PropsWithChildren<PageProps>) => {
  const { bannerExpanded } = React.useContext(AppContext);

  const bannerHeight = '72px';
  const maxH = `calc(100vh - 88px - ${bannerExpanded ? bannerHeight : '0px'})`;
  const minH = `calc(100vh - 88px - 105px - ${
    bannerExpanded ? bannerHeight : '0px'
  })`;

  return (
    <Box minH="100vh">
      <SkipNavLink>Skip to Main Content</SkipNavLink>

      <Flex flexDir="column" padding="2">
        <TopNavigation />
        <Divider />
        <Flex>
          <Box as="main" w="100%" mx="auto">
            <Box display={{ md: 'flex' }}>
              <Box
                display={{
                  base: 'none',
                  md: 'block',
                }}
                overflow="auto"
                maxH={maxH}
                pr="8"
                ml="4"
              >
                <SideNavigation />
              </Box>
              <Box flex="1" minW="0" overflow="auto" maxH={maxH}>
                <Box minH={minH}>
                  <SkipNavContent />
                  {props.children}
                </Box>
                <Box pt="20">
                  <Footer />
                </Box>
              </Box>
              {props.tableOfContents && (
                <TableOfContents tableOfContents={props.tableOfContents} />
              )}
            </Box>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};
