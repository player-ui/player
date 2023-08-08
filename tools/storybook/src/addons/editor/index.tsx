import React from 'react';
import type { API } from '@storybook/api';
import { useDarkMode } from 'storybook-dark-mode';
import { dequal } from 'dequal';
import Editor from '@monaco-editor/react';
import { useFlowState, useStateActions } from '../../state';

interface EditorPanelProps {
  /** if the panel is shown */
  active: boolean;
  /** storybook api */
  api: API;
}

/** the panel for the flow editor */
export const EditorPanel = (props: EditorPanelProps) => {
  const { active } = props;
  const darkMode = useDarkMode();
  const flow = useFlowState(props.api.getChannel());
  const actions = useStateActions(props.api.getChannel());
  const [editorValue, setEditorValue] = React.useState(
    flow ? JSON.stringify(flow, null, 2) : '{}'
  );

  const updateTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  /** remove any pending saves */
  function clearPending() {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = undefined;
    }
  }

  React.useEffect(() => {
    if (!active) {
      return;
    }

    try {
      if (editorValue) {
        const parsed = JSON.parse(editorValue);
        if (dequal(flow, parsed)) {
          return;
        }
      }
    } catch (e) {}

    setEditorValue(JSON.stringify(flow, null, 2));
  }, [flow, active]);

  if (!active) {
    return null;
  }

  /** handler for changes to the content */
  const onChange = (val: string | undefined) => {
    clearPending();
    setEditorValue(val ?? '');

    try {
      if (val) {
        const parsed = JSON.parse(val);
        if (!dequal(parsed, flow)) {
          updateTimerRef.current = setTimeout(() => {
            if (active) {
              actions.setFlow(parsed);
            }
          }, 1000);
        }
      }
    } catch (e) {}
  };

  return (
    <div>
      <Editor
        theme={darkMode ? 'vs-dark' : 'light'}
        value={editorValue}
        language="json"
        options={{
          formatOnPaste: true,
        }}
        onChange={onChange}
      />
    </div>
  );
};
