# Disallow array props in JSX (`no-array-props`)

Array props often hide component requirements behind bundled list structures.

## Why

- Passing arrays as props encourages broad contracts instead of explicit inputs.
- Arrays frequently carry extra business data the component does not actually use.
- Composition and primitive props keep APIs narrow and maintainable.

## Rule Details

- **Target**: JSX attributes with expression values.
- **Reported**:
  - Inline array literals (`{[ ... ]}`).
  - Expressions whose TypeScript type resolves to an array/tuple (for example identifiers and function calls returning arrays).
- **Allowed**:
  - Primitive values.
  - Function values (for handlers/callbacks).
  - Non-array expressions.

## Options

This rule has no options.

## Examples

### Incorrect

```tsx
<List items={[1, 2, 3]} />
<TagList tags={tags} />
<Menu items={getMenuItems()} />
```

### Correct

```tsx
<List total={3} />
<TagList primaryTag={tagA} secondaryTag={tagB} />
<Menu>
  <Menu.Item label="Dashboard" />
  <Menu.Item label="Settings" />
</Menu>
```

## How To Fix

1. Replace array props with explicit, primitive props for actual component needs.
2. Prefer children/compound-part composition for repeated UI structures.
3. If list state must be shared across composed parts, keep it in private component context instead of prop contracts.
4. Keep array-shaped data at higher ownership boundaries, not component contracts.

```tsx
// before
<TagList tags={tags} />;

// after
<TagList firstTag={tags[0]} secondTag={tags[1]} />;
```

If array-shaped data truly must flow to multiple compound parts, prefer context scoped to the compound component:

```tsx
<Menu.Root selectedCount={selectedCount}>
  <Menu.List />
  <Menu.Footer />
</Menu.Root>
```

## When Not To Use It

Disable this rule if your architecture intentionally uses array-shaped prop contracts.
