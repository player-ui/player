// import type { Node, ParseObjectOptions, Parser } from '../parser';
// import { NodeType, getNodeID } from '../parser';
// import type { ViewPlugin, View } from './plugin';
// import type { Resolver } from '../resolver';
// import { AsyncParallelBailHook } from 'tapable-ts';
// import { omit } from 'timm';
// import { ViewInstance } from '../view';

// export default class AsyncNodePluginPlugin implements ViewPlugin {
//     public readonly hooks = {
//         onAsyncNode: new AsyncParallelBailHook<[Node.Node], Node.Node>(),
//     };

//     name = 'AsyncNode';

//     private resolvedMapping = new Map<string, Node.Node>();

//     private currentView: ViewInstance | undefined

//     private isAsync(node: Node.Node | null): node is Node.Async {
//         return node?.type === NodeType.Async;
//     }

//     applyParser(parser: Parser) {
//         parser.hooks.determineNodeType.tap(this.name, (obj) => {
//             if (Object.prototype.hasOwnProperty.call(obj, 'async')) {
//               return NodeType.Async;
//             }
//         });
//         parser.hooks.parseNode.tap(
//             this.name,
//             (
//               obj: any,
//               nodeType: Node.ChildrenTypes,
//               options: ParseObjectOptions,
//               determinedNodeType: null | NodeType
//             ) => {
//               if (determinedNodeType === NodeType.Async) {
//                 const parsedAsync = parser.parseObject(
//                   omit(obj, 'async'),
//                   nodeType,
//                   options
//                 );
//                 const parsedNodeId = getNodeID(parsedAsync);
//                 if (parsedAsync !== null && parsedNodeId) {
//                   return parser.createASTNode(
//                     {
//                       id: parsedNodeId,
//                       type: NodeType.Async,
//                       value: parsedAsync,
//                     },
//                     obj
//                   );
//                 }

//                 return null;
//               }
//             }
//         ); 
//     }

//     applyResolverHooks(resolver: Resolver) {
//         resolver.hooks.beforeResolve.tap(this.name, (node, options) => {
//             let resolvedNode;
//             if (this.isAsync(node)) {
//               const mappedValue = this.resolvedMapping.get(node.id);
//               if (mappedValue) {
//                 resolvedNode = mappedValue;
//               }
//             } else {
//               resolvedNode = null;
//             }

//             const newNode = resolvedNode || node;
//             if (!resolvedNode && node?.type === NodeType.Async) {
//               queueMicrotask(async () => {
//                 const result = await this.hooks.onAsyncNode.call(node);
//                 const parsedNode = options.parseNode
//                   ? options.parseNode(result)
//                   : undefined;

//                 if (parsedNode) {
//                   this.resolvedMapping.set(node.id, parsedNode);
//                   this.currentView?.updateAsync();
//                 }
//               });

//               return node;
//             }

//             return newNode;
//         });
//     }


//     apply(view: View): void {
//         this.currentView = view as unknown as ViewInstance
//         view.hooks.parser.tap('template', this.applyParser.bind(this));
//         view.hooks.resolver.tap('template', this.applyResolverHooks.bind(this));
//     }
  
//   }