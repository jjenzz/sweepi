# Avoid repeated object returns (`no-return-object-repetition`)

Prefer constructing shared defaults once when a function has multiple `return { ... }` objects with heavily overlapping keys.

## Why

When each return path repeats the same object shape, it is harder to scan what actually changes by code path.

Using shared defaults and targeted overrides makes differences explicit.

## Rule Details

This rule inspects object return statements inside the same function.

It reports when at least one pair of object returns has both:

- shared keys `>= minSharedKeys`, and
- overlap ratio `>= minOverlapRatio`

Overlap ratio is:

`sharedKeys / min(leftKeyCount, rightKeyCount)`

This catches cases where one return mostly mirrors another and enough keys are repeated.

## Options

```json
{
  "rules": {
    "sweepit/no-return-object-repetition": [
      "error",
      {
        "minSharedKeys": 3,
        "minOverlapRatio": 0.7
      }
    ]
  }
}
```

### `minSharedKeys`

- Type: `number` (integer)
- Minimum: `1`
- Default: `3`

### `minOverlapRatio`

- Type: `number`
- Range: `0` to `1`
- Default: `0.7`

## Examples

### Incorrect

```ts
function parseRunOptions(argumentsList: string[]) {
  if (argumentsList.includes('--all')) {
    return {
      projectDirectory: '.',
      all: true,
      format: 'stylish',
    };
  }

  return {
    projectDirectory: '.',
    all: false,
    format: 'stylish',
  };
}
```

### Correct

```ts
function parseRunOptions(argumentsList: string[]) {
  const defaultOptions = {
    projectDirectory: '.',
    all: false,
    format: 'stylish',
  };

  if (argumentsList.includes('--all')) {
    return {
      ...defaultOptions,
      all: true,
    };
  }

  return defaultOptions;
}
```

## How To Fix

1. Identify keys repeated across return objects.
2. Build a shared default object once.
3. Return spreads of that default and override only changed fields.
