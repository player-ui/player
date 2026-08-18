/**
 * Mock snapshots for the A2UI v0.9.1 reference assets. The canonical source
 * is the `.json` file next to each export — keep these as raw JSON so
 * non-JS platforms (iOS, Android) can consume them directly without a
 * TypeScript toolchain.
 *
 * The JS named exports below are sugar for storybook / vitest consumers and
 * stay in lockstep with the JSON files via `import ... from "./...json"`.
 */
import buttonBasic from "./button/basic.json";
import buttonWithAction from "./button/with-action.json";
import cardBasic from "./card/basic.json";
import checkBoxBasic from "./check-box/basic.json";
import choicePickerMulti from "./choice-picker/multi-select.json";
import choicePickerSingle from "./choice-picker/single-select.json";
import columnBasic from "./column/basic.json";
import dateTimeInputBasic from "./date-time-input/basic.json";
import dividerBasic from "./divider/basic.json";
import expressionsShowcase from "./expressions/showcase.json";
import iconBasic from "./icon/basic.json";
import imageBasic from "./image/basic.json";
import listBasic from "./list/basic.json";
import modalBasic from "./modal/basic.json";
import rowBasic from "./row/basic.json";
import sliderBasic from "./slider/basic.json";
import tabsBasic from "./tabs/basic.json";
import textBasic from "./text/basic.json";
import textFieldBasic from "./text-field/basic.json";
import textFieldValidation from "./text-field/validation.json";
import textVariants from "./text/variants.json";

export {
  buttonBasic,
  buttonWithAction,
  cardBasic,
  checkBoxBasic,
  choicePickerMulti,
  choicePickerSingle,
  columnBasic,
  dateTimeInputBasic,
  dividerBasic,
  expressionsShowcase,
  iconBasic,
  imageBasic,
  listBasic,
  modalBasic,
  rowBasic,
  sliderBasic,
  tabsBasic,
  textBasic,
  textFieldBasic,
  textFieldValidation,
  textVariants,
};
