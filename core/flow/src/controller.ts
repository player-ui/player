import type { Logger } from '@player-ui/logger';
import { SyncHook } from 'tapable-ts';
import type { Navigation, NavigationFlowEndState } from '@player-ui/types';
import type { NamedState, TransitionOptions } from './flow';
import { FlowInstance } from './flow';

/** A manager for the navigation section of a Content blob */
export class FlowController {
  public readonly hooks = {
    flow: new SyncHook<[FlowInstance]>(),
  };

  private readonly log?: Logger;
  private navigation: Navigation;
  private navStack: FlowInstance[];
  public current?: FlowInstance;

  constructor(
    navigation: Navigation,
    options?: {
      /** A logger instance to use */
      logger?: Logger;
    }
  ) {
    this.navigation = navigation;
    this.navStack = [];
    this.log = options?.logger;

    this.start = this.start.bind(this);
    this.run = this.run.bind(this);
    this.transition = this.transition.bind(this);
  }

  /** Navigate to another state in the state-machine */
  public transition(stateTransition: string, options?: TransitionOptions) {
    if (this.current === undefined) {
      throw new Error('Not currently in a flow. Cannot transition.');
    }

    this.current.transition(stateTransition, options);
  }

  private async addNewFlow(flow: FlowInstance) {
    this.navStack.push(flow);
    this.current = flow;
    flow.hooks.transition.tap(
      'flow-controller',
      async (_oldState, newState: NamedState) => {
        if (newState.value.state_type === 'FLOW') {
          this.log?.debug(`Got FLOW state. Loading flow ${newState.value.ref}`);
          const endState = await this.run(newState.value.ref);
          this.log?.debug(`Flow ended. Using outcome: ${endState.outcome}`);
          flow.transition(endState.outcome);
        }
      }
    );
    this.hooks.flow.call(flow);
  }

  private async run(startState: string): Promise<NavigationFlowEndState> {
    if (!Object.prototype.hasOwnProperty.call(this.navigation, startState)) {
      return Promise.reject(new Error(`No flow defined for: ${startState}`));
    }

    const startFlow = this.navigation[startState];

    if (startFlow === null || typeof startFlow !== 'object') {
      return Promise.reject(
        new Error(`Flow: ${startState} needs to be an object`)
      );
    }

    this.log?.debug(`Starting flow: ${startState}`);

    const flow = new FlowInstance(startState, startFlow, { logger: this.log });
    this.addNewFlow(flow);
    const end = await flow.start();
    this.navStack.pop();

    if (this.navStack.length > 0) {
      const firstItem = 0;
      this.current = this.navStack[firstItem];
    }

    return end;
  }

  public async start(): Promise<NavigationFlowEndState> {
    if (!this.navigation.BEGIN) {
      return Promise.reject(new Error('Must supply a BEGIN state'));
    }

    return this.run(this.navigation.BEGIN);
  }
}
