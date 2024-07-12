import { test, expect } from "vitest";
import { ConstantsController } from "..";

test("basic get/set functionality", () => {
  const controller = new ConstantsController();

  // Basic get/set tests
  const data = {
    firstname: "john",
    lastname: "doe",
    favorite: {
      color: "red",
    },
  };
  controller.addConstants(data, "constants");

  const firstname = controller.getConstants("firstname", "constants");
  const middleName = controller.getConstants("middlename", "constants");
  const middleNameSafe = controller.getConstants(
    "middlename",
    "constants",
    "A",
  );
  const favoriteColor = controller.getConstants("favorite.color", "constants");
  const nonExistantNamespace = controller.getConstants("test", "foo");
  const nonExistantNamespaceWithFallback = controller.getConstants(
    "test",
    "foo",
    "bar",
  );

  expect(firstname).toStrictEqual(data.firstname);
  expect(middleName).toBe(undefined);
  expect(middleNameSafe).toStrictEqual("A");
  expect(favoriteColor).toStrictEqual(data.favorite.color);
  expect(favoriteColor).toStrictEqual(data.favorite.color);
  expect(nonExistantNamespace).toBe(undefined);
  expect(nonExistantNamespaceWithFallback).toBe("bar");

  // Test and make sure keys override properly
  const newData = {
    favorite: {
      color: "blue",
    },
  };

  controller.addConstants(newData, "constants");
  const newFavoriteColor = controller.getConstants(
    "favorite.color",
    "constants",
  );
  expect(newFavoriteColor).toStrictEqual(newData.favorite.color);
});

test("temp override functionality", () => {
  const controller = new ConstantsController();

  // Basic Temp tests
  const data = {
    firstname: "john",
    lastname: "doe",
    favorite: {
      color: "red",
    },
  };

  const temp = {
    middlename: "A",
    favorite: {
      color: "green",
    },
  };
  controller.addConstants(data, "constants");
  controller.setTemporaryValues(temp, "constants");

  const tempMiddleName = controller.getConstants("middlename", "constants");
  const tempFavoriteColor = controller.getConstants(
    "favorite.color",
    "constants",
  );

  expect(tempMiddleName).toStrictEqual(temp.middlename);
  expect(tempFavoriteColor).toStrictEqual(temp.favorite.color);

  // Test overriding temp with new temp
  const newTemp = {
    favorite: {
      color: "orange",
    },
  };
  controller.setTemporaryValues(newTemp, "constants");
  const newtempFavoriteColor = controller.getConstants(
    "favorite.color",
    "constants",
  );
  expect(newtempFavoriteColor).toStrictEqual(newTemp.favorite.color);

  // Reset temp and values should be the same as the original data
  controller.clearTemporaryValues();

  const middleName = controller.getConstants("middlename", "constants");
  const favoriteColor = controller.getConstants("favorite.color", "constants");

  expect(middleName).toBe(undefined);
  expect(favoriteColor).toStrictEqual(data.favorite.color);
});
