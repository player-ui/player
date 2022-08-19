/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { Flags } from '@oclif/core';
import glob from 'globby';
import path from 'path';
import { promises as fs } from 'fs';
import mkdirp from 'mkdirp';
import logSymbols from 'log-symbols';
import figures from 'figures';
import chalk from 'chalk';
import type { SerializeType } from '@player-ui/dsl';
import { BaseCommand } from '../../utils/base-command';
import { convertToFileGlob, normalizePath } from '../../utils/fs';
import type { CompletedTask } from '../../utils/task-runner';
import { registerForPaths } from '../../utils/babel-register';
// import Validate from '../json/validate';

/** A command to compile player DSL content into JSON */
export default class DSLCompile extends BaseCommand {
  static description = 'Compile Player DSL files into JSON';

  static flags = {
    ...BaseCommand.flags,
    input: Flags.string({
      char: 'i',
      description:
        'An input directory to compile.\nAny jsx/ts/tsx files will be loaded via babel-require automatically.',
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output directory to write results to.',
    }),
    'skip-validation': Flags.boolean({
      description: 'Option to skip validating the generated JSON',
    }),
  };

  private async getOptions() {
    const { flags } = await this.parse(DSLCompile);
    const config = await this.getPlayerConfig();

    const input = flags.input ?? config.dsl?.src;

    if (!input) {
      throw new Error(`Input files are required for DSL compilation`);
    }

    return {
      input,
      output: flags.output ?? config.dsl?.outDir ?? '_out',
      skipValidation:
        flags['skip-validation'] ?? config.dsl?.skipValidation ?? false,
    };
  }

  async run(): Promise<{
    /** the status code */
    exitCode: number;
  }> {
    const { input, output, skipValidation } = await this.getOptions();

    const files = await glob(
      convertToFileGlob([input], '**/*.(tsx|jsx|js|ts)'),
      {
        expandDirectories: true,
      }
    );

    registerForPaths();

    this.debug('Found %i files to process', files.length);

    const results = {
      exitCode: 0,
    };

    /** Compile a file from the DSL format into JSON */
    const compileFile = async (file: string) => {
      const compiler = await this.createDSLCompiler();
      const requiredModule = require(path.resolve(file));
      const defaultExport = requiredModule.default;

      if (!defaultExport) {
        return;
      }

      let relativePath = path.relative(input, file);
      if (!relativePath) {
        relativePath = path.basename(file);
      }

      const outputFile = path.join(
        output,
        path.format({
          ...path.parse(relativePath),
          base: undefined,
          ext: '.json',
        })
      );

      this.log(
        `${logSymbols.info} Compiling %s ${figures.arrowRight} %s`,
        normalizePath(file),
        normalizePath(outputFile)
      );

      const { value, contentType, sourceMap } = await compiler.serialize(
        defaultExport
      );

      const contentStr = JSON.stringify(value, null, 2);

      await mkdirp(path.dirname(outputFile));
      await fs.writeFile(outputFile, contentStr);

      if (sourceMap) {
        await fs.writeFile(`${outputFile}.map`, sourceMap);
      }

      return {
        contentType,
        outputFile,
        inputFile: file,
      };
    };

    const compilerResults: Array<
      Omit<
        CompletedTask<
          {
            /** What type of file is generated */
            contentType: SerializeType;
            /** The output path */
            outputFile: string;
            /** the input file */
            inputFile: string;
          },
          any
        >,
        'run'
      >
    > = [];

    // This has to be done serially b/c of the way React logs messages to console.error
    // Otherwise the errors in console will be randomly interspersed between update messages
    for (let fIndex = 0; fIndex < files.length; fIndex += 1) {
      const file = files[fIndex];
      try {
        const result = await compileFile(file);
        compilerResults.push({
          output: result,
          state: 'completed',
        });
      } catch (e: any) {
        results.exitCode = 100;
        console.log('');
        console.log(
          chalk.red(`${logSymbols.error} Error compiling ${file}: ${e.message}`)
        );
        this.debug(e);
        compilerResults.push({
          state: 'completed',
          error: e,
        });
      }
    }

    // if (!skipValidation) {
    //   console.log('');
    //   const hasOutput = compilerResults.some(
    //     (r) => r.output?.contentType === 'flow'
    //   );
    //   if (hasOutput) {
    //     await Validate.run([
    //       '-f',
    //       ...compilerResults
    //         .filter((r) => r.output?.contentType === 'flow')
    //         .map((result) => {
    //           return result.output?.outputFile ?? '';
    //         }),
    //     ]);
    //   } else {
    //     console.log('No output to validate');
    //   }
    // }

    this.exit(results.exitCode);
    return results;
  }
}
