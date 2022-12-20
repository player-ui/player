import type {
  ExpressionHandler,
  ExpressionNode,
  NodeLocation,
  NodePosition,
} from './types';

/** Generates a function by removing the first context argument */
export function withoutContext<T extends unknown[], Return>(
  fn: (...args: T) => Return
): ExpressionHandler<T, Return> {
  return (_context, ...args) => fn(...args);
}

/** Checks if the location includes the target position  */
function isInRange(position: NodePosition, location: NodeLocation) {
  return (
    position.character >= location.start.character &&
    position.character <= location.end.character
  );
}

/** Get the node in the expression that's closest to the desired position */
export function findClosestNodeAtPosition(
  node: ExpressionNode,
  position: NodePosition
): ExpressionNode | undefined {
  // This is just mapping recursively over nodes in the tree

  // eslint-disable-next-line default-case
  switch (node.type) {
    case 'Modification':
    case 'Assignment':
    case 'LogicalExpression':
    case 'BinaryExpression': {
      const check =
        findClosestNodeAtPosition(node.left, position) ??
        findClosestNodeAtPosition(node.right, position);
      if (check) {
        return check;
      }

      break;
    }

    case 'UnaryExpression': {
      const checkArg = findClosestNodeAtPosition(node.argument, position);
      if (checkArg) {
        return checkArg;
      }

      break;
    }

    case 'MemberExpression': {
      const checkObject =
        findClosestNodeAtPosition(node.object, position) ??
        findClosestNodeAtPosition(node.property, position);
      if (checkObject) {
        return checkObject;
      }

      break;
    }

    case 'ConditionalExpression': {
      const checkObject =
        findClosestNodeAtPosition(node.test, position) ??
        findClosestNodeAtPosition(node.consequent, position) ??
        findClosestNodeAtPosition(node.alternate, position);
      if (checkObject) {
        return checkObject;
      }

      break;
    }

    case 'ArrayExpression':
    case 'Compound': {
      const elements =
        node.type === 'ArrayExpression' ? node.elements : node.body;

      const anyElements = elements.find((e) =>
        findClosestNodeAtPosition(e, position)
      );

      if (anyElements) {
        return anyElements;
      }

      break;
    }

    case 'Object': {
      const checkObject = node.attributes.reduce<ExpressionNode | undefined>(
        (found, next) => {
          return (
            found ??
            findClosestNodeAtPosition(next.key, position) ??
            findClosestNodeAtPosition(next.value, position)
          );
        },
        undefined
      );

      if (checkObject) {
        return checkObject;
      }

      break;
    }

    case 'CallExpression': {
      const anyArgs =
        node.args.find((arg) => {
          return findClosestNodeAtPosition(arg, position);
        }) ?? findClosestNodeAtPosition(node.callTarget, position);

      if (anyArgs) {
        return anyArgs;
      }

      break;
    }
  }

  // Lastly check for yourself
  if (node.location && isInRange(position, node.location)) {
    return node;
  }
}
