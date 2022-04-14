import React from 'react';

export const DEFAULT_CONTEXT = {
  bannerExpanded: true,
  setBannerExpanded: (expanded: boolean) => {},
};

export const AppContext = React.createContext(DEFAULT_CONTEXT);

export const Context = (props: React.PropsWithChildren<unknown>) => {
  const [state, setState] = React.useState(DEFAULT_CONTEXT);

  const withHandlers = React.useMemo(() => {
    return {
      ...state,
      setBannerExpanded: (expanded: boolean) => {
        setState({ ...state, bannerExpanded: expanded });
      },
    };
  }, [state]);

  return (
    <AppContext.Provider value={withHandlers}>
      {props.children}
    </AppContext.Provider>
  );
};
