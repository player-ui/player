import React from "react";
import { test, expect } from "vitest";
import { render } from "@player-tools/dsl";
import { AsyncNode } from "../index";

test("works for id prop", async () => {
  expect((await render(<AsyncNode id={"nodeId"} />)).jsonValue).toStrictEqual({
    id: "nodeId",
    async: "true",
  });
});
