import { BindingParser } from '../../binding';
import type { DataModelMiddleware } from '..';
import { LocalModel, PipelinedDataModel } from '..';
import type { BatchSetTransaction } from '../model';

const { parse } = new BindingParser({
  get: () => undefined,
  set: () => undefined,
  evaluate: () => undefined,
});

describe('model', () => {
  let localModel: LocalModel;
  let model: PipelinedDataModel;

  beforeEach(() => {
    localModel = new LocalModel();

    const middleware: DataModelMiddleware = {
      get(binding, options, next) {
        return next?.get(binding, options);
      },
      set(transaction, options, next) {
        const newTransaction: BatchSetTransaction = [];
        transaction.forEach(([binding, val]) => {
          if (val !== 'bad') {
            newTransaction.push([binding, val]);
          }
        });
        next?.set(newTransaction, options);
      },
    };

    model = new PipelinedDataModel();
    model.addMiddleware(localModel);
    model.addMiddleware(middleware);
  });

  it('works with basic middleware', () => {
    model.set([
      [parse('foo.bar'), 'bad'],
      [parse('foo.baz'), 'good'],
    ]);

    expect(localModel.get(parse('foo.bar'))).toBe(undefined);
    expect(localModel.get(parse('foo.baz'))).toBe('good');
  });
});
