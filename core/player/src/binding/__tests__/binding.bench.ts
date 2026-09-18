import { bench, describe } from "vitest";
import { BindingInstance, BindingParser } from "..";
import { LocalModel } from "../../data";

describe("BindingInstance construction", () => {
  bench(
    "from array (numeric + string segments)",
    () => {
      new BindingInstance(["user", "pets", 12, "name"]);
    },
    { iterations: 10000 },
  );

  bench(
    "from string",
    () => {
      new BindingInstance("user.pets.12.name");
    },
    { iterations: 10000 },
  );
});

describe("BindingParser.parse (simple)", () => {
  const parser = new BindingParser();

  // Dominant production path: the same bindings re-parsed constantly, served
  // from the BindingInstance cache.
  bench(
    "cache hit",
    () => {
      parser.parse("user.profile.name");
    },
    { iterations: 10000 },
  );

  // Cycle through unique simple bindings so most parses miss the cache,
  // exercising the fast-path normalize + BindingInstance creation.
  const coldParser = new BindingParser();
  const coldBindings = Array.from(
    { length: 2000 },
    (_, i) => `form.fields.field${i}.value`,
  );
  let coldIdx = 0;
  bench(
    "cache cold (fast-path)",
    () => {
      coldParser.parse(coldBindings[coldIdx]);
      coldIdx = (coldIdx + 1) % coldBindings.length;
    },
    { iterations: 10000 },
  );
});

describe("BindingParser.parse (complex query)", () => {
  const localModel = new LocalModel({
    foo: {
      pets: [
        { name: "spot", type: "cat" },
        { name: "frodo", type: "dog" },
      ],
    },
  });
  const parser = new BindingParser({
    get: localModel.get,
    set: localModel.set,
    evaluate: () => undefined,
  });

  // Query bindings re-resolve their dynamic segments on every parse (only the
  // resulting BindingInstance is cached), so this measures resolveBindingAST.
  bench(
    "foo.pets[name='frodo'].type",
    () => {
      parser.parse("foo.pets[name='frodo'].type");
    },
    { iterations: 10000 },
  );
});
