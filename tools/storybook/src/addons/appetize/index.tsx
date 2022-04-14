import React from 'react';
import type { API } from '@storybook/api';
import { useParameter } from '@storybook/api';
import { STORY_CHANGED } from '@storybook/core-events';
import {
  IconButton,
  Icons,
  WithTooltip,
  TooltipLinkList,
} from '@storybook/components';
import type { RenderTarget } from '../../types';
import { useStateActions } from '../../state';

interface RenderSelectionProps {
  /** storybook api */
  api: API;
}

/** Component to show the appetize dropdown */
export const RenderSelection = ({ api }: RenderSelectionProps) => {
  const params = useParameter('appetizeTokens', {});
  const actions = useStateActions(api.getChannel());
  const [selectedPlatform, setPlatform] =
    React.useState<RenderTarget['platform']>('web');

  React.useEffect(() => {
    /** callback for the subscribe listener */
    const listener = () => {
      setPlatform('web');
    };

    api.getChannel().addListener(STORY_CHANGED, listener);

    return () => {
      api.getChannel().removeListener(STORY_CHANGED, listener);
    };
  }, [api]);

  const mobilePlatforms = Object.keys(params) as Array<'ios' | 'android'>;

  if (mobilePlatforms.length === 0) {
    // No keys set so don't show
    return null;
  }

  return (
    <WithTooltip
      closeOnClick
      placement="top"
      trigger="click"
      tooltip={({ onHide }) => (
        <TooltipLinkList
          links={(['web', ...mobilePlatforms] as const).map((platform) => ({
            id: platform,
            title: platform,
            onClick: () => {
              setPlatform(platform);
              actions.setPlatform(platform);
              onHide();
            },
            value: platform,
            active: platform === selectedPlatform,
          }))}
        />
      )}
    >
      <IconButton title="Change the render target">
        <Icons icon={selectedPlatform === 'web' ? 'browser' : 'mobile'} />
      </IconButton>
    </WithTooltip>
  );
};
