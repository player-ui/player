import React from 'react';
import {
  Input,
  Box,
  Popover,
  PopoverContent,
  PopoverAnchor,
  Button,
  chakra,
  Heading,
  Text,
  InputGroup,
  useOutsideClick,
  UnorderedList,
  InputLeftElement,
  HStack,
} from '@chakra-ui/react';
import { SearchIcon, ChevronRightIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import lunr from 'lunr';

interface SearchIndex {
  /** The title of the page */
  title: string;

  /** The closest heading */
  header: string;

  /** the route to the page */
  path: string;

  /** The raw content */
  // eslint-disable-next-line react/no-unused-prop-types
  content: string;
}

const createSearchIndex = async () => {
  const searchIndex = (await import(
    '../config/search-index.json'
  )) as unknown as {
    default: Record<string, SearchIndex>;
  };

  const idx = lunr((builder) => {
    builder.ref('path');
    builder.field('title');
    builder.field('header');
    builder.field('content');

    Object.values(searchIndex.default).forEach((page) => {
      builder.add(page);
    });
  });

  return {
    searchIndex: searchIndex.default,
    idx,
  };
};

const useSearch = () => {
  const index = React.useMemo(() => createSearchIndex(), []);
  const [results, setResults] = React.useState<SearchIndex[]>([]);

  return {
    search: async (query: string) => {
      if (query === '') {
        setResults([]);
      } else {
        const searchIndex = await index;
        const searchResults = searchIndex.idx
          .search(query)
          .slice(0, 10)
          .map((r) => {
            return searchIndex.searchIndex[r.ref];
          });

        setResults(searchResults);
      }
    },
    clear: () => {
      setResults([]);
    },
    results,
  };
};

const SearchResult = (props: SearchIndex) => {
  return (
    <chakra.li overflow="hidden">
      <Link passHref href={props.path}>
        <Button as="a" variant="link" colorScheme="blue">
          <HStack gap="2px" divider={<ChevronRightIcon border="none" />}>
            <Heading as="h4" size="sm">
              {props.title}
            </Heading>
            {props.header && <Text>{props.header}</Text>}
          </HStack>
        </Button>
      </Link>
    </chakra.li>
  );
};

export const SearchInput = () => {
  const { search, results, clear } = useSearch();
  const [searchActive, setSearchActive] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const searchRef = React.useRef<HTMLDivElement>(null);

  const reset = React.useCallback(() => {
    clear();
    setQuery('');
    setSearchActive(false);
  }, [clear, setQuery, setSearchActive]);

  useOutsideClick({
    ref: searchRef,
    handler: reset,
  });

  return (
    <Box ref={searchRef}>
      <Popover initialFocusRef={inputRef} isOpen={searchActive} onClose={reset}>
        <PopoverAnchor>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon />
            </InputLeftElement>
            <Input
              ref={inputRef}
              placeholder="Search"
              value={query}
              onChange={(e) => {
                if (searchActive) {
                  search(e.target.value);
                }

                setQuery(e.target.value);
              }}
              onFocus={() => {
                setSearchActive(true);
              }}
            />
          </InputGroup>
        </PopoverAnchor>
        {searchActive && results.length > 0 && (
          <PopoverContent width="md">
            <Box p="4">
              <UnorderedList spacing="4" styleType="none" ml="0">
                {results.map((r) => (
                  <SearchResult key={r.path} {...r} />
                ))}
              </UnorderedList>
            </Box>
          </PopoverContent>
        )}
      </Popover>
    </Box>
  );
};
