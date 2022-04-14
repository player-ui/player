/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import { Command, Flags } from '@oclif/core';
import path from 'path';
import { cosmiconfig } from 'cosmiconfig';
// import { PlayerLanguageService } from '@player-ui/language-service';
import { DSLCompiler } from '@player-ui/dsl';
import type {
  PlayerConfigFileShape,
  PlayerConfigResolvedShape,
} from '../config';

const configLoader = cosmiconfig('player');

/** The common configs for all  */
export abstract class BaseCommand extends Command {
  static flags = {
    config: Flags.string({
      description:
        'Path to a specific config file to load.\nBy default, will automatically search for an rc or config file to load',
      char: 'c',
    }),
  };

  private resolvedConfig: PlayerConfigResolvedShape | undefined;

  private async loadConfig(configFilePath?: string) {
    if (configFilePath) {
      try {
        return await configLoader.load(configFilePath);
      } catch (e: unknown) {
        this.warn(`Error loading config file: ${configFilePath}`);
      }
    }

    return configLoader.search();
  }

  private async resolveConfig(
    conf?: PlayerConfigFileShape,
    relativePath?: string
  ): Promise<PlayerConfigResolvedShape> {
    let config: PlayerConfigResolvedShape = {
      ...(conf ?? {}),
      plugins: [],
    };

    // If there's an extension load it

    if (conf?.extends) {
      let normalizedExtension: PlayerConfigFileShape;

      if (typeof conf.extends === 'string') {
        const requiredExtendedConfig = require(conf.extends);
        normalizedExtension =
          requiredExtendedConfig.default ?? requiredExtendedConfig;
      } else {
        normalizedExtension = conf.extends;
      }

      config = {
        ...(await this.resolveConfig(normalizedExtension, relativePath)),
      };
    }

    await Promise.all(
      conf?.presets?.map(async (preset) => {
        if (typeof preset === 'string') {
          const requiredExtendedConfig = require(preset);
          const normalizedExtension =
            requiredExtendedConfig.default ?? requiredExtendedConfig;

          const extendedConfig = await this.resolveConfig(normalizedExtension);

          config.plugins = [...extendedConfig.plugins, ...config.plugins];

          return;
        }

        const presetConfig = await this.resolveConfig(preset);
        config.plugins = [...presetConfig.plugins, ...config.plugins];
      }) ?? []
    );

    // Go through each plugin and load/create it

    conf?.plugins?.forEach((pluginInfo) => {
      if (typeof pluginInfo === 'object' && !Array.isArray(pluginInfo)) {
        config.plugins.push(pluginInfo);
        return;
      }

      const pluginName =
        typeof pluginInfo === 'string' ? pluginInfo : pluginInfo[0];
      const pluginArgs =
        typeof pluginInfo === 'string' ? undefined : pluginInfo[1];

      let pluginLoadPath = pluginName;

      if (pluginName.startsWith('.')) {
        pluginLoadPath = path.resolve(relativePath ?? '', pluginName);
      }

      this.debug('loading plugin from %s', pluginLoadPath);
      // Get the instance for the plugin
      const required = require(pluginLoadPath);

      const PluginExport = required.default ?? required;

      if (!PluginExport) {
        return;
      }

      const pluginInstance =
        typeof PluginExport === 'object'
          ? PluginExport
          : new PluginExport(pluginArgs);
      config.plugins.push(pluginInstance);
    });

    return config;
  }

  private async readConfig(): Promise<PlayerConfigResolvedShape> {
    const { flags } = await this.parse();
    const configFile = await this.loadConfig(flags.config);
    return this.resolveConfig(configFile?.config);
  }

  protected async getPlayerConfig(): Promise<PlayerConfigResolvedShape> {
    if (this.resolvedConfig) {
      return this.resolvedConfig;
    }

    const c = await this.readConfig();
    this.resolvedConfig = c;
    return c;
  }

  // async createLanguageService(): Promise<PlayerLanguageService> {
  //   const lsp = new PlayerLanguageService();
  //   const { plugins } = await this.getPlayerConfig();

  //   for (let i = 0; i < plugins.length; i++) {
  //     // eslint-disable-next-line no-await-in-loop
  //     await plugins[i].onCreateLanguageService?.(lsp);
  //   }

  //   return lsp;
  // }

  async createDSLCompiler(): Promise<DSLCompiler> {
    const compiler = new DSLCompiler();
    const { plugins } = await this.getPlayerConfig();
    for (let i = 0; i < plugins.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await plugins[i].onCreateDSLCompiler?.(compiler);
    }

    return compiler;
  }

  exit(code?: number): void {
    if (process.env.NODE_ENV !== 'test') {
      super.exit(code);
    }
  }
}
