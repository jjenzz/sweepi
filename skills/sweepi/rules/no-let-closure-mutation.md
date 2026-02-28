# no-let-closure-mutation

Disallow reassigning `let` bindings from nested function/closure scopes.

## Why

Mutating outer `let` values inside callbacks and inner functions increases hidden coupling and makes control flow harder to reason about.

## Rule Details

This rule reports writes to a `let` variable when the write occurs in a nested function/closure relative to the variable declaration.

- Allowed: writes in the same function boundary, including nested blocks.
- Reported: writes from nested functions/closures.

## Examples

### Incorrect

```ts
let count = 0;
function bump() {
  count++;
}

let value = 0;
const increment = () => {
  value = value + 1;
};
```

### Correct

```ts
let count = 0;
count = count + 1;

let value = 0;
value = increment(1);

let total = 0;
for (let i = 0; i < 3; i++) {
  total = total + 1;
}
```

## How To Fix

1. Move reassignment to the declaration scope.
2. Return new values from nested scopes instead of mutating outer bindings.
3. Consider `const` plus derived values where possible.
