import type { A2UISnapshot } from "@player-ui/a2ui-plugin";

const snapshot: A2UISnapshot = {
  surfaceId: "choice-picker-single",
  data: { survey: { color: [] } },
  components: [
    {
      id: "root",
      component: "ChoicePicker",
      selections: { path: "/survey/color" },
      maxAllowedSelections: 1,
      options: [
        { label: "Red", value: "red" },
        { label: "Green", value: "green" },
        { label: "Blue", value: "blue" },
      ],
    },
  ],
};

export default snapshot;
