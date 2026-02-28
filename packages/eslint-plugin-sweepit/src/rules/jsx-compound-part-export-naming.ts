import type { Rule } from 'eslint';
import path from 'node:path';

interface ExportRecord {
  localName: string;
  exportedName: string;
  node: Rule.Node;
}

interface ObjectExportRecord {
  name: string;
  node: Rule.Node;
}

interface NamedExportDeclarationNode {
  declaration?: Rule.Node | null;
  specifiers?: Rule.Node[];
  source?: Rule.Node | null;
}

function isPascalCase(name: string): boolean {
  if (name.length === 0) return false;
  const first = name[0];
  return first >= 'A' && first <= 'Z';
}

function normalizeForComparison(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getFileStem(filename: string): string | null {
  if (!filename || filename === '<input>') return null;
  const base = path.basename(filename);
  const ext = path.extname(base);
  if (!ext) return base;
  return base.slice(0, -ext.length);
}

function isFunctionLikeComponentInit(node: Rule.Node | null | undefined): boolean {
  if (!node) return false;
  const typed = node as unknown as { type?: string };
  return typed.type === 'ArrowFunctionExpression' || typed.type === 'FunctionExpression';
}

function getIdentifierLikeName(node: Rule.Node | null | undefined): string | null {
  if (!node) return null;
  const typedNode = node as unknown as { type?: string; name?: string; value?: unknown };
  if (typedNode.type === 'Identifier' && typedNode.name) return typedNode.name;
  if (typedNode.type === 'Literal' && typeof typedNode.value === 'string') return typedNode.value;
  return null;
}

function collectLocalComponentNames(
  localComponents: ReadonlySet<string>,
  objectExports: ReadonlyArray<ObjectExportRecord>,
): ReadonlySet<string> {
  return new Set<string>([...localComponents, ...objectExports.map((entry) => entry.name)]);
}

function getBlockName(
  stem: string,
  localComponents: ReadonlySet<string>,
  objectExports: ReadonlyArray<ObjectExportRecord>,
): string | null {
  const normalizedStem = normalizeForComparison(stem);
  const localComponentNames = collectLocalComponentNames(localComponents, objectExports);
  const blockCandidates = [...localComponentNames].filter(
    (name) => normalizeForComparison(name) === normalizedStem,
  );
  const block = blockCandidates[0];
  if (!block) return null;
  return block;
}

function getComponentExportsForBlock(
  localComponents: ReadonlySet<string>,
  exports: ReadonlyArray<ExportRecord>,
  block: string,
): {
  componentExports: ReadonlyArray<ExportRecord>;
  blockExports: ReadonlyArray<ExportRecord>;
  partExports: ReadonlyArray<ExportRecord>;
} {
  const componentExports = exports.filter(
    (entry) => localComponents.has(entry.localName) && isPascalCase(entry.localName),
  );
  const blockExports = componentExports.filter((entry) => entry.localName === block);
  const partExports = componentExports.filter(
    (entry) => entry.localName !== block && entry.localName.startsWith(block),
  );
  return { componentExports, blockExports, partExports };
}

function reportObjectExportsForBlock(
  context: Readonly<Rule.RuleContext>,
  objectExports: ReadonlyArray<ObjectExportRecord>,
  block: string,
): void {
  for (const objectExport of objectExports) {
    if (objectExport.name !== block) continue;
    context.report({
      node: objectExport.node,
      messageId: 'noRuntimeObjectExport',
      data: { name: objectExport.name },
    });
  }
}

function reportMissingPartAliases(
  context: Readonly<Rule.RuleContext>,
  partExports: ReadonlyArray<ExportRecord>,
  block: string,
): void {
  const partNames = [...new Set(partExports.map((entry) => entry.localName))];
  for (const partName of partNames) {
    const expectedPartAlias = partName.slice(block.length);
    if (expectedPartAlias.length === 0) continue;

    const partEntries = partExports.filter((entry) => entry.localName === partName);
    const hasPartAlias = partEntries.some((entry) => entry.exportedName === expectedPartAlias);
    if (hasPartAlias) continue;

    const firstPartEntry = partEntries[0];
    if (!firstPartEntry) continue;
    context.report({
      node: firstPartEntry.node,
      messageId: 'requirePartAlias',
      data: {
        local: partName,
        part: expectedPartAlias,
        block,
      },
    });
  }
}

function reportMissingRootExports(
  context: Readonly<Rule.RuleContext>,
  block: string,
  blockExports: ReadonlyArray<ExportRecord>,
  partExports: ReadonlyArray<ExportRecord>,
): void {
  if (partExports.length === 0) return;

  if (blockExports.length === 0) {
    const firstPartExport = partExports[0];
    if (!firstPartExport) return;
    context.report({
      node: firstPartExport.node,
      messageId: 'requireRootExport',
      data: { block },
    });
    return;
  }

  const hasRootAlias = blockExports.some((entry) => entry.exportedName === 'Root');
  if (hasRootAlias) return;

  const firstBlockExport = blockExports[0];
  if (!firstBlockExport) return;
  context.report({
    node: firstBlockExport.node,
    messageId: 'requireRootAlias',
    data: { block },
  });
}

function collectNamedSpecifierExports(
  declaration: NamedExportDeclarationNode,
  recordExport: (localName: string, exportedName: string, node: Rule.Node) => void,
): void {
  for (const specifier of declaration.specifiers ?? []) {
    if (specifier.type !== 'ExportSpecifier') continue;
    const exportSpecifier = specifier as unknown as {
      local?: Rule.Node;
      exported?: Rule.Node;
    };
    const localName = getIdentifierLikeName(exportSpecifier.local);
    const exportedName = getIdentifierLikeName(exportSpecifier.exported);
    if (!localName || !exportedName || !exportSpecifier.exported) continue;
    recordExport(localName, exportedName, exportSpecifier.exported);
  }
}

function processNamedFunctionExport(
  declaration: NamedExportDeclarationNode,
  registerLocalComponent: (name: string) => void,
  recordExport: (localName: string, exportedName: string, node: Rule.Node) => void,
): boolean {
  if (declaration.declaration?.type !== 'FunctionDeclaration') return false;
  const fn = declaration.declaration as unknown as { id?: Rule.Node | null };
  const idName = getIdentifierLikeName(fn.id);
  if (!idName || !fn.id) return true;
  registerLocalComponent(idName);
  recordExport(idName, idName, fn.id);
  return true;
}

function processNamedVariableEntry(
  entry: { id?: Rule.Node; init?: Rule.Node | null },
  registerLocalComponent: (name: string) => void,
  recordObjectExport: (name: string, node: Rule.Node) => void,
  recordExport: (localName: string, exportedName: string, node: Rule.Node) => void,
): void {
  const idName = getIdentifierLikeName(entry.id);
  if (!idName || !entry.id) return;

  if (entry.init?.type === 'ObjectExpression' && isPascalCase(idName)) {
    recordObjectExport(idName, entry.id);
    return;
  }

  if (!isFunctionLikeComponentInit(entry.init)) return;
  registerLocalComponent(idName);
  recordExport(idName, idName, entry.id);
}

function processNamedVariableExport(
  declaration: NamedExportDeclarationNode,
  registerLocalComponent: (name: string) => void,
  recordObjectExport: (name: string, node: Rule.Node) => void,
  recordExport: (localName: string, exportedName: string, node: Rule.Node) => void,
): boolean {
  if (declaration.declaration?.type !== 'VariableDeclaration') return false;
  const variableDeclaration = declaration.declaration as unknown as {
    declarations?: Array<{ id?: Rule.Node; init?: Rule.Node | null }>;
  };
  for (const entry of variableDeclaration.declarations ?? []) {
    processNamedVariableEntry(entry, registerLocalComponent, recordObjectExport, recordExport);
  }
  return true;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce compound export aliasing from file-stem block and disallow runtime object export APIs',
      url: 'https://github.com/jjenzz/sweepit/tree/main/skills/sweepi/rules/jsx-compound-part-export-naming.md',
    },
    messages: {
      requirePartAlias:
        "Export '{{local}}' as '{{part}}' for block '{{block}}' (export { {{local}} as {{part}} }).",
      requireRootExport:
        "Block '{{block}}' exports parts. Also export its root as `export { {{block}} as Root }`.",
      requireRootAlias: "Export block '{{block}}' as 'Root' (export { {{block}} as Root }).",
      noRuntimeObjectExport:
        "Avoid exporting runtime object '{{name}}' for compound APIs. Export aliased parts instead.",
    },
    schema: [],
  },
  create(context) {
    const readonlyContext = context as Readonly<Rule.RuleContext>;
    const localComponents = new Set<string>();
    let exports: ReadonlyArray<ExportRecord> = [];
    let objectExports: ReadonlyArray<ObjectExportRecord> = [];

    function registerLocalComponent(name: string): void {
      if (!isPascalCase(name)) return;
      localComponents.add(name);
    }

    function recordExport(localName: string, exportedName: string, node: Rule.Node): void {
      exports = [...exports, { localName, exportedName, node }];
    }

    function recordObjectExport(name: string, node: Rule.Node): void {
      objectExports = [...objectExports, { name, node }];
    }

    return {
      FunctionDeclaration(node: Rule.Node) {
        const fn = node as unknown as { id?: Rule.Node | null };
        const idName = getIdentifierLikeName(fn.id);
        if (!idName) return;
        registerLocalComponent(idName);
      },
      VariableDeclarator(node: Rule.Node) {
        const declaration = node as unknown as { id?: Rule.Node; init?: Rule.Node | null };
        if (!isFunctionLikeComponentInit(declaration.init)) return;
        const idName = getIdentifierLikeName(declaration.id);
        if (!idName) return;
        registerLocalComponent(idName);
      },
      ExportNamedDeclaration(node: Rule.Node) {
        const declaration = node as NamedExportDeclarationNode;

        if (declaration.source) return;
        if (processNamedFunctionExport(declaration, registerLocalComponent, recordExport)) return;
        if (
          processNamedVariableExport(
            declaration,
            registerLocalComponent,
            recordObjectExport,
            recordExport,
          )
        ) {
          return;
        }
        collectNamedSpecifierExports(declaration, recordExport);
      },
      ExportDefaultDeclaration(node: Rule.Node) {
        const declaration = node as unknown as { declaration?: Rule.Node | null };
        const declared = declaration.declaration;
        if (!declared) return;

        if (declared.type === 'FunctionDeclaration') {
          const fn = declared as unknown as { id?: Rule.Node | null };
          const idName = getIdentifierLikeName(fn.id);
          if (!idName || !fn.id) return;
          registerLocalComponent(idName);
          recordExport(idName, idName, fn.id);
          return;
        }

        if (declared.type === 'Identifier') {
          const idName = getIdentifierLikeName(declared);
          if (!idName) return;
          recordExport(idName, idName, declared);
        }
      },
      'Program:exit'() {
        const stem = getFileStem(readonlyContext.filename);
        if (!stem) return;
        if (stem.toLowerCase() === 'index') return;

        const block = getBlockName(stem, localComponents, objectExports);
        if (!block) return;

        reportObjectExportsForBlock(readonlyContext, objectExports, block);
        const componentExportsForBlock = getComponentExportsForBlock(
          localComponents,
          exports,
          block,
        );
        const componentExports = componentExportsForBlock.componentExports;
        if (componentExports.length < 2) return;
        reportMissingPartAliases(readonlyContext, componentExportsForBlock.partExports, block);
        reportMissingRootExports(
          readonlyContext,
          block,
          componentExportsForBlock.blockExports,
          componentExportsForBlock.partExports,
        );
      },
    };
  },
};

export default rule;
