import type { ExtendedPlayerPlugin, Player } from "@player-ui/player";
import { AssetTransformPlugin } from "@player-ui/asset-transform-plugin";
import {
  buttonTransform,
  checkBoxTransform,
  choicePickerTransform,
  dateTimeInputTransform,
  sliderTransform,
  textFieldTransform,
  textTransform,
} from "../assets";
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
} from "../assets";

/**
 * Registers per-component transforms that attach `run()`/`set()`/`value`
 * helpers used by the React layer. Components without transforms (Row,
 * Column, etc.) flow through unchanged.
 */
export class A2UITransformPlugin
  implements
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
  name = "a2ui-transforms";

  apply(player: Player): void {
    player.registerPlugin(
      new AssetTransformPlugin([
        [{ type: "Button" }, buttonTransform],
        [{ type: "TextField" }, textFieldTransform],
        [{ type: "CheckBox" }, checkBoxTransform],
        [{ type: "Slider" }, sliderTransform],
        [{ type: "DateTimeInput" }, dateTimeInputTransform],
        [{ type: "ChoicePicker" }, choicePickerTransform],
        [{ type: "Text" }, textTransform],
      ]),
    );
  }
}
