import type { Rule } from 'eslint';
import path from 'node:path';

function isPascalCase(name: string): boolean {
  if (name.length === 0) return false;
  const first = name[0];
  return first >= 'A' && first <= 'Z';
}

function isFunctionLikeComponentInit(node: Rule.Node | null | undefined): boolean {
  if (!node) return false;
  const typed = node as unknown as { type?: string };
  return typed.type === 'ArrowFunctionExpression' || typed.type === 'FunctionExpression';
}

function normalizeForComparison(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildExampleName(block: string, localName: string): string {
  if (localName.startsWith(block)) return localName;

  let overlapLength = 0;
  for (let index = 1; index < block.length; index += 1) {
    const suffix = block.slice(index);
    if (localName.startsWith(suffix)) {
      overlapLength = suffix.length;
      break;
    }
  }

  if (overlapLength === 0) return `${block}${localName}`;
  return `${block}${localName.slice(overlapLength)}`;
}

function getFileStem(filename: string): string | null {
  if (!filename || filename === '<input>') return null;
  const base = path.basename(filename);
  const ext = path.extname(base);
  if (!ext) return base;
  return base.slice(0, -ext.length);
}

function getLiteralStringValue(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function getExportedIdentifierName(node: Rule.Node | null | undefined): string | null {
  if (!node) return null;
  const typedNode = node as unknown as { type?: string; name?: string; value?: unknown };
  if (typedNode.type === 'Identifier') return typedNode.name ?? null;
  if (typedNode.type !== 'Literal') return null;
  return getLiteralStringValue(typedNode.value);
}

interface ExportedComponent {
  localName: string;
  exportedName: string;
  node: Rule.Node;
}

function createExportKey(component: ExportedComponent): string {
  const rangeNode = component.node as Rule.Node & { range?: readonly number[] };
  const start = rangeNode.range?.[0] ?? -1;
  return `${component.localName}:${component.exportedName}:${start}`;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce compound component export naming by matching exported component names to the file stem block prefix',
      url: 'https://github.com/jjenzz/sweepit/tree/main/skills/sweepi/rules/jsx-bem-compound-naming.md',
    },
    messages: {
      exportedPartMustUseBlockPrefix:
        "Exported component '{{name}}' should be prefixed with compound block '{{block}}' (e.g. '{{example}}').",
    },
    schema: [],
  },
  create(context: Readonly<Rule.RuleContext>) {
    const localComponents = new Map<string, Rule.Node>();
    const exportedComponents = new Map<string, ExportedComponent>();

    function registerLocalComponent(name: string, node: Rule.Node): void {
      if (!isPascalCase(name)) return;
      localComponents.set(name, node);
    }

    function recordExport(localName: string, exportedName: string, node: Rule.Node): void {
      if (!localComponents.has(localName)) return;
      if (!isPascalCase(exportedName)) return;
      const component = { localName, exportedName, node };
      exportedComponents.set(createExportKey(component), component);
    }

    function registerAndRecordSameNameExport(name: string, node: Rule.Node): void {
      registerLocalComponent(name, node);
      recordExport(name, name, node);
    }

    function recordExportedFunctionDeclaration(node: Rule.Node | null | undefined): boolean {
      if (!node || node.type !== 'FunctionDeclaration') return false;
      const fn = node as unknown as { id?: Rule.Node | null };
      const idName = getExportedIdentifierName(fn.id);
      if (!idName || !fn.id) return true;
      registerAndRecordSameNameExport(idName, fn.id);
      return true;
    }

    function recordExportedVariableDeclaration(node: Rule.Node | null | undefined): boolean {
      if (!node || node.type !== 'VariableDeclaration') return false;
      const variableDeclaration = node as unknown as {
        declarations?: ReadonlyArray<{ id?: Rule.Node; init?: Rule.Node | null }>;
      };
      const entries = variableDeclaration.declarations ?? [];
      for (const entry of entries) {
        recordVariableDeclarationEntry(entry);
      }
      return true;
    }

    function recordVariableDeclarationEntry(entry: {
      id?: Rule.Node;
      init?: Rule.Node | null;
    }): void {
      if (!isFunctionLikeComponentInit(entry.init)) return;
      const idName = getExportedIdentifierName(entry.id);
      if (!idName || !entry.id) return;
      registerAndRecordSameNameExport(idName, entry.id);
    }

    function recordExportSpecifier(specifier: Rule.Node): void {
      if (specifier.type !== 'ExportSpecifier') return;
      const exportSpecifier = specifier as unknown as {
        local?: Rule.Node;
        exported?: Rule.Node;
      };
      const localName = getExportedIdentifierName(exportSpecifier.local);
      const exportedName = getExportedIdentifierName(exportSpecifier.exported);
      if (!localName || !exportedName || !exportSpecifier.exported) return;
      recordExport(localName, exportedName, exportSpecifier.exported);
    }

    function getBlockCandidates(
      entries: ReadonlyArray<ExportedComponent>,
      normalizedStem: string,
    ): string[] {
      return entries
        .map((entry) => entry.localName)
        .filter((name) => normalizeForComparison(name) === normalizedStem);
    }

    function hasAnyBlockPrefix(localName: string, blockCandidates: ReadonlyArray<string>): boolean {
      return blockCandidates.some((block) => localName.startsWith(block));
    }

    function reportMissingPrefix(
      exported: ExportedComponent,
      blockCandidates: ReadonlyArray<string>,
    ): void {
      const preferredBlock = blockCandidates[0] ?? 'Block';
      context.report({
        node: exported.node,
        messageId: 'exportedPartMustUseBlockPrefix',
        data: {
          name: exported.localName,
          block: preferredBlock,
          example: buildExampleName(preferredBlock, exported.localName),
        },
      });
    }

    function processNamedExportDeclaration(declarationNode: Rule.Node | null | undefined): void {
      if (recordExportedFunctionDeclaration(declarationNode)) return;
      recordExportedVariableDeclaration(declarationNode);
    }

    function processNamedExportSpecifiers(specifiers: ReadonlyArray<Rule.Node> | undefined): void {
      for (const specifier of specifiers ?? []) {
        recordExportSpecifier(specifier);
      }
    }

    function getBlockCandidatesForFile(
      exportedEntries: ReadonlyArray<ExportedComponent>,
    ): ReadonlyArray<string> | null {
      const stem = getFileStem(context.filename);
      if (!stem || stem.toLowerCase() === 'index') return null;
      const normalizedStem = normalizeForComparison(stem);
      const blockCandidates = getBlockCandidates(exportedEntries, normalizedStem);
      return blockCandidates.length === 0 ? null : blockCandidates;
    }

    function validateExportedComponent(
      exported: ExportedComponent,
      blockCandidates: ReadonlyArray<string>,
    ): void {
      const isBlockExport = blockCandidates.includes(exported.localName);
      if (isBlockExport) return;
      if (hasAnyBlockPrefix(exported.localName, blockCandidates)) return;
      reportMissingPrefix(exported, blockCandidates);
    }

    function validateExportedComponents(): void {
      const exportedEntries = [...exportedComponents.values()];
      if (exportedEntries.length < 2) return;
      const blockCandidates = getBlockCandidatesForFile(exportedEntries);
      if (!blockCandidates) return;
      for (const exported of exportedEntries) {
        validateExportedComponent(exported, blockCandidates);
      }
    }

    return {
      FunctionDeclaration(node: Rule.Node) {
        const fn = node as unknown as { id?: Rule.Node | null };
        const idName = getExportedIdentifierName(fn.id);
        if (!idName) return;
        registerLocalComponent(idName, fn.id as Rule.Node);
      },
      VariableDeclarator(node: Rule.Node) {
        const declaration = node as unknown as { id?: Rule.Node; init?: Rule.Node | null };
        if (!isFunctionLikeComponentInit(declaration.init)) return;
        const idName = getExportedIdentifierName(declaration.id);
        if (!idName || !declaration.id) return;
        registerLocalComponent(idName, declaration.id);
      },
      ExportNamedDeclaration(node: Rule.Node) {
        const declaration = node as unknown as {
          declaration?: Rule.Node | null;
          specifiers?: ReadonlyArray<Rule.Node>;
          source?: Rule.Node | null;
        };

        if (declaration.source) return;
        processNamedExportDeclaration(declaration.declaration);
        processNamedExportSpecifiers(declaration.specifiers);
      },
      ExportDefaultDeclaration(node: Rule.Node) {
        const declaration = node as unknown as { declaration?: Rule.Node | null };
        const declared = declaration.declaration;
        if (!declared) return;
        if (recordExportedFunctionDeclaration(declared)) return;
        if (declared.type !== 'Identifier') return;
        const idName = getExportedIdentifierName(declared);
        if (!idName) return;
        recordExport(idName, idName, declared);
      },
      'Program:exit'() {
        validateExportedComponents();
      },
    };
  },
};

export default rule;
