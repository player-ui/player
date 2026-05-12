import type { A2UISnapshot } from "@player-ui/player";

const snapshot: A2UISnapshot = {
  surfaceId: "modal-basic",
  components: [
    {
      id: "root",
      component: "Modal",
      entryPointChild: "openBtn",
      contentChild: "body",
    },
    {
      id: "openBtn",
      component: "Button",
      child: "openLbl",
      variant: "primary",
    },
    { id: "openLbl", component: "Text", text: "Open Modal" },
    {
      id: "body",
      component: "Column",
      children: ["title", "para"],
    },
    { id: "title", component: "Text", text: "Modal Title", variant: "h4" },
    { id: "para", component: "Text", text: "This is the modal body content." },
  ],
};

export default snapshot;
