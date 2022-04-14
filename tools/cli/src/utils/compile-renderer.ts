import chalk from 'chalk';
import figureSet from 'figures';
import type { SerializeType } from '@player-ui/dsl';
import type { TaskProgressRenderer } from './task-runner';
import { getTaskSymbol } from './diag-renderer';

export interface DSLCompileFileData {
  /** the file name */
  file: string;

  /** the name of the output file */
  outputFile?: string;
}

export const compileRenderer: TaskProgressRenderer<
  | {
      /** the type of content generated */
      contentType: SerializeType;
    }
  | undefined,
  DSLCompileFileData
> = {
  onUpdate: (ctx) => {
    const output: string[] = [''];

    ctx.tasks.forEach((task) => {
      const outputType =
        task.state === 'completed' && task.output?.contentType
          ? task.output.contentType
          : undefined;

      let titleLine = [
        getTaskSymbol(task),
        outputType && `(${outputType})`,
        task.data?.file,
      ]
        .filter(Boolean)
        .join(' ');

      if (task.data?.outputFile) {
        titleLine = [
          titleLine,
          figureSet.arrowRight,
          task.data.outputFile,
        ].join(' ');
      }

      output.push(titleLine);

      if (task.state === 'completed') {
        if (task.error) {
          output.push(`  ${figureSet.arrowRight} ${chalk.red('bad')}`);
        }
      }
    });

    return output.join('\n');
  },
  onEnd: (ctx) => {
    return [compileRenderer.onUpdate(ctx)].join('\n');
  },
};
