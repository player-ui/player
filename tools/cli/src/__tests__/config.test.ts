/**
 * @jest-environment node
 */
import path from 'path';
import { BaseCommand } from '../utils/base-command';

test('resolves config correctly', async () => {
  jest.setTimeout(10000);

  const configCallback = jest.fn();

  class ConfigLoader extends BaseCommand {
    async run() {
      configCallback(await this.getPlayerConfig());
    }
  }

  jest.mock(
    '@test-extension',
    () => {
      return {
        dsl: {
          src: 'test-src',
          outDir: 'output-directory',
        },
      };
    },
    { virtual: true }
  );

  jest.mock(
    '@test-preset-1',
    () => {
      return {
        presets: ['@test-preset-2'],
        plugins: ['@test-plugin-2'],
      };
    },
    { virtual: true }
  );

  jest.mock(
    '@test-preset-2',
    () => {
      return {
        plugins: ['@test-plugin-3'],
      };
    },
    { virtual: true }
  );

  jest.mock(
    '@test-plugin-1',
    () => {
      return {
        name: 'test-plugin-1',
      };
    },
    { virtual: true }
  );

  jest.mock(
    '@test-plugin-2',
    () => {
      return {
        name: 'test-plugin-2',
      };
    },
    { virtual: true }
  );

  jest.mock(
    '@test-plugin-3',
    () => {
      return {
        name: 'test-plugin-3',
      };
    },
    { virtual: true }
  );

  await ConfigLoader.run([`-c`, `${path.join(__dirname, 'config.test.json')}`]);

  expect(configCallback).toBeCalledWith({
    dsl: {
      src: 'test-src',
      outDir: 'output-directory',
    },
    plugins: [
      {
        name: 'test-plugin-3',
      },
      {
        name: 'test-plugin-2',
      },
      {
        name: 'test-plugin-1',
      },
    ],
  });
});
