import type { Renderer, ProjectAnnotations } from "@storybook/types";
import { PlayerDecorator } from "./decorator";

export const preview: ProjectAnnotations<Renderer> = {
  decorators: [PlayerDecorator],
};
