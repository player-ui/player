import type { Flow, Asset, AssetWrapper } from '@player-ui/types';
import identify, { ObjType } from './identify';

export * from './identify';
export { identify };

interface JSend<T> {
  /** The status of the JSEND wrapper */
  status: string;
  /** The data we care about */
  data: T;
}

interface CollectionAsset extends Asset<'collection'> {
  /** The values of the collection. Used when there are an array of assets passed to the makeFlow fn */
  values: Array<AssetWrapper>;
}

/** Check an object for the JSEND wrapper and remove it if needed */
function unwrapJSend(obj: object) {
  const isJSend = 'status' in obj && 'data' in obj;

  if (isJSend) {
    return (obj as JSend<object>).data;
  }

  return obj;
}

/**
 * Take any given object and try to convert it to a flow
 */
export function makeFlow(obj: any): Flow {
  const objified = unwrapJSend(typeof obj === 'string' ? JSON.parse(obj) : obj);

  if (Array.isArray(objified)) {
    const collection: CollectionAsset = {
      id: 'collection',
      type: 'collection',
      values: objified.map((v) => {
        const type = identify(v);

        if (type === ObjType.ASSET) {
          return { asset: v };
        }

        return v;
      }),
    };

    return makeFlow(collection);
  }

  const type = identify(obj);

  if (type === ObjType.UNKNOWN) {
    throw new Error(
      'No clue how to convert this into a flow. Just do it yourself'
    );
  }

  if (type === ObjType.FLOW) {
    return obj;
  }

  if (type === ObjType.ASSET_WRAPPER) {
    return makeFlow(obj.asset);
  }

  return {
    id: 'generated-flow',
    views: [obj],
    data: {},
    navigation: {
      BEGIN: 'FLOW_1',
      FLOW_1: {
        startState: 'VIEW_1',
        VIEW_1: {
          state_type: 'VIEW',
          ref: obj.id,
          transitions: {
            '*': 'END_Done',
          },
        },
        END_Done: {
          state_type: 'END',
          outcome: 'done',
        },
      },
    },
  };
}
