import { TapableLogger } from '..';
import type { Logger } from '../types';
import { severities } from '../types';

test('works via logger api', () => {
  const logger = new TapableLogger();

  const testLogger: Logger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  logger.addHandler(testLogger);

  severities.forEach((s) => {
    logger[s](s);
  });

  severities.forEach((s) => {
    expect(testLogger[s]).toBeCalledTimes(1);
    expect(testLogger[s]).toBeCalledWith(s);
  });

  severities.forEach((s) => {
    (testLogger[s] as jest.Mock<any, any>).mockClear();
  });

  logger.removeHandler(testLogger);

  severities.forEach((s) => {
    logger[s](s);
  });

  severities.forEach((s) => {
    expect(testLogger[s]).toBeCalledTimes(0);
  });
});
