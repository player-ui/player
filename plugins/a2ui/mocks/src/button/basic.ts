import type { A2UISnapshot } from "@player-ui/player";

const snapshot: A2UISnapshot = {
  surfaceId: "button-basic",
  components: [
    { id: "root", component: "Button", child: "lbl", variant: "primary" },
    { id: "lbl", component: "Text", text: "Click me" },
  ],
};

export default snapshot;
