import type { Schema, Navigation, Flow } from '@player-ui/types';
import type { RemoveUnknownIndex, AddUnknownIndex } from '../types';

export type FlowWithoutUnknown = RemoveUnknownIndex<Flow>;
export type FlowWithReactViews = AddUnknownIndex<
  Omit<FlowWithoutUnknown, 'views'> & {
    /** An array of JSX view elements */
    views?: Array<React.ReactElement>;
  }
>;

export type SerializeType = 'view' | 'flow' | 'schema' | 'navigation';

export type SerializablePlayerExportTypes =
  | React.ReactElement
  | FlowWithReactViews
  | Schema.Schema
  | Navigation;
