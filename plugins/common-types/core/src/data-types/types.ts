import type { Schema } from "@player-ui/player";
import {
  BooleanTypeRef,
  CollectionTypeRef,
  DateTypeRef,
  IntegerPosTypeRef,
  IntegerTypeRef,
  PhoneTypeRef,
  StringTypeRef,
  IntegerNNTypeRef,
} from "./refs";

export const BooleanType: Schema.DataType<boolean> = {
  ...BooleanTypeRef,
  default: false,
  validation: [
    {
      type: "oneOf",
      message: "Value must be true or false",
      options: [true, false],
    },
  ],
};

export const IntegerType: Schema.DataType<number> = {
  ...IntegerTypeRef,
  validation: [
    {
      type: "integer",
    },
  ],
  format: {
    type: "integer",
  },
};

export const IntegerPosType: Schema.DataType<number> = {
  ...IntegerPosTypeRef,
  validation: [
    {
      type: "integer",
    },
    {
      type: "min",
      value: 1,
    },
  ],
  format: {
    type: "integer",
  },
};

export const IntegerNNType: Schema.DataType<number> = {
  ...IntegerNNTypeRef,
  validation: [
    {
      type: "integer",
    },
    {
      type: "min",
      value: 0,
    },
  ],
  format: {
    type: "integer",
  },
};

export const StringType: Schema.DataType<string> = {
  ...StringTypeRef,
  default: "",
  validation: [
    {
      type: "string",
    },
  ],
  format: {
    type: "string",
  },
};

export const CollectionType: Schema.DataType<Array<unknown>> = {
  ...CollectionTypeRef,
  validation: [
    {
      type: "collection",
    },
  ],
};

export const DateType: Schema.DataType<string> = {
  ...DateTypeRef,
  validation: [
    {
      type: "string",
    },
  ],
  format: {
    type: "date",
  },
};

export const PhoneType: Schema.DataType<string> = {
  ...PhoneTypeRef,
  validation: [
    {
      type: "phone",
    },
  ],
  format: {
    type: "phone",
  },
};
