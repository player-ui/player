import {Player} from "@player-ui/player";
import { makeFlow } from '@player-ui/make-flow';
import {CheckPathPlugin} from "./pkg/check_path_plugin_rs.js";

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
const checkPathPlugin = new CheckPathPlugin();
const player = new Player({plugins: [checkPathPlugin]});

player.start(nestedAssetFlow)

