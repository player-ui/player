import { bench, describe } from "vitest";
import { BindingInstance } from "../../binding";
import { SchemaController } from "..";

const schema = new SchemaController({
  ROOT: {
    pets: { type: "PetType", isArray: true },
    owner: { type: "OwnerType" },
    animals: { type: "AnimalType", isRecord: true },
    automobile: { type: "carType", isArray: true },
  },
  PetType: {
    breed: { type: "StringType" },
    name: { type: "StringType", validation: [{ type: "required" }] },
    age: { type: "IntegerType", validation: [{ type: "required" }] },
  },
  OwnerType: {
    name: {
      type: "FirstNameType",
      validation: [{ type: "enum", options: ["adam"] }],
    },
  },
  AnimalType: {
    age: { type: "IntegerType", validation: [{ type: "required" }] },
    type: { type: "StringType" },
    colors: { type: "colorType", isArray: true },
  },
  carType: {
    year: { type: "IntegerType" },
    car: { type: "makeType", isRecord: true },
  },
  colorType: {
    color: { type: "StringType" },
  },
  makeType: {
    makeInteger: { type: "IntegerType", validation: [{ type: "required" }] },
    model: { type: "modelType", isArray: true },
  },
  modelType: {
    color: { type: "StringType" },
    body: { type: "StringType", validation: [{ type: "required" }] },
  },
});

// Register base types so getApparentType performs its merge of the base
// definition with the schema-level type (validation concat + spread).
schema.addDataTypes([
  { type: "StringType", validation: [{ type: "string" }] },
  { type: "IntegerType", validation: [{ type: "integer" }] },
  { type: "FirstNameType", validation: [{ type: "string" }] },
] as any);

const deepBinding = new BindingInstance("automobile.0.car.honda.model.0.body");

// Fresh instances each iteration deliberately bypass the per-binding
// normalize cache, exposing the cost of normalizeBinding itself.
describe("SchemaController getType (uncached binding)", () => {
  bench("shallow binding", () => {
    schema.getType(new BindingInstance("owner.name"));
  }, { iterations: 10000 });

  bench("deep binding (array+record, 6 segments)", () => {
    schema.getType(new BindingInstance("automobile.0.car.honda.model.0.body"));
  }, { iterations: 10000 });
});

// Reused instance: normalize is cached after the first call, isolating the
// per-call merged-object rebuild that getApparentType does today.
describe("SchemaController getApparentType (cached binding)", () => {
  bench("repeat same binding", () => {
    schema.getApparentType(deepBinding);
  }, { iterations: 10000 });
});
