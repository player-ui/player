import type { A2UISnapshot } from "@player-ui/player";

const snapshot: A2UISnapshot = {
  surfaceId: "choice-picker-multi",
  data: { survey: { toppings: [] } },
  components: [
    {
      id: "root",
      component: "ChoicePicker",
      selections: { path: "/survey/toppings" },
      maxAllowedSelections: 3,
      options: [
        { label: "Cheese", value: "cheese" },
        { label: "Pepperoni", value: "pepperoni" },
        { label: "Mushrooms", value: "mushrooms" },
        { label: "Olives", value: "olives" },
        { label: "Onions", value: "onions" },
      ],
    },
  ],
};

export default snapshot;
