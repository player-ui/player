import React from 'react';
import type { Flow } from '@player-ui/player';
import addons from '@storybook/addons';
import { DocsContext } from '@storybook/addon-docs';
import { useStateActions, useFlowState } from '../state/hooks';

/** Use the flow from the editor or the original one */
export function useEditorFlow(initialFlow: Flow) {
  const stateActions = useStateActions(addons.getChannel());
  const flow = useFlowState(addons.getChannel());

  const docsContext = React.useContext(DocsContext);

  React.useEffect(() => {
    stateActions.setFlow(initialFlow);
  }, [initialFlow]);

  React.useEffect(() => {
    if (!flow) {
      stateActions.setFlow(initialFlow);
    }
  }, [flow]);

  if (docsContext.id) {
    return initialFlow;
  }

  return flow ?? initialFlow;
}
