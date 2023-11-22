import { describe, test, expect } from "vitest";
import { BindingParser } from "../../binding";
import { SchemaController } from "..";

const { parse } = new BindingParser({
  get: () => undefined,
  set: () => undefined,
  evaluate: () => undefined,
});

describe("schema", () => {
  const schema = new SchemaController({
    ROOT: {
      pets: {
        type: "PetType",
        isArray: true,
      },
      owner: {
        type: "OwnerType",
      },
      animals: {
        type: "AnimalType",
        isRecord: true,
      },
      automobile: {
        type: "carType",
        isArray: true,
      },
    },
    PetType: {
      breed: {
        type: "StringType",
      },
      name: {
        type: "StringType",
        validation: [
          {
            type: "required",
          },
        ],
      },
      age: {
        type: "IntegerType",
        validation: [
          {
            type: "required",
          },
        ],
      },
    },
    OwnerType: {
      name: {
        type: "FirstNameType",
        validation: [
          {
            type: "enum",
            options: ["adam"],
          },
        ],
      },
    },
    AnimalType: {
      age: {
        type: "IntegerType",
        validation: [
          {
            type: "required",
          },
        ],
      },
      type: {
        type: "StringType",
      },
      name: {
        type: "StringType",
        validation: [
          {
            type: "length",
            min: 1,
            max: 10,
          },
        ],
      },
      colors: {
        type: "colorType",
        isArray: true,
      },
    },
    carType: {
      year: {
        type: "IntegerType",
      },
      car: {
        type: "makeType",
        isRecord: true,
      },
    },
    colorType: {
      color: {
        type: "StringType",
      },
    },
    makeType: {
      makeInteger: {
        type: "IntegerType",
        validation: [
          {
            type: "required",
          },
        ],
      },
      model: {
        type: "modelType",
        isArray: true,
      },
    },
    modelType: {
      color: {
        type: "StringType",
      },
      body: {
        type: "StringType",
        validation: [
          {
            type: "required",
          },
        ],
      },
    },
  });

  test("gets basic type info", () => {
    expect(schema.getType(parse("owner.name"))?.type).toBe("FirstNameType");
    expect(schema.getValidationsForBinding(parse("owner.name"))).toStrictEqual([
      {
        type: "enum",
        options: ["adam"],
        trigger: "change",
        severity: "error",
      },
    ]);
  });

  test("gets the type for objects in an array", () => {
    expect(schema.getType(parse("pets.4.name"))?.type).toBe("StringType");
    expect(
      schema.getValidationsForBinding(parse("pets.999.name")),
    ).toStrictEqual([
      {
        type: "required",
        trigger: "change",
        severity: "error",
      },
    ]);
  });

  test("gets the type for an array parent", () => {
    expect(schema.getType(parse("pets"))).toStrictEqual({
      type: "PetType",
      isArray: true,
    });
  });

  test("gets the type for an record parent", () => {
    expect(schema.getType(parse("animals"))).toStrictEqual({
      type: "AnimalType",
      isRecord: true,
    });
  });

  test("gets the type for objects in a record", () => {
    expect(schema.getType(parse("animals.cat.age"))?.type).toBe("IntegerType");
    expect(
      schema.getValidationsForBinding(parse("animals.cat.age")),
    ).toStrictEqual([
      {
        type: "required",
        trigger: "change",
        severity: "error",
      },
    ]);
  });

  test("gets the type for objects in a record in an array", () => {
    expect(schema.getType(parse("animals.cat.colors.0.color"))?.type).toBe(
      "StringType",
    );
  });

  test("gets the type for objects in a record with validation", () => {
    expect(schema.getType(parse("animals.ginger.name"))?.type).toBe(
      "StringType",
    );
    expect(
      schema.getValidationsForBinding(parse("animals.ginger.name")),
    ).toStrictEqual([
      {
        type: "length",
        min: 1,
        max: 10,
        trigger: "change",
        severity: "error",
      },
    ]);
  });

  test("gets the schema type for an array of objects in an object. and an array in an object of arrays", () => {
    expect(schema.getType(parse("automobile.0.year"))?.type).toBe(
      "IntegerType",
    );
    expect(
      schema.getType(parse("automobile.0.car.honda.makeInteger"))?.type,
    ).toBe("IntegerType");
    expect(
      schema.getValidationsForBinding(
        parse("automobile.0.car.honda.makeInteger"),
      ),
    ).toStrictEqual([
      {
        type: "required",
        trigger: "change",
        severity: "error",
      },
    ]);
    expect(
      schema.getType(parse("automobile.0.car.honda.model.0.color"))?.type,
    ).toBe("StringType");
    expect(
      schema.getType(parse("automobile.0.car.honda.model.0.body"))?.type,
    ).toBe("StringType");
    expect(
      schema.getValidationsForBinding(
        parse("automobile.0.car.honda.model.0.body"),
      ),
    ).toStrictEqual([
      {
        type: "required",
        trigger: "change",
        severity: "error",
      },
    ]);
  });
});
