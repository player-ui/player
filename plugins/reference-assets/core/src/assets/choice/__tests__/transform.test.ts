import { describe, it, expect } from "vitest";
import { runTransform } from "@player-ui/asset-testing-library";
import { CommonTypesPlugin } from "@player-ui/common-types-plugin";
import { choiceTransform } from "..";

describe("choice transform", () => {
  it("adds a clearSelection method that clears choice selection", async () => {
    const choice = {
      views: [
        {
          id: "choice",
          type: "choice",
          binding: "foo.bar",
          items: [
            {
              id: "item-1",
              value: "item-1",
            },
          ],
        },
      ],
      data: {
        foo: {
          bar: "item-1",
        },
      },
    };

    const ref = runTransform("choice", choiceTransform, choice);

    expect(ref.controllers?.data.get("foo.bar")).toBe("item-1");
    ref.current?.clearSelection();
    expect(ref.controllers?.data.get("foo.bar")).toBe(null);
  });

  it("adds a select method to each choice", async () => {
    const choice = {
      id: "choice",
      type: "choice",
      binding: "foo.bar",
      items: [
        {
          id: "item-1",
          value: "item-1",
        },
        {
          id: "item-2",
          value: "item-2",
        },
      ],
    };

    const ref = runTransform("choice", choiceTransform, choice);

    expect(ref.controllers?.data.get("foo.bar")).toBeUndefined();

    ref.current?.items[0].select();
    expect(ref.controllers?.data.get("foo.bar")).toBe("item-1");

    ref.current?.items[1].select();
    expect(ref.controllers?.data.get("foo.bar")).toBe("item-2");
  });

  it("adds an unselect method to each choice", async () => {
    const choice = {
      id: "choice",
      type: "choice",
      binding: "foo.bar",
      items: [
        {
          id: "item-1",
          value: "item-1",
        },
        {
          id: "item-2",
          value: "item-2",
        },
      ],
    };

    const ref = runTransform("choice", choiceTransform, choice);

    ref.current?.items[0].select();
    expect(ref.controllers?.data.get("foo.bar")).toBe("item-1");
    ref.current?.items[0].unselect();
    expect(ref.controllers?.data.get("foo.bar")).toBe(null);

    ref.current?.items[1].select();
    expect(ref.controllers?.data.get("foo.bar")).toBe("item-2");
    ref.current?.items[1].unselect();
    expect(ref.controllers?.data.get("foo.bar")).toBe(null);
  });

  it("exposes validations", async () => {
    const validations = [
      {
        type: "required",
      },
    ];

    const choice = {
      views: [
        {
          id: "choice",
          type: "choice",
          binding: "foo.bar",
          items: [
            {
              id: "item-1",
              value: "item-1",
            },
            {
              id: "item-2",
              value: "item-2",
            },
          ],
        },
      ],
      schema: {
        ROOT: {
          foo: {
            type: "FooType",
          },
        },
        FooType: {
          bar: {
            type: "StringType",
            validation: [
              {
                type: "required",
                trigger: "load",
              },
            ],
          },
        },
      },
    };

    const ref = runTransform("choice", choiceTransform, choice, [
      new CommonTypesPlugin(),
    ]);

    expect(ref.current?.validation?.type).toBe(validations[0].type);
  });
});
