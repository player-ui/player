import { Player, PlayerPlugin } from '@player-ui/player';
import { ProfilerNode } from '@player-tools/devtools-common';

// Try to use performance.now() but fall back to Date.now() if you can't
const getTime: () => number =
  typeof performance === 'undefined'
    ? () => Date.now()
    : () => performance.now();

// TODO: Not sure this deserves to be it's own plugin
/**
 * Profiler plugin that tracks hook resolution times for web player instance
 */
export class ProfilerPlugin implements PlayerPlugin {
  name = 'profiler';

  private player?: WeakRef<Player>;

  private rootNode: ProfilerNode = {
    name: 'root',
    children: [],
  };

  private record: { [key: string]: number[] } = {};

  private tapped = false;

  /**
   * add newNode to its parent's children array
   */
  addNodeToTree = (newNode: ProfilerNode, parentNode: ProfilerNode) => {
    parentNode.children.push(newNode);
    return newNode;
  };

  /**
   * start timer and save start time in the record
   */
  startTimer = (hookName: string, record: { [key: string]: number[] }) => {
    /**
     * TODO: use context to pass start times
     * once tapable supports ts types for context property
     */
    const startTime = getTime();
    if (!record[hookName] || record[hookName].length === 2) {
      record[hookName] = [];
      record[hookName].push(startTime);
    }
  };

  /**
   * end timer and calculate duration
   */
  endTimer = (
    hookName: string,
    record: { [key: string]: number[] },
    parentNode: ProfilerNode,
    children?: ProfilerNode[]
  ) => {
    let startTime;
    let duration;
    const endTime = getTime();
    for (const key in record) {
      if (key === hookName && record[key].length === 1) {
        [startTime] = record[key];
        duration = endTime - startTime;
        record[key].push(endTime);
      }
    }

    const newNode: ProfilerNode = {
      name: hookName,
      startTime,
      endTime,
      value: duration === 0 ? 0.01 : duration,
      tooltip: `${hookName}, ${duration?.toFixed(4)} (ms)`,
      children: children ?? [],
    };

    this.addNodeToTree(newNode, parentNode);

    return newNode;
  };

  start = () => {
    // reset root node if profilers are already tapped
    if (this.tapped) {
      this.rootNode = { name: 'root', children: [] };
    } else {
      this.tapPlayerHooks();
    }

    this.rootNode.startTime = getTime();

    return {
      data: this.rootNode,
    };
  };

  stop = () => {
    /**
     * TODO: untap from the hooks once this repo is migrated to use tapable-ts
     * that supports untapping
     */
    this.rootNode.endTime = getTime();
    if (this.rootNode.startTime) {
      const duration = this.rootNode.endTime - this.rootNode.startTime;
      this.rootNode.value = duration / 1000;
      this.rootNode.tooltip = `${this.rootNode.name}, ${duration.toFixed(
        4
      )} (ms)`;
    }

    return {
      data: this.rootNode,
    };
  };

