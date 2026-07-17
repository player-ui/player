import type {
  ExtendedPlayerPlugin,
  Player,
  ReactPlayer,
  ReactPlayerPlugin,
} from "@player-ui/react";
import { AssetProviderPlugin } from "@player-ui/asset-provider-plugin-react";
import { A2UIPlugin as A2UICorePlugin } from "@player-ui/a2ui-plugin";
import type {
  ButtonAsset,
  CardAsset,
  CheckBoxAsset,
  ChoicePickerAsset,
  ColumnAsset,
  DateTimeInputAsset,
  DividerAsset,
  IconAsset,
  ImageAsset,
  ListAsset,
  ModalAsset,
  RowAsset,
  SliderAsset,
  TabsAsset,
  TextAsset,
  TextFieldAsset,
} from "@player-ui/a2ui-plugin";
import {
  Button,
  Card,
  CheckBox,
  ChoicePicker,
  Column,
  DateTimeInput,
  Divider,
  Icon,
  Image,
  List,
  Modal,
  Row,
  Slider,
  Tabs,
  Text,
  TextField,
} from "./assets";

/**
 * Registers React renderers for all A2UI v0.9.1 components. Asset type names
 * are the verbatim A2UI component identifiers (Row, Column, Button, …) so
 * snapshots adapted via `adaptA2UIToFlow` resolve directly.
 */
export class A2UIPlugin
  implements
    ReactPlayerPlugin,
    ExtendedPlayerPlugin<
      [
        RowAsset,
        ColumnAsset,
        ListAsset,
        TextAsset,
        ImageAsset,
        IconAsset,
        DividerAsset,
        ButtonAsset,
        TextFieldAsset,
        CheckBoxAsset,
        SliderAsset,
        DateTimeInputAsset,
        ChoicePickerAsset,
        CardAsset,
        ModalAsset,
        TabsAsset,
      ]
    >
{
  name = "a2ui-web-plugin";

  applyReact(reactPlayer: ReactPlayer): void {
    reactPlayer.registerPlugin(
      new AssetProviderPlugin([
        ["Row", Row],
        ["Column", Column],
        ["List", List],
        ["Text", Text],
        ["Image", Image],
        ["Icon", Icon],
        ["Divider", Divider],
        ["Button", Button],
        ["TextField", TextField],
        ["CheckBox", CheckBox],
        ["Slider", Slider],
        ["DateTimeInput", DateTimeInput],
        ["ChoicePicker", ChoicePicker],
        ["Card", Card],
        ["Modal", Modal],
        ["Tabs", Tabs],
      ]),
    );
  }

  apply(player: Player): void {
    player.registerPlugin(new A2UICorePlugin());
  }
}
