import { test, expect, describe } from "vitest";
import type { InProgressState } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { makeFlow } from "@player-ui/make-flow";
import { DataFilterPlugin, omitIn } from "..";

test("removes top level keys", async () => {
  const player = new Player({
    plugins: [
      new DataFilterPlugin({
        paths: ["local", "other.nested", ["other", "array"]],
      }),
    ],
  });

  const basicFlow = makeFlow({ asset: { id: "test", type: "test" } });
  const end = player.start(basicFlow);

  const {
    controllers: { data, flow },
  } = player.getState() as InProgressState;

  data.set([
    ["local.foo", "bar"],
    ["notLocal.foo", "bar"],
    ["other.nested.prop", "bar"],
    ["other.array", []],
  ]);

  flow.transition("Next");

  const response = await end;

  expect(response.data).toStrictEqual({
    notLocal: {
      foo: "bar",
    },
    other: {},
  });
});

describe("omitIn", () => {
  test("works for objects", () => {
    expect(
      omitIn(
        {
          foo: { bar: "baz" },
        },
        ["foo", "bar"],
      ),
    ).toStrictEqual({
      foo: {},
    });

    expect(
      omitIn({ foo: { bar: "baz", baz: "other" } }, ["foo", "bar"]),
    ).toStrictEqual({
      foo: { baz: "other" },
    });

    expect(omitIn({ foo: { bar: "baz" } }, "foo")).toStrictEqual({});
    expect(omitIn({ foo: { bar: "baz" } }, ["foo"])).toStrictEqual({});
  });
});
