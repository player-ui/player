import { bench, describe } from "vitest";
import { BindingInstance, BindingParser } from "../../../binding";
import { DataController } from "../controller";

/** A deep + wide model that mirrors a realistic form's data shape */
const buildModel = () => ({
  user: {
    id: "u1",
    name: "Ada",
    profile: {
      age: 30,
      address: { street: "1 Main", city: "Anytown", zip: "00000" },
    },
  },
  form: {
    fields: Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [
        `field${i}`,
        { value: i, valid: true },
      ]),
    ),
  },
});

const makeController = () =>
  new DataController(buildModel(), { pathResolver: new BindingParser() });

const shallow = new BindingInstance("user.name");

// Two deep-different objects we alternate between so every set genuinely
// changes the value (keeping the dequal + setIn cost stable across iterations).
const profileA = {
  age: 30,
  bio: "engineer",
  address: { street: "1 Main", city: "Anytown", zip: "00000" },
  tags: ["a", "b", "c"],
};
const profileB = {
  age: 31,
  bio: "scientist",
  address: { street: "2 Elm", city: "Otherville", zip: "11111" },
  tags: ["x", "y", "z"],
};
const profile = new BindingInstance("user.profile");

const batchA: Array<[string, any]> = Array.from({ length: 15 }, (_, i) => [
  `form.fields.field${i}.value`,
  i + 100,
]);
const batchB: Array<[string, any]> = Array.from({ length: 15 }, (_, i) => [
  `form.fields.field${i}.value`,
  i + 200,
]);

// Larger transactions to characterize the parse + dequal + structural-share
// path as batch size grows.
const batch50A: Array<[string, any]> = Array.from({ length: 50 }, (_, i) => [
  `form.fields.field${i}.value`,
  i + 1000,
]);
const batch50B: Array<[string, any]> = Array.from({ length: 50 }, (_, i) => [
  `form.fields.field${i}.value`,
  i + 2000,
]);

let tick = 0;

describe("DataController set", () => {
  const controller = makeController();

  // Set a binding to its current value: exercises the dequal "unchanged" path.
  bench(
    "set no-op",
    () => {
      controller.set([[shallow, "Ada"]]);
    },
    { iterations: 10000 },
  );

  bench(
    "set changed scalar",
    () => {
      tick += 1;
      controller.set([[shallow, tick]]);
    },
    { iterations: 10000 },
  );

  // Forces a full deep dequal over a non-trivial object every iteration.
  bench(
    "set changed object",
    () => {
      tick += 1;
      controller.set([[profile, tick % 2 ? profileA : profileB]]);
    },
    { iterations: 10000 },
  );

  bench(
    "set batch (15, all changed)",
    () => {
      tick += 1;
      controller.set(tick % 2 ? batchA : batchB);
    },
    { iterations: 10000 },
  );

  bench(
    "set batch (50, all changed)",
    () => {
      tick += 1;
      controller.set(tick % 2 ? batch50A : batch50B);
    },
    { iterations: 10000 },
  );
});

describe("DataController get", () => {
  const controller = makeController();

  bench(
    "get hot",
    () => {
      controller.get(shallow);
    },
    { iterations: 10000 },
  );
});
