import type { Rule } from 'eslint';

const DEFAULT_MIN_SHARED_KEYS = 3;
const DEFAULT_MIN_OVERLAP_RATIO = 0.7;

interface RuleOptions {
  minSharedKeys?: number;
  minOverlapRatio?: number;
}

interface ParsedOptions {
  minSharedKeys: number;
  minOverlapRatio: number;
}

interface ReturnObject {
  node: Rule.Node;
  keySet: Set<string>;
}

interface FunctionContext {
  returnObjects: ReturnObject[];
}

function parseOptions(option: RuleOptions | undefined): ParsedOptions {
  const minSharedKeys =
    typeof option?.minSharedKeys === 'number' ? option.minSharedKeys : DEFAULT_MIN_SHARED_KEYS;
  const minOverlapRatio =
    typeof option?.minOverlapRatio === 'number'
      ? option.minOverlapRatio
      : DEFAULT_MIN_OVERLAP_RATIO;

  return {
    minSharedKeys: Math.max(1, Math.floor(minSharedKeys)),
    minOverlapRatio: Math.max(0, Math.min(1, minOverlapRatio)),
  };
}

function getNodeKey(node: Rule.Node): string {
  const typedNode = node as Rule.Node & {
    range?: [number, number];
    loc?: { start: { line: number; column: number } };
  };
  if (typedNode.range) {
    return `${typedNode.range[0]}:${typedNode.range[1]}`;
  }
  const line = typedNode.loc?.start.line ?? -1;
  const column = typedNode.loc?.start.column ?? -1;
  return `${line}:${column}`;
}

function getPropertyKeyName(propertyKey: Rule.Node | undefined): string | null {
  if (!propertyKey) return null;
  if (propertyKey.type === 'Identifier') {
    const identifierKey = propertyKey as Rule.Node & { name?: string };
    return identifierKey.name ?? null;
  }
  if (propertyKey.type === 'Literal') {
    const literalKey = propertyKey as Rule.Node & { value?: unknown };
    if (typeof literalKey.value === 'string' || typeof literalKey.value === 'number') {
      return String(literalKey.value);
    }
  }
  return null;
}

function collectObjectKeys(
  objectExpression: Rule.Node,
  keySet: Set<string>,
  parentPath: string | null = null,
): void {
  if (objectExpression.type !== 'ObjectExpression') return;
  const objectNode = objectExpression as Rule.Node & {
    properties?: Rule.Node[];
  };
  const properties = objectNode.properties ?? [];

  for (const property of properties) {
    if (property.type !== 'Property') continue;
    const objectProperty = property as Rule.Node & {
      computed?: boolean;
      key?: Rule.Node;
      value?: Rule.Node;
    };
    if (objectProperty.computed) continue;
    const keyName = getPropertyKeyName(objectProperty.key);
    if (!keyName) continue;

    const keyPath = parentPath ? `${parentPath}.${keyName}` : keyName;
    keySet.add(keyPath);

    if (objectProperty.value?.type === 'ObjectExpression') {
      collectObjectKeys(objectProperty.value, keySet, keyPath);
    }
  }
}

function getObjectKeys(objectExpression: Rule.Node): Set<string> {
  const keySet = new Set<string>();
  collectObjectKeys(objectExpression, keySet);
  return keySet;
}

function countSharedKeys(left: Set<string>, right: Set<string>): number {
  let count = 0;
  for (const key of left) {
    if (right.has(key)) {
      count += 1;
    }
  }
  return count;
}

function calculateOverlapRatio(left: Set<string>, right: Set<string>, sharedCount: number): number {
  const smallest = Math.min(left.size, right.size);
  if (smallest === 0) return 0;
  return sharedCount / smallest;
}

function shouldReportPair(
  left: ReturnObject,
  right: ReturnObject,
  options: ParsedOptions,
): { sharedKeys: number; overlapRatio: number } | null {
  if (left.keySet.size === 0 || right.keySet.size === 0) return null;

  const sharedKeys = countSharedKeys(left.keySet, right.keySet);
  if (sharedKeys === 0) return null;

  const overlapRatio = calculateOverlapRatio(left.keySet, right.keySet, sharedKeys);
  if (sharedKeys >= options.minSharedKeys && overlapRatio >= options.minOverlapRatio) {
    return { sharedKeys, overlapRatio };
  }

  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer constructing shared defaults once when multiple object return statements mostly repeat keys.',
      url: 'https://github.com/jjenzz/sweepit/tree/main/skills/sweepi/rules/no-return-object-repetition.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          minSharedKeys: {
            type: 'integer',
            minimum: 1,
          },
          minOverlapRatio: {
            type: 'number',
            minimum: 0,
            maximum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferSharedDefaults:
        'Multiple object return statements repeat many keys ({{sharedKeys}} shared, {{overlapPercent}}% overlap).',
    },
  },
  create(context: Readonly<Rule.RuleContext>) {
    const options = parseOptions(context.options[0] as RuleOptions | undefined);
    const functionStack: FunctionContext[] = [];
    const reportedNodeKeys = new Set<string>();

    function enterFunction(): void {
      functionStack.push({ returnObjects: [] });
    }

    function exitFunction(): void {
      const functionContext = functionStack.pop();
      if (!functionContext || functionContext.returnObjects.length < 2) return;

      const returnObjects = functionContext.returnObjects;
      for (let leftIndex = 0; leftIndex < returnObjects.length; leftIndex += 1) {
        const left = returnObjects[leftIndex];
        for (let rightIndex = leftIndex + 1; rightIndex < returnObjects.length; rightIndex += 1) {
          const right = returnObjects[rightIndex];
          const pair = shouldReportPair(left, right, options);
          if (!pair) continue;

          const overlapPercent = Math.round(pair.overlapRatio * 100);
          const leftNodeKey = getNodeKey(left.node);
          if (!reportedNodeKeys.has(leftNodeKey)) {
            reportedNodeKeys.add(leftNodeKey);
            context.report({
              node: left.node,
              messageId: 'preferSharedDefaults',
              data: {
                sharedKeys: String(pair.sharedKeys),
                overlapPercent: String(overlapPercent),
              },
            });
          }

          const rightNodeKey = getNodeKey(right.node);
          if (!reportedNodeKeys.has(rightNodeKey)) {
            reportedNodeKeys.add(rightNodeKey);
            context.report({
              node: right.node,
              messageId: 'preferSharedDefaults',
              data: {
                sharedKeys: String(pair.sharedKeys),
                overlapPercent: String(overlapPercent),
              },
            });
          }
        }
      }
    }

    return {
      FunctionDeclaration: enterFunction,
      'FunctionDeclaration:exit': exitFunction,
      FunctionExpression: enterFunction,
      'FunctionExpression:exit': exitFunction,
      ArrowFunctionExpression: enterFunction,
      'ArrowFunctionExpression:exit': exitFunction,
      ReturnStatement(node: Rule.Node) {
        const currentFunction = functionStack.at(-1);
        if (!currentFunction) return;
        const returnStatement = node as Rule.Node & { argument?: Rule.Node | null };
        if (!returnStatement.argument || returnStatement.argument.type !== 'ObjectExpression') return;

        const keySet = getObjectKeys(returnStatement.argument);
        if (keySet.size === 0) return;
        currentFunction.returnObjects.push({ node, keySet });
      },
    };
  },
};

export default rule;
