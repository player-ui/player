import { it, expect, vitest } from 'vitest';
import { FlowController } from '..';

it('ends when the flow does', async () => {
  const controller = new FlowController({
    BEGIN: 'foo',
    foo: {
      startState: 'View1',
      View1: {
        state_type: 'VIEW',
        ref: 'foo',
        transitions: {
          '*': 'End',
        },
      },
      End: {
        state_type: 'END',
        outcome: 'yay',
      },
    },
  });
  const controllerResult = controller.start();
  controller.transition('foo');
  const { outcome } = await controllerResult;
  expect(outcome).toBe('yay');
});

it('calls another flow', async () => {
  const controller = new FlowController({
    BEGIN: 'foo',
    foo: {
      startState: 'View1',
      View1: {
        state_type: 'VIEW',
        ref: 'foo',
        transitions: {
          'foo-1': 'Flow2',
        },
      },
      Flow2: {
        state_type: 'FLOW',
        ref: 'bar',
        transitions: {
          yay: 'End',
        },
      },
      End: {
        state_type: 'END',
        outcome: 'yay',
      },
    },
    bar: {
      startState: 'View2',
      View2: {
        state_type: 'VIEW',
        ref: 'bar',
        transitions: {
          'foo-2': 'Done',
        },
      },
      Done: {
        state_type: 'END',
        outcome: 'yay',
      },
    },
  });

  const controllerResult = controller.start();
  expect(controller.current?.id).toBe('foo');
  controller.transition('foo-1');
  expect(controller.current?.id).toBe('bar');
  controller.transition('foo-2');

  const { outcome } = await controllerResult;
  expect(outcome).toBe('yay');
  expect(controller.current?.id).toBe('foo');
});

it('can switch between parent and sub flow', async () => {
  const controller = new FlowController({
    BEGIN: 'Flow-1',
    'Flow-1': {
      startState: 'Initial',
      END_Back: {
        outcome: 'backBeforeTopic',
        state_type: 'END',
      },
      'Go-To-Flow-2': {
        state_type: 'FLOW',
        ref: 'Flow-2',
        transitions: {
          '*': 'Initial',
        },
      },
      Initial: {
        ref: 'Initial-View',
        state_type: 'VIEW',
        transitions: {
          Prev: 'END_Back',
          '*': 'Go-To-Flow-2',
        },
        nodeName: 'Initial',
        fromAction: null,
      },
    },
    'Flow-2': {
      startState: 'Result',
      END_Done: {
        state_type: 'END',
        outcome: 'Done',
      },
      Result: {
        ref: 'Result-View',
        state_type: 'VIEW',
        transitions: {
          '*': 'END_Done',
        },
      },
    },
  });

  controller.start();
  expect(controller.current?.id).toBe('Flow-1');
  controller.transition('Next');
  expect(controller.current?.id).toBe('Flow-2');
  controller.transition('Back');

  // Wait for all pending promises (in this case, the sub-flow promise) to complete.
  await vitest.waitFor(() => expect(controller.current?.id).toBe('Flow-1'));

  controller.transition('Next');
  expect(controller.current?.id).toBe('Flow-2');
  expect(controller.current?.currentState?.name).toBe('Result');
});

it('fails if BEGIN doesnt point to a flow', async () => {
  const controller = new FlowController({
    BEGIN: 'foo',
  } as any);

  await expect(controller.start()).rejects.toThrowError(
    'No flow defined for: foo',
  );
});

it('fails if state isnt an object', async () => {
  const controller = new FlowController({
    BEGIN: 'foo',
    foo: 'bar',
  } as any);
  await expect(controller.start()).rejects.toThrowError(
    'Flow: foo needs to be an object',
  );
});

it('fails if no BEGIN state', async () => {
  const controller = new FlowController({} as any);
  await expect(controller.start()).rejects.toThrowError(
    'Must supply a BEGIN state',
  );
});

it('fails if flow not started', async () => {
  const controller = new FlowController({} as any);
  expect(controller.transition).toThrowError(
    'Not currently in a flow. Cannot transition.',
  );
});

it('does not set current to undefined after run resolves with the last flow', async () => {
  const controller = new FlowController({
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        ref: 'view-1',
        state_type: 'VIEW',
        transitions: {
          '*': 'End',
        },
      },
      End: {
        state_type: 'END',
        outcome: 'done',
      },
    },
  } as any);
  const p = controller.start();
  controller.transition('Next');

  await p;

  expect(controller.current).toBeDefined();
  expect(controller.current?.currentState?.value.outcome).toBe('done');
});
