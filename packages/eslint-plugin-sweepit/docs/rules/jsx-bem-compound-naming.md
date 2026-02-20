# Enforce BEM compound naming (`jsx-bem-compound-naming`)

Use block-prefixed compound names (`ButtonGroup`, `ButtonGroupItem`, `ButtonGroupIcon`) instead of generic or unanchored names (`Group`, `Item`, `GroupItemIcon`).

## Why

Consistent block prefixes keep compound APIs discoverable and avoid ambiguous names like `Item` or `Icon` that lose ownership context.

## Rule Details

- **Target**: JSX opening element names for custom components.
- **Reported**:
  - Generic part names used as standalone components (`Item`, `Icon`, `Trigger`, and similar).
  - Compound part names that do not have a matching block component in scope (`GroupItemIcon` without `GroupItem`).
- **Allowed**:
  - Consistent block-prefixed naming (`ButtonGroup`, `ButtonGroupItem`, `ButtonGroupIcon`).
  - Single components that are not compound parts.
  - Native elements.

## Options

This rule has no options.

## Examples

### Incorrect

```tsx
const Group = () => null;
const Item = () => null;
const GroupItemIcon = () => null;

<Item />
<GroupItemIcon />
```

### Correct

```tsx
const ButtonGroup = () => null;
const ButtonGroupItem = () => null;
const ButtonGroupIcon = () => null;

<ButtonGroup />
<ButtonGroupItem />
<ButtonGroupIcon />
```

## How To Fix

1. Choose one explicit block name for the compound (`ButtonGroup`).
2. Prefix each part with that block (`ButtonGroupItem`, `ButtonGroupIcon`, and so on).
3. Avoid generic standalone part names (`Item`, `Icon`) in JSX.

```tsx
// before
<Item />
<GroupItemIcon />

// after
<ButtonGroupItem />
<ButtonGroupIcon />
```

## When Not To Use It

Disable this rule if your project intentionally allows generic/unanchored compound part names.
