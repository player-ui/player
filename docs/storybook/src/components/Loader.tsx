import React, { PropsWithChildren } from 'react';

/** A loader with suspense */
export const Loader = (props: PropsWithChildren<any>) => {
  return (
    <React.Suspense
      fallback={<Loader title="Waiting for player to render..." />}
    >
      {props.children}
    </React.Suspense>
  );
};
