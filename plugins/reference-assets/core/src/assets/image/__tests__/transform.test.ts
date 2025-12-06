import { describe, it, expect } from "vitest";
import { runTransform } from "@player-ui/asset-testing-library";
import { imageTransform } from "..";

describe("image transform", () => {
  it("adds a prop altText which gets filled with the accessibility text if provided", () => {
    const ref = runTransform("image", imageTransform, {
      id: "image-1",
      type: "image",
      metaData: {
        ref: "https://raw.githubusercontent.com/player-ui/player/refs/tags/0.14.1/docs/site/src/assets/logo/logo-light-large.png",
        accessibility: "This is accessibility text for an image",
      },
      placeholder: "This is placeholder text for an image",
      caption: "This is a caption",
    });

    expect(ref.current?.altText).toBe(
      "This is accessibility text for an image",
    );
  });
  it("adds a prop altText which gets filled with the placeholder text if accessibility text not provided", () => {
    const ref = runTransform("image", imageTransform, {
      id: "image-1",
      type: "image",
      metaData: {
        ref: "https://raw.githubusercontent.com/player-ui/player/refs/tags/0.14.1/docs/site/src/assets/logo/logo-light-large.png",
      },
      placeholder: "This is placeholder text for an image",
      caption: "This is a caption",
    });

    expect(ref.current?.altText).toBe("This is placeholder text for an image");
  });
});
