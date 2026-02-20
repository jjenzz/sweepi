# Disallow inline array literals in JSX props (`no-array-props`)

Inline array literals in JSX props create a new reference on every render.

## Why

Passing fresh array references makes component inputs unstable and can trigger avoidable rerenders or effect churn.

## Rule Details

- **Target**: JSX attributes with expression values.
- **Reported**: Inline array literals (`{[ ... ]}`) passed directly as prop values.
- **Allowed**:
  - Primitive values.
  - Identifiers or stable references (`items={items}`).
  - Function calls and other non-array expressions.

## Options

This rule has no options.

## Examples

### Incorrect

```tsx
<List items={[1, 2, 3]} />
<Tags entries={['a', 'b']} />
```

### Correct

```tsx
const itemList = [1, 2, 3];
const tagEntries = ['a', 'b'];

<List items={itemList} />
<Tags entries={tagEntries} />
```

## How To Fix

1. Hoist inline array literals into stable identifiers.
2. Pass the identifier instead of an inline literal.
3. Keep array creation at an ownership boundary where reference changes are intentional.

```tsx
// before
<List items={[1, 2, 3]} />

// after
const itemList = [1, 2, 3];
<List items={itemList} />
```

## When Not To Use It

Disable this rule if your architecture intentionally allows inline array literals in JSX and accepts the referential churn.
