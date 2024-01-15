import { SyncWaterfallHook } from "tapable-ts";
import type { Node, ParseObjectOptions, Parser } from "../parser";
import { NodeType } from "../parser";
import type { ViewPlugin } from ".";
import type { Options } from "./options";
import type { Resolver } from "../resolver";
import { ViewInstance } from "../view";

export interface TemplateItemInfo {
  /** The index of the data for the current iteration of the template */
  index: number;
  /** The data for the current iteration of the template */
  data: any;
  /** The depth of the template node */
  depth: number;
}

export interface TemplateSubstitution {
  /** Regular expression to find and replace. The global flag will be always be added to this expression. */
  expression: string | RegExp;
  /** The value to replace matches with. */
  value: string;
}

export type TemplateSubstitutionsFunc = (
  baseSubstitutions: TemplateSubstitution[],
  templateItemInfo: TemplateItemInfo,
) => TemplateSubstitution[];

/** A view plugin to resolve/manage templates */
export default class TemplatePlugin implements ViewPlugin {
  private readonly options: Options;

  hooks = {
    resolveTemplateSubstitutions: new SyncWaterfallHook<
      [TemplateSubstitution[], TemplateItemInfo]
    >(),
  };

  constructor(options: Options) {
    this.options = options;
  }

  private parseTemplate(
    parseObject: any,
    node: Node.Template,
    options: Options,
  ): Node.Node | null {
    const { template, depth } = node;
    const data = options.data.model.get(node.data);

    if (!data) {
      return null;
    }

    if (!Array.isArray(data)) {
      throw new Error(`Template using '${node.data}' but is not an array`);
    }

    const values: Array<Node.Node> = [];

    data.forEach((dataItem, index) => {
      const templateSubstitutions =
        this.hooks.resolveTemplateSubstitutions.call(
          [
            {
              expression: new RegExp(`_index${depth || ""}_`),
              value: String(index),
            },
          ],
          {
            depth,
            data: dataItem,
            index,
          },
        );
      let templateStr = JSON.stringify(template);

      for (const { expression, value } of templateSubstitutions) {
        let flags = "g";
        if (typeof expression === "object") {
          flags = `${expression.flags}${expression.global ? "" : "g"}`;
        }

        templateStr = templateStr.replace(new RegExp(expression, flags), value);
      }

      const parsed = parseObject(JSON.parse(templateStr), NodeType.Value, {
        templateDepth: node.depth + 1,
      });

      if (parsed) {
        values.push(parsed);
      }
    });

    const result: Node.MultiNode = {
      type: NodeType.MultiNode,
      override: false,
      values,
    };

    return result;
  }

  applyParser(parser: Parser) {
    parser.hooks.onCreateASTNode.tap("template", (node) => {
      if (node && node.type === NodeType.Template && !node.dynamic) {
        return this.parseTemplate(
          parser.parseObject.bind(parser),
          node,
          this.options,
        );
      }

      return node;
    });

    parser.hooks.determineNodeType.tap("template", (obj: any) => {
      if (obj === "template") {
        return NodeType.Template;
      }
    });

    parser.hooks.parseNode.tap(
      "template",
      (
        obj: any,
        _nodeType: Node.ChildrenTypes,
        options: ParseObjectOptions,
        determinedNodeType: null | NodeType,
      ) => {
        if (determinedNodeType === NodeType.Template) {
          const templateNode = parser.createASTNode(
            {
              type: NodeType.Template,
              depth: options.templateDepth ?? 0,
              data: obj.data,
              template: obj.value,
              dynamic: obj.dynamic ?? false,
            },
            obj,
          );

          if (templateNode) {
            return templateNode;
          }
        }
      },
    );
  }

  applyResolverHooks(resolver: Resolver) {
    resolver.hooks.beforeResolve.tap("template", (node, options) => {
      if (node && node.type === NodeType.Template && node.dynamic) {
        return this.parseTemplate(options.parseNode, node, options);
      }

      return node;
    });
  }

  apply(view: ViewInstance) {
    view.hooks.parser.tap("template", this.applyParser.bind(this));
    view.hooks.resolver.tap("template", this.applyResolverHooks.bind(this));
  }
}