  private tapPlayerHooks = () => {
    const player = this.player?.deref();

    if (!player) return;

    this.tapped = !this.tapped;

    player.hooks.onStart.intercept({
      call: () => {
        this.startTimer('onStart', this.record);
      },
    });

    player.hooks.onStart.tap(this.name, () => {
      this.endTimer('onStart', this.record, this.rootNode);
    });

    player.hooks.flowController.intercept({
      call: (fc) => {
        this.startTimer('flowController', this.record);
        fc.hooks.flow.intercept({
          call: () => {
            this.startTimer('flow', this.record);
          },
        });
      },
    });

    player.hooks.flowController.tap(this.name, (fc) => {
      let flowControllerNode: ProfilerNode = {
        name: 'flowController',
        children: [],
      };

      fc.hooks.flow.tap(this.name, () => {
        this.endTimer('flow', this.record, flowControllerNode);
      });

      flowControllerNode = this.endTimer(
        flowControllerNode.name,
        this.record,
        this.rootNode,
        flowControllerNode.children
      );
    });

    player.hooks.viewController.intercept({
      call: (vc) => {
        this.startTimer('viewController', this.record);
        vc.hooks.resolveView.intercept({
          call: () => {
            this.startTimer('resolveView', this.record);
          },
        });
        vc.hooks.view.intercept({
          call: () => {
            this.startTimer('view', this.record);
          },
        });
      },
    });

    player.hooks.viewController.tap(this.name, (vc) => {
      let viewControllerNode: ProfilerNode = {
        name: 'viewController',
        children: [],
      };

      vc.hooks.resolveView.tap(this.name, (asset) => {
        this.endTimer('resolveView', this.record, viewControllerNode);
        return asset;
      });

      viewControllerNode = this.endTimer(
        viewControllerNode.name,
        this.record,
        this.rootNode,
        viewControllerNode.children
      );
    });

    player.hooks.view.intercept({
      call: (view) => {
        this.startTimer('view', this.record);

        view.hooks.onUpdate.intercept({
          call: () => {
            this.startTimer('onUpdate', this.record);
          },
        });

        view.hooks.parser.intercept({
          call: () => {
            this.startTimer('parser', this.record);
          },
        });

        view.hooks.resolver.intercept({
          call: () => {
            this.startTimer('resolver', this.record);
          },
        });

        view.hooks.templatePlugin.intercept({
          call: () => {
            this.startTimer('templatePlugin', this.record);
          },
        });
      },
    });

    player.hooks.view.tap(this.name, (view) => {
      let viewNode: ProfilerNode = {
        name: 'view',
        children: [],
      };

      view.hooks.onUpdate.tap(this.name, () => {
        this.endTimer('onUpdate', this.record, viewNode);
      });

      view.hooks.parser.tap(this.name, () => {
        this.endTimer('parser', this.record, viewNode);
      });

      view.hooks.resolver.tap(this.name, () => {
        this.endTimer('resolver', this.record, viewNode);
      });

      view.hooks.templatePlugin.tap(this.name, () => {
        this.endTimer('templatePlugin', this.record, viewNode);
      });

      viewNode = this.endTimer(
        viewNode.name,
        this.record,
        this.rootNode,
        viewNode.children
      );
    });

    player.hooks.expressionEvaluator.intercept({
      call: (ev) => {
        this.startTimer('expressionEvaluator', this.record);

        ev.hooks.resolve.intercept({
          call: () => {
            this.startTimer('resolve', this.record);
          },
        });

        ev.hooks.onError.intercept({
          call: () => {
            this.startTimer('onError', this.record);
          },
        });
      },
    });

    player.hooks.expressionEvaluator.tap(this.name, (ev) => {
      let expressionEvaluatorNode: ProfilerNode = {
        name: 'expressionEvaluator',
        children: [],
      };

      ev.hooks.resolve.tap(this.name, () => {
        this.endTimer('resolve', this.record, expressionEvaluatorNode);
      });

      ev.hooks.onError.tap(this.name, () => {
        this.endTimer('onError', this.record, expressionEvaluatorNode);
        return undefined;
      });

      expressionEvaluatorNode = this.endTimer(
        expressionEvaluatorNode.name,
        this.record,
        this.rootNode,
        expressionEvaluatorNode.children
      );
    });

    player.hooks.dataController.intercept({
      call: (dc) => {
        this.startTimer('dataController', this.record);

        dc.hooks.resolve.intercept({
          call: () => {
            this.startTimer('resolve', this.record);
          },
        });
        dc.hooks.resolveDataStages.intercept({
          call: () => {
            this.startTimer('resolveDataStages', this.record);
          },
        });
        dc.hooks.resolveDefaultValue.intercept({
          call: () => {
            this.startTimer('resolveDefaultValue', this.record);
          },
        });
        dc.hooks.onDelete.intercept({
          call: () => {
            this.startTimer('onDelete', this.record);
          },
        });
        dc.hooks.onSet.intercept({
          call: () => {
            this.startTimer('onSet', this.record);
          },
        });
        dc.hooks.onGet.intercept({
          call: () => {
            this.startTimer('onGet', this.record);
          },
        });
        dc.hooks.onUpdate.intercept({
          call: () => {
            this.startTimer('onUpdate', this.record);
          },
        });
        dc.hooks.format.intercept({
          call: () => {
            this.startTimer('resolve', this.record);
          },
        });
        dc.hooks.deformat.intercept({
          call: () => {
            this.startTimer('deformat', this.record);
          },
        });
        dc.hooks.serialize.intercept({
          call: () => {
            this.startTimer('serialize', this.record);
          },
        });
      },
    });

    player.hooks.dataController.tap(this.name, (dc) => {
      let dataControllerNode: ProfilerNode = {
        name: 'dataController',
        children: [],
      };

      dc.hooks.resolve.tap(this.name, () => {
        this.endTimer('resolve', this.record, dataControllerNode);
      });

      dc.hooks.resolveDataStages.tap(this.name, (dataPipeline) => {
        this.endTimer('resolveDataStages', this.record, dataControllerNode);
        return dataPipeline;
      });

      dc.hooks.resolveDefaultValue.tap(this.name, () => {
        this.endTimer('resolveDefaultValue', this.record, dataControllerNode);
      });

      dc.hooks.onDelete.tap(this.name, () => {
        this.endTimer('onDelete', this.record, dataControllerNode);
      });

      dc.hooks.onSet.tap(this.name, () => {
        this.endTimer('onSet', this.record, dataControllerNode);
      });

      dc.hooks.onGet.tap(this.name, () => {
        this.endTimer('onGet', this.record, dataControllerNode);
      });

      dc.hooks.onUpdate.tap(this.name, () => {
        this.endTimer('onUpdate', this.record, dataControllerNode);
      });

      dc.hooks.format.tap(this.name, () => {
        this.endTimer('format', this.record, dataControllerNode);
      });

      dc.hooks.deformat.tap(this.name, () => {
        this.endTimer('deformat', this.record, dataControllerNode);
      });

      dc.hooks.serialize.tap(this.name, () => {
        this.endTimer('serialize', this.record, dataControllerNode);
      });

      dataControllerNode = this.endTimer(
        dataControllerNode.name,
        this.record,
        this.rootNode,
        dataControllerNode.children
      );
    });

    player.hooks.schema.intercept({
      call: (sc) => {
        this.startTimer('schema', this.record);
        sc.hooks.resolveTypeForBinding.intercept({
          call: () => {
            this.startTimer('resolveTypeForBinding', this.record);
          },
        });
      },
    });

    player.hooks.schema.tap(this.name, (sc) => {
      let schemaNode: ProfilerNode = {
        name: 'schema',
        children: [],
      };

      sc.hooks.resolveTypeForBinding.tap(this.name, (dataType) => {
        this.endTimer('resolveTypeForBinding', this.record, schemaNode);
        return dataType;
      });

      schemaNode = this.endTimer(
        schemaNode.name,
        this.record,
        this.rootNode,
        schemaNode.children
      );
    });

    player.hooks.validationController.intercept({
      call: (vc) => {
        this.startTimer('validationController', this.record);

        vc.hooks.createValidatorRegistry.intercept({
          call: () => {
            this.startTimer('createValidatorRegistry', this.record);
          },
        });
        vc.hooks.onAddValidation.intercept({
          call: () => {
            this.startTimer('onAddValidation', this.record);
          },
        });
        vc.hooks.onRemoveValidation.intercept({
          call: () => {
            this.startTimer('onRemoveValidation', this.record);
          },
        });
      },
    });

    player.hooks.validationController.tap(this.name, (vc) => {
      let validationControllerNode: ProfilerNode = {
        name: 'validationController',
        children: [],
      };

      vc.hooks.createValidatorRegistry.tap(this.name, () => {
        this.endTimer(
          'createValidatorRegistry',
          this.record,
          validationControllerNode
        );
      });

      vc.hooks.onAddValidation.tap(this.name, (validationResponse) => {
        this.endTimer('onAddValidation', this.record, validationControllerNode);
        return validationResponse;
      });

      vc.hooks.onRemoveValidation.tap(this.name, (validationResponse) => {
        this.endTimer(
          'onRemoveValidation',
          this.record,
          validationControllerNode
        );
        return validationResponse;
      });

      validationControllerNode = this.endTimer(
        validationControllerNode.name,
        this.record,
        this.rootNode,
        validationControllerNode.children
      );
    });

    player.hooks.bindingParser.intercept({
      call: (bp) => {
        this.startTimer('bindingParser', this.record);
        bp.hooks.skipOptimization.intercept({
          call: () => {
            this.startTimer('skipOptimization', this.record);
          },
        });
        bp.hooks.beforeResolveNode.intercept({
          call: () => {
            this.startTimer('beforeResolveNode', this.record);
          },
        });
      },
    });

    player.hooks.bindingParser.tap(this.name, (bp) => {
      let bindingParserNode: ProfilerNode = {
        name: 'bindingParser',
        children: [],
      };

      bp.hooks.skipOptimization.tap(this.name, () => {
        this.endTimer('skipOptimization', this.record, bindingParserNode);
        return undefined;
      });
      bp.hooks.beforeResolveNode.tap(this.name, (node) => {
        this.endTimer('beforeResolveNode', this.record, bindingParserNode);
        return node;
      });

      bindingParserNode = this.endTimer(
        bindingParserNode.name,
        this.record,
        this.rootNode,
        bindingParserNode.children
      );
    });

    player.hooks.state.intercept({
      call: () => {
        this.startTimer('state', this.record);
      },
    });

    player.hooks.state.tap(this.name, () => {
      this.endTimer('state', this.record, this.rootNode);
    });

    player.hooks.onEnd.intercept({
      call: () => {
        this.startTimer('onEnd', this.record);
      },
    });

    player.hooks.onEnd.tap(this.name, () => {
      this.endTimer('onEnd', this.record, this.rootNode);
    });

    player.hooks.resolveFlowContent.intercept({
      call: () => {
        this.startTimer('resolveFlowContent', this.record);
      },
    });

    player.hooks.resolveFlowContent.tap(this.name, (flow) => {
      this.endTimer('resolveFlowContent', this.record, this.rootNode);
      return flow;
    });
  };

  apply(player: Player) {
    // TODO: Web player paradigm allowed for the plugin to work for multiple players -- this doesn't
    this.player = new WeakRef(player);

    // TODO: This shouldn't really happen, but to allow the hooks to be freshly tapped :P
    setTimeout(this.start, 200);
  }
}
