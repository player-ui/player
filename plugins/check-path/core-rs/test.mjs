import {Player} from "@player-ui/player";
import {makeFlow} from '@player-ui/make-flow';
import {AssetTransformPlugin} from '@player-ui/asset-transform-plugin';
import { CheckPathPlugin  } from '@player-ui/check-path-plugin';

import {CheckPathPlugin as CheckPathPluginRS} from "./pkg/check_path_plugin_rs.js";

const nestedAssetFlow = makeFlow({
    id: 'view-1',
    type: 'view',
    fields: {
        asset: {
            id: 'fields',
            type: 'collection',
            metaData: {
                role: 'awesome',
            },
            values: [
                {
                    asset: {
                        id: 'coll-val-1',
                        type: 'input',
                        label: {
                            asset: {
                                id: 'coll-val-1-label',
                                type: 'text',
                            },
                        },
                    },
                },
                {
                    asset: {
                        id: 'coll-val-2',
                        type: 'collection',
                        values: [
                            {
                                asset: {
                                    id: 'coll-val-2-1',
                                    type: 'choice',
                                },
                            },
                        ],
                    },
                },
            ],
        },
    },
});

// console.log(JSON.stringify(nestedAssetFlow, null, 2))
const ViewTransform = (
    view
) => ({
    ...view,
    run() {
        return 'hello';
    },
});

const checkPathPlugin = new CheckPathPluginRS();

const player = new Player({
    plugins: [
        new AssetTransformPlugin([[{type: 'view'}, ViewTransform]]),
        checkPathPlugin]
});

player.start(nestedAssetFlow)
// console.log("path", checkPathPlugin.getPath("coll-val-2-1"));

