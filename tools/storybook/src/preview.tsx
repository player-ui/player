import type { Renderer, ProjectAnnotations } from "storybook/internal/types";
import { PlayerDecorator } from "./decorator";

export const preview: ProjectAnnotations<Renderer> = {
  decorators: [PlayerDecorator],
};
