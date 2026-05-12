import type { A2UISnapshot } from "@player-ui/player";

const snapshot: A2UISnapshot = {
  surfaceId: "card-basic",
  components: [
    { id: "root", component: "Card", child: "body" },
    {
      id: "body",
      component: "Column",
      children: ["title", "para"],
    },
    { id: "title", component: "Text", text: "Card Title", variant: "h4" },
    {
      id: "para",
      component: "Text",
      text: "This is a card body — a padded surface with elevation.",
    },
  ],
};

export default snapshot;
