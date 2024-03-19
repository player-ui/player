import type { Schema } from '@player-ui/types';

export const BooleanType: Schema.DataType<boolean> = {
  type: 'BooleanType',
  default: false,
  validation: [
    {
      type: 'oneOf',
      message: 'Value must be true or false',
      options: [true, false],
    },
  ],
};

export const IntegerType: Schema.DataType<number> = {
  type: 'IntegerType',
  validation: [
    {
      type: 'integer',
    },
  ],
  format: {
    type: 'integer',
  },
};

export const IntegerPosType: Schema.DataType<number> = {
  type: 'IntegerPosType',
  validation: [
    {
      type: 'integer',
    },
    {
      type: 'min',
      value: 1,
    },
  ],
  format: {
    type: 'integer',
  },
};

export const IntegerNNType: Schema.DataType<number> = {
  type: 'IntegerNNType',
  validation: [
    {
      type: 'integer',
    },
    {
      type: 'min',
      value: 0,
    },
  ],
  format: {
    type: 'integer',
  },
};

export const StringType: Schema.DataType<string> = {
  type: 'StringType',
  default: '',
  validation: [
    {
      type: 'string',
    },
  ],
  format: {
    type: 'string',
  },
};

export const CollectionType: Schema.DataType<Array<unknown>> = {
  type: 'CollectionType',
  validation: [
    {
      type: 'collection',
    },
  ],
};

export const DateType: Schema.DataType<string> = {
  type: 'DateType',
  validation: [
    {
      type: 'string',
    },
  ],
  format: {
    type: 'date',
  },
};

export const PhoneType: Schema.DataType<string> = {
  type: 'PhoneType',
  validation: [
    {
      type: 'phone',
    },
  ],
  format: {
    type: 'phone',
  },
};
