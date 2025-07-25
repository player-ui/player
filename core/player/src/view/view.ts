import { SyncHook } from "tapable-ts";
import type { View as ViewType } from "@player-ui/types";
import type { BindingInstance, BindingFactory } from "../binding";
import type { ValidationProvider, ValidationObject } from "../validator";
import type { Logger } from "../logger";
import type { Resolve } from "./resolver";
import { Resolver } from "./resolver";
import type { Node } from "./parser";
import { Parser } from "./parser";
import { TemplatePlugin } from "./plugins";

/**
 * Manages the view level validations
 */
class CrossfieldProvider implements ValidationProvider {
  private allValidations = new Set<ValidationObject>();
  private byBinding = new Map<BindingInstance, Array<ValidationObject>>();
  private logger?: Logger;

  constructor(initialView: ViewType, parser: BindingFactory, logger?: Logger) {
    this.logger = logger;
    this.parse(initialView, parser);
  }

  private parse(contentView: ViewType, parser: BindingFactory) {
    const xfieldRefs = contentView.validation;

    if (xfieldRefs === undefined) {
      return;
    }

    if (!Array.isArray(xfieldRefs)) {
      this.logger?.warn(
        `Unable to register view validations for id: ${contentView.id}. 'validation' property must be an Array.`,
      );

      return;
    }

    // Grab the validations from the view (as authored) and parse out the ones that have a _ref_ (to a binding)
    // Group them all by binding to make it easier to return than later

    xfieldRefs.forEach((vRef) => {
      // x-field validations by default are triggered by navigating away from the page
      // the reference can also override that _or_ the severity
      const withDefaults: ValidationObject = {
        trigger: "navigation",
        severity: "error",
        ...vRef,
      };

      this.allValidations.add(withDefaults);

      // The validation reference contains a _ref_ (a binding)
      const { ref } = vRef;

      if (ref) {
        /** Group together validations by binding */
        const parsed = parser(ref);

        if (this.byBinding.has(parsed)) {
          this.byBinding.get(parsed)?.push(withDefaults);
        } else {
          this.byBinding.set(parsed, [withDefaults]);
        }
      }
    });
  }

  getValidationsForBinding(binding: BindingInstance) {
    return this.byBinding.get(binding);
  }
}

export type ViewHooks = {
  /** Hook every time there is an update to this view instance */
  onUpdate: SyncHook<[ViewType]>;
  /** Hook to retrieve the parser used for this view */
  parser: SyncHook<[Parser]>;
  /** Hook to retrieve the resolver used for this view */
  resolver: SyncHook<[Resolver]>;
  /** Hook to retrieve the template plugin used for this view */
  templatePlugin: SyncHook<[TemplatePlugin]>;
};

/** A stateful view instance from an content */
export class ViewInstance implements ValidationProvider {
  public hooks: ViewHooks = {
    onUpdate: new SyncHook(),
    parser: new SyncHook(),
    resolver: new SyncHook(),
    templatePlugin: new SyncHook(),
  };

  private resolver?: Resolver;
  public readonly initialView: ViewType;
  public readonly resolverOptions: Resolve.ResolverOptions;
  private rootNode?: Node.Node;

  private validationProvider?: CrossfieldProvider;

  private templatePlugin: TemplatePlugin | undefined;

  // TODO might want to add a version/timestamp to this to compare updates
  public lastUpdate: Record<string, any> | undefined;

  constructor(initialView: ViewType, resolverOptions: Resolve.ResolverOptions) {
    this.initialView = initialView;
    this.resolverOptions = resolverOptions;
  }

  public updateAsync(): void {
    const update = this.resolver?.update();
    this.lastUpdate = update;
    this.hooks.onUpdate.call(update);
  }

  public update(changes?: Set<BindingInstance>): any {
    if (this.rootNode === undefined) {
      /** On initialization of the view, also create a validation parser */
      this.validationProvider = new CrossfieldProvider(
        this.initialView,
        this.resolverOptions.parseBinding,
        this.resolverOptions.logger,
      );

      if (this.templatePlugin) {
        this.hooks.templatePlugin.call(this.templatePlugin);
      } else {
        this.resolverOptions.logger?.warn(
          "templatePlugin not set for View, legacy templates may not work",
        );
      }

      const parser = new Parser();
      this.hooks.parser.call(parser);
      this.rootNode = parser.parseView(this.initialView);

      this.resolver = new Resolver(this.rootNode, {
        ...this.resolverOptions,
        parseNode: parser.parseObject.bind(parser),
      });
      this.hooks.resolver.call(this.resolver);
    }

    const update = this.resolver?.update(changes);

    if (this.lastUpdate === update) {
      return this.lastUpdate;
    }

    this.lastUpdate = update;
    this.hooks.onUpdate.call(update);

    return update;
  }

  getValidationsForBinding(
    binding: BindingInstance,
  ): Array<ValidationObject> | undefined {
    return this.validationProvider?.getValidationsForBinding(binding);
  }

  public setTemplatePlugin(plugin: TemplatePlugin): void {
    this.templatePlugin = plugin;
  }
}

/** A plugin for a view */
export interface ViewPlugin {
  /** Called with a view instance */
  apply(view: ViewInstance): void;
}
