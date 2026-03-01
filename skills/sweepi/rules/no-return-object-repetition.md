# Avoid repeated object returns (`no-return-object-repetition`)

Prefer reusing a shared base object when a function has multiple `return { ... }` objects with heavily overlapping keys.

## Why

When each return path repeats the same object shape, it is harder to scan what actually changes by code path.

Using a shared base object and targeted overrides makes differences explicit.

## Rule Details

This rule inspects object return statements inside the same function.

For key counting, it includes both top-level and nested object keys.
Nested keys are compared by path (for example `meta`, `meta.id`, `meta.name`).

It reports when at least one pair of object returns has both:

- shared keys `>= minSharedKeys` (including nested key paths), and
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
function parseRunOptions(argumentsList: string[], options: ParsedRunOptions) {
  if (argumentsList.includes('--all')) {
    return {
      projectDirectory: options.projectDirectory,
      all: options.all,
      format: 'stylish',
    };
  }

  return {
    projectDirectory: '.',
    all: false,
    format: options.format,
  };
}
```

### Correct (reuse an existing base object)

```ts
function parseRunArgument(argument: string, options: ParsedRunOptions) {
  if (argument === '--all') {
    return { ...options, format: 'stylish' };
  }

  return { ...options, projectDirectory: '.', all: false };
}
```

### Correct (build shared defaults once when no base object exists)

```ts
function parseRunOptions(argumentsList: string[]) {
  const defaultOptions = {
    projectDirectory: '.',
    all: false,
    format: 'higlight',
  };

  if (argumentsList.includes('--all')) {
    return { ...defaultOptions, all: true, format: 'stylish' };
  }

  return defaultOptions;
}
```

## How To Fix

1. Identify keys repeated across return objects.
2. Reuse an existing base object when one already represents shared defaults (for example `currentOptions`).
3. Otherwise, build a shared default object once.
4. Return spreads of that base/default and override only changed fields.
