import {Player} from "@player-ui/player";
import {makeFlow} from '@player-ui/make-flow';
import {AssetTransformPlugin} from '@player-ui/asset-transform-plugin';
import {CheckPathPlugin} from '@player-ui/check-path-plugin';

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
let dataController = player.getState().controllers.data;
dataController.set([['foo.baz', true]]);

// setTimeout(()=>,0);
// console.log(checkPathPlugin.getPath('coll-val-2-1', { type: 'collection' }))

console.log(checkPathPlugin.getPath('coll-val-2-1', [
    { type: 'collection' },
    { type: 'collection' },
]))
