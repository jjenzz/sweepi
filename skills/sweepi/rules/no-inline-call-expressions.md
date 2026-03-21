# Prefer extracted call results (`no-inline-call-expressions`)

Prefer extracting function-call results into named variables instead of placing calls directly in loop headers or nested as function arguments.
Use the extraction to make the value self-documenting: the name should describe the subject and intent, not just repeat the function verb.

## Why

Inline call chains in control-flow and arguments make execution flow harder to scan.
Extracting values first improves readability, naming clarity, and debugging.
The extracted variable should explain what the value represents in business or domain terms.
Prefer names like `formattedPrice` or `reportRows` over generic names like `formattedValue` or `result`.

## Rule Details

This rule can enforce two contexts:

- `for-header`: disallow call expressions in `for (...)` headers and in `for...of`/`for...in` right-hand expressions.
- `call-arg`: disallow passing call expressions as arguments to other calls.

By default, both contexts are enabled.

### Allowed call patterns

Top-level `for...of` source calls can be allowed via glob-like callee patterns.

Default allow patterns:

- `*.entries`
- `*.values`
- `*.keys`

Pattern matching applies to the call's callee path (for example, `Object.entries`, `map.values`, `set.keys`).

## Options

```json
{
  "rules": {
    "sweepit/no-inline-call-expressions": [
      "error",
      {
        "contexts": ["for-header", "call-arg"],
        "allowCallPatterns": ["*.entries", "*.values", "*.keys"]
      }
    ]
  }
}
```

### `contexts`

Allowed values:

- `for-header`
- `call-arg`

Default:

```json
["for-header", "call-arg"]
```

### `allowCallPatterns`

- Type: `string[]`
- Default: `["*.entries", "*.values", "*.keys"]`

Controls which top-level `for...of` source calls are exempt from `for-header` reporting.

## Examples

### Incorrect

```ts
for (let i = 0; i < getLimit(); i += 1) {
  // ...
}

for (const report of getReports()) {
  // ...
}

displayPrice(formatValue(price));
saveDraft(buildValue(loadDraft()));
```

### Correct

```ts
const limit = getLimit();
for (let i = 0; i < limit; i += 1) {
  // ...
}

const reportQueue = getReports();
for (const report of reportQueue) {
  // ...
}

const formattedPrice = formatValue(price);
displayPrice(formattedPrice);

const draftRecord = loadDraft();
const draftPayload = buildValue(draftRecord);
saveDraft(draftPayload);
```

With default `allowCallPatterns`:

```ts
for (const [key, value] of Object.entries(record)) {
  // ...
}
```

## How To Fix

1. Compute values before the loop or call site.
2. Name intermediate values according to the subject and intent of the value.
3. Avoid generic names like `value`, `result`, or `formattedValue` when a domain-specific name is available.
4. Keep iteration and invocation sites focused on behavior, not computation.
