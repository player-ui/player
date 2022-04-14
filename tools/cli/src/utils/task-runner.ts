import logUpdate from 'log-update';

/* eslint-disable no-param-reassign */
interface BaseTask<Results, Data> {
  /** The state of the task */
  state: 'idle' | 'pending';

  /** A function to run */
  run: () => Promise<Results>;

  /** other metadata about the task */
  data?: Data;
}

export type CompletedTask<Results, Data> = Omit<
  BaseTask<Results, Data>,
  'state'
> & {
  /** The state of the task */
  state: 'completed';
} & (
    | {
        /** The results */
        output: Results;

        /** An error if any */
        error?: never;
      }
    | {
        /** The error if any */
        error: Error;

        /** No output on error */
        output?: never;
      }
  );

export type Task<ResultsType, Data> =
  | BaseTask<ResultsType, Data>
  | CompletedTask<ResultsType, Data>;

export interface TaskProgressRenderer<ResultType, Data = unknown> {
  /** Call back to paint update on the page */
  onUpdate: (ctx: {
    /** The tasks that are running */
    tasks: Array<Task<ResultType, Data>>;
  }) => string;

  /** Called for a summary */
  onEnd: (ctx: {
    /** The completed tasks */
    tasks: Array<CompletedTask<ResultType, Data>>;

    /** Number of ms it took to run */
    duration: number;
  }) => string;
}

interface TaskRunner<R, Data> {
  /** The list of tasks */
  tasks: Array<Task<R, Data>>;

  /** A trigger to start it */
  run: () => Promise<Array<CompletedTask<R, Data>>>;
}

/** Create a runner to kick off tasks in parallel */
export const createTaskRunner = <R, D>({
  tasks,
  renderer,
}: {
  /** A list of tasks to run */
  tasks: Array<Pick<BaseTask<R, D>, 'data' | 'run'>>;

  /** How to report progress */
  renderer: TaskProgressRenderer<R, D>;
}): TaskRunner<R, D> => {
  const statefulTasks: Array<Task<R, D>> = tasks.map((t) => {
    return {
      ...t,
      state: 'idle',
    };
  });

  /** Kick off the task list */
  const run = async () => {
    const startTime = Date.now();

    let ended = false;

    const paintInterval = setInterval(() => {
      if (ended) {
        return;
      }

      const output = renderer.onUpdate({ tasks: statefulTasks });
      if (process.stdout.isTTY) {
        logUpdate(output);
      }
    }, 10);

    await Promise.all(
      statefulTasks.map(async (t) => {
        t.state = 'pending';
        try {
          const r = await t.run();
          t.state = 'completed';
          (t as CompletedTask<R, D>).output = r;
        } catch (e: unknown) {
          if (e instanceof Error) {
            t.state = 'completed';
            (t as CompletedTask<R, D>).error = e;
          }
        }
      })
    );
    ended = true;
    clearInterval(paintInterval);

    const duration = Date.now() - startTime;

    const output = renderer.onEnd({
      duration,
      tasks: statefulTasks as Array<CompletedTask<R, D>>,
    });

    console.log(output);
    logUpdate.done();

    return statefulTasks as Array<CompletedTask<R, D>>;
  };

  return {
    tasks: statefulTasks,
    run,
  };
};
