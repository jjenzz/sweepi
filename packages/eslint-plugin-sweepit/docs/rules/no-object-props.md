# Disallow inline object literals in JSX props (`no-object-props`)

Inline object literals in JSX props create a new reference on every render.

## Why

Passing fresh object references makes component inputs unstable and can trigger avoidable rerenders or effect churn.

## Rule Details

- **Target**: JSX attributes with expression values.
- **Reported**: Inline object literals (`{{ ... }}`) passed directly as prop values.
- **Allowed**:
  - Primitive values.
  - Identifiers or stable references (`config={config}`).
  - Function calls and other non-object expressions.

## Options

This rule has no options.

## Examples

### Incorrect

```tsx
<Card style={{ color: 'red' }} />
<List options={{ dense: true, interactive: false }} />
```

### Correct

```tsx
const cardStyle = { color: 'red' };
const listOptions = { dense: true, interactive: false };

<Card style={cardStyle} />
<List options={listOptions} />
```

## How To Fix

1. Hoist inline object literals into stable identifiers.
2. Pass the identifier instead of an inline literal.
3. Keep object creation at an ownership boundary where reference changes are intentional.

```tsx
// before
<Card style={{ color: 'red' }} />;

// after
const cardStyle = { color: 'red' };
<Card style={cardStyle} />;
```

## When Not To Use It

Disable this rule if your architecture intentionally allows inline object literals in JSX and accepts the referential churn.
