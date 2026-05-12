import type { A2UISnapshot } from "@player-ui/player";

/**
 * Adapter flattens `action.event.name` into the asset's transition `value`.
 * Storybook navigation has an `END_submit` state synthesized automatically.
 */
const snapshot: A2UISnapshot = {
  surfaceId: "button-with-action",
  components: [
    {
      id: "root",
      component: "Column",
      children: ["hint", "btn"],
    },
    {
      id: "hint",
      component: "Text",
      text: "Click the button to fire a 'submit' event.",
    },
    {
      id: "btn",
      component: "Button",
      child: "lbl",
      variant: "primary",
      action: { event: { name: "submit" } },
    },
    { id: "lbl", component: "Text", text: "Submit" },
  ],
};

export default snapshot;
