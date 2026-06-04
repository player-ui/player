import { bench, describe } from "vitest";
import { BindingInstance } from "../../binding";
import { LocalModel } from "../local-model";

/** A deep + wide model that mirrors a realistic form's data shape */
const buildModel = () => ({
  user: {
    id: "u1",
    name: "Ada",
    profile: {
      age: 30,
      address: { street: "1 Main", city: "Anytown", zip: "00000" },
    },
    pets: Array.from({ length: 30 }, (_, i) => ({
      id: i,
      name: `pet-${i}`,
      type: i % 2 ? "dog" : "cat",
    })),
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

const fixture = buildModel();

const shallow = new BindingInstance("user.name");
const deep = new BindingInstance("user.profile.address.zip");
const arrayIndex = new BindingInstance("user.pets.12.name");
const newKey = new BindingInstance("user.profile.nickname");
const arrayItem = new BindingInstance("user.pets.5");
const fieldKey = new BindingInstance("form.fields.field20");

// timm keeps `fixture` pristine on set, so reusing it per-iteration is stable.
const batch: Array<[BindingInstance, any]> = Array.from({ length: 15 }, (_, i) => [
  new BindingInstance(`form.fields.field${i}.value`),
  i + 100,
]);

describe("LocalModel get", () => {
  const model = new LocalModel(fixture);

  bench("get shallow", () => {
    model.get(shallow);
  }, { iterations: 10000 });

  bench("get deep", () => {
    model.get(deep);
  }, { iterations: 10000 });

  bench("get array index", () => {
    model.get(arrayIndex);
  }, { iterations: 10000 });
});

describe("LocalModel set", () => {
  bench("set existing shallow", () => {
    new LocalModel(fixture).set([[shallow, "Grace"]]);
  }, { iterations: 10000 });

  bench("set deep", () => {
    new LocalModel(fixture).set([[deep, "11111"]]);
  }, { iterations: 10000 });

  bench("set new key", () => {
    new LocalModel(fixture).set([[newKey, "Ace"]]);
  }, { iterations: 10000 });

  bench("set batch (15)", () => {
    new LocalModel(fixture).set(batch);
  }, { iterations: 10000 });
});

describe("LocalModel delete", () => {
  bench("delete object key", () => {
    new LocalModel(fixture).delete(fieldKey);
  }, { iterations: 10000 });

  bench("delete array index", () => {
    new LocalModel(fixture).delete(arrayItem);
  }, { iterations: 10000 });
});
