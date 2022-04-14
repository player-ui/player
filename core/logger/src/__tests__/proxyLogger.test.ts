import type { Logger } from '../types';
import ProxyLogger from '../proxyLogger';

test('proxyLogger works with no logger', () => {
  const proxyLogger = new ProxyLogger(() => undefined);
  expect(() => proxyLogger.info('foo')).not.toThrow();
});

test('calls real logger when set', () => {
  const testLogger: Logger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  let useTestLogger = false;

  const proxyLogger = new ProxyLogger(() =>
    useTestLogger ? testLogger : undefined
  );

  proxyLogger.error('err');
  expect(testLogger.error).toBeCalledTimes(0);

  useTestLogger = true;
  proxyLogger.error('err');
  expect(testLogger.error).toBeCalledTimes(1);
});
