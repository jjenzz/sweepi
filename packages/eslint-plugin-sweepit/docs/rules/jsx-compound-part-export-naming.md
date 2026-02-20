# Enforce compound part export naming (`jsx-compound-part-export-naming`)

Compound parts should be exported as alias names suitable for namespace imports (`export { DialogTrigger as Trigger }`).

## Why

Aliased part exports pair naturally with compound member usage (`<Dialog.Trigger />`) and avoid runtime object assembly patterns that hide API shape.

## Rule Details

- **Target**: ESM named exports.
- **Reported**:
  - Compound part exports without alias (`export { DialogTrigger }`).
  - Compound part exports aliased to the wrong name.
  - Missing root namespace export for compounds that export parts (`export { Dialog as Root }`).
  - Runtime object exports for compound APIs (`export const Dialog = { Trigger: DialogTrigger }`).
- **Allowed**:
  - `export { DialogTrigger as Trigger }`.
  - Non-compound exports.

## Options

This rule has no options.

## Examples

### Incorrect

```ts
const DialogTrigger = () => null;
export { DialogTrigger };

const TooltipContent = () => null;
export { TooltipContent as TooltipContent };

const Dialog = () => null;
const DialogTrigger = () => null;
export { DialogTrigger as Trigger };

const DialogTrigger = () => null;
export const Dialog = { Trigger: DialogTrigger };
```

### Correct

```ts
// dialog.tsx
const Dialog = () => null;
const DialogTrigger = () => null;
export { Dialog as Root, DialogTrigger as Trigger };

// button.tsx
const Button = () => null;
export { Button };
```

## How To Fix

1. Export each compound part with its part alias (`Trigger`, `Content`, `Item`, and so on).
2. For compounds that export parts, export the block root as `Root` (`export { Dialog as Root }`).
3. Avoid runtime object exports for compound APIs.
4. Keep the namespace shape in import usage, not in exported runtime objects.

```ts
// before
export { DialogTrigger };

// after
export { DialogTrigger as Trigger };
```

## When Not To Use It

Disable this rule if your architecture intentionally exports runtime objects for compound APIs instead of alias-based part exports.
