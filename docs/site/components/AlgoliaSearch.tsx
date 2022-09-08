/* eslint-disable import/no-unassigned-import */
import React from 'react';
import { DocSearch } from '@docsearch/react';

import '@docsearch/css';

export const AlgoliaSearch = () => {
  return (
    <DocSearch
      appId="OX3UZKXCOH"
      apiKey="ALGOLIA_SEARCH_API_KEY" // readonly specific to search queries
      indexName="player-ui"
    />
  );
};
