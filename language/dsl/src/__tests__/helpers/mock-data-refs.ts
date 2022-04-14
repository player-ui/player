import type { Language, Schema } from '@player-ui/types';

export const FooTypeRef: Language.DataTypeRef = {
  type: 'FooType',
};

export const BarTypeRef: Language.DataTypeRef = {
  type: 'BarType',
};

export const LocalBazType: Schema.DataType = {
  type: 'BazType',
  default: false,
  validation: [
    {
      type: 'someValidation',
      message: 'some message',
      options: ['1', '2'],
    },
  ],
};
