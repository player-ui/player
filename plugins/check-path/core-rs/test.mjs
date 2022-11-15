import {CheckPathPlugin} from "./pkg/check_path_plugin_rs.js";
import {Player} from "@player-ui/player";

const plugin = new CheckPathPlugin();
const player = new Player();

plugin.apply(player)

