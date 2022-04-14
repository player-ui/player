import type { Diagnostic, Range } from 'vscode-languageserver-types';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import elegantSpinner from 'elegant-spinner';
import type { Task, TaskProgressRenderer } from './task-runner';
import { normalizePath } from './fs';

/** Compare the ranges and return the one that starts of finishes first */
function rangeComparator(first: Range, second: Range): number {
  if (first.start.line < second.start.line) {
    return -1;
  }

  if (first.start.line > second.start.line) {
    return 1;
  }

  if (first.start.character < second.start.character) {
    return -1;
  }

  if (first.start.character > second.start.character) {
    return 1;
  }

  return 0;
}

/** Sort a list of digs by position */
const sortDiagnostics = (validations: Diagnostic[]) => {
  // Sort the validations by line/char number
  return validations.sort((a, b) => {
    return rangeComparator(a.range, b.range);
  });
};

/** Get the text representing the line range */
function getLineRange(range: Range): string {
  return `${range.start.line + 1}:${range.start.character + 1}`;
}

/** Fix the plurality of a word */
function maybePlural(word: string, count: number) {
  return count > 1 ? `${word}s` : word;
}

/** Get the lines representing the summary of the results */
export function getSummary({
  errors,
  warnings,
  skipped,
  fileCount,
  duration,
}: {
  /** Error count */
  errors: number;

  /** Warning count */
  warnings: number;

  /** number of skipped files */
  skipped?: number;

  /** File Count */
  fileCount: number;

  /** How long this took */
  duration: number | undefined;
}) {
  return [
    '\n',
    (errors > 0 || warnings === 0) &&
      chalk.red(`${errors} ${maybePlural('error', errors)}`),
    warnings > 0 &&
      chalk.yellow(`${warnings} ${maybePlural('warning', warnings)}`),
    skipped !== undefined &&
      skipped > 0 &&
      chalk.gray(`${skipped} ${maybePlural('skipped', skipped)}`),

    chalk.gray(`in ${fileCount} ${maybePlural('file', fileCount)}`),

    chalk.gray(`took ${duration}ms`),
  ]
    .filter(Boolean)
    .join(' ');
}

/** Format a diag for printing on the console */
function formatDiagnostic(
  diag: Diagnostic,
  longestLine: number,
  fName: string
): string {
  const type =
    diag.severity === DiagnosticSeverity.Error
      ? chalk.red(`${logSymbols.error}  `)
      : chalk.yellow(`${logSymbols.warning}  `);
  const msg = chalk.bold(diag.message);
  const range = getLineRange(diag.range);

  return [
    `${type}`,
    range.padEnd(longestLine),
    msg,
    `${fName}:${range.padEnd(longestLine)}`,
  ].join(' ');
}

/** Format the results for printing on the console */
export function formatDiagnosticResults(
  filePath: string,
  results: Diagnostic[],
  verbose = false
) {
  const count = {
    errors: 0,
    warnings: 0,
  };
  const linePrefix = '  ';
  const longestLine = Math.max(
    ...results.map((r) => getLineRange(r.range).length)
  );

  let lines: string[] = results
    .map((diag) => {
      if (diag.severity === DiagnosticSeverity.Error) {
        count.errors += 1;
      } else if (diag.severity === DiagnosticSeverity.Warning) {
        count.warnings += 1;
      }

      if (diag.severity === DiagnosticSeverity.Error || verbose) {
        return linePrefix + formatDiagnostic(diag, longestLine + 1, filePath);
      }

      return '';
    })
    .filter((line) => line !== '');

  if (count.errors > 0) {
    lines = ['', `${chalk.red(logSymbols.error)} ${filePath}`, ...lines, ''];
  } else if (verbose) {
    if (count.warnings > 0) {
      lines = [
        '',
        `${chalk.yellow(logSymbols.warning)} ${filePath}`,
        ...lines,
        '',
      ];
    } else {
      lines = [`${chalk.green(logSymbols.success)} ${filePath}`, ...lines];
    }
  }

  return {
    ...count,
    lines,
  };
}

const spinnerState = new WeakMap<
  Task<any, any>,
  ReturnType<typeof elegantSpinner>
>();

/** Get the symbol for a given task */
export const getTaskSymbol = (task: Task<any, any>) => {
  if (task.state === 'pending' || task.state === 'idle') {
    const spinner = spinnerState.get(task) ?? elegantSpinner();
    spinnerState.set(task, spinner);
    return chalk.yellow(spinner());
  }

  if (task.state === 'completed' && task.error) {
    return logSymbols.error;
  }

  if (task.state === 'completed') {
    return chalk.yellow(logSymbols.success);
  }

  return ' ';
};

export const validationRenderer: TaskProgressRenderer<
  Diagnostic[],
  {
    /** the file name */
    file: string;
  }
> = {
  onUpdate(ctx) {
    const { tasks } = ctx;
    const output: string[] = ['Validating content'];

    tasks.forEach((task) => {
      if (task.state === 'completed' && task.output) {
        const formattedDiags = formatDiagnosticResults(
          task.data?.file ? normalizePath(task.data.file) : '',
          sortDiagnostics(task.output),
          true
        );

        output.push(...formattedDiags.lines);
      } else {
        output.push(
          `${getTaskSymbol(task)} ${
            task.data?.file ? normalizePath(task.data.file) : ''
          }`
        );
      }
    });

    return output.join('\n');
  },

  onEnd(ctx) {
    const count = {
      errors: 0,
      warnings: 0,
      skipped: 0,
      fileCount: ctx.tasks.length,
      duration: ctx.duration,
    };

    ctx.tasks.forEach((t) => {
      if (t.state === 'completed' && t.output) {
        const formattedDiags = formatDiagnosticResults(
          t.data?.file ?? '',
          t.output,
          true
        );

        count.errors += formattedDiags.errors;
        count.warnings += formattedDiags.warnings;
      }
    });

    return [validationRenderer.onUpdate(ctx), getSummary(count)].join('\n');
  },
};
