# Prefer noun before verb in handler props (`jsx-on-noun-verb-handler-props`)

Enforce that handler prop names starting with `on` use the pattern `on{Noun}{Verb}` (e.g. `onValueChange`) instead of `on{Verb}{Noun}` (e.g. `onChangeValue`).

## Why

`on{Noun}{Verb}` scales better in larger component APIs because related handlers group naturally (`onValueChange`, `onValueFocus`, `onValueBlur`).
This makes discovery and autocomplete easier than mixed verb-first naming.

## Rule Details

- **Target**: JSX attributes whose names start with `on`.
- **Behavior**: Detects `on{Verb}{Noun}` patterns and suggests renaming to `on{Noun}{Verb}`.
- **Built-in vocabulary**: Uses curated internal noun/verb dictionaries for common UI/domain naming and evolves over time. Use `extendVerbs`/`extendNouns` to add project-specific terms.

## Options

This rule accepts one optional object.

### extendVerbs

Type: `string[]`\
Default: `[]` (extends built-in defaults)

Additional verbs to allow when checking `on{Noun}{Verb}` ordering.
Values are normalized case-insensitively and whitespace is removed. 

### extendNouns

Type: `string[]`\
Default: `[]` (extends built-in defaults)

Additional nouns to allow when checking `on{Noun}{Verb}` ordering.
Values are normalized case-insensitively, and whitespace is removed.

The example below adds domain-specific values:

```json
{
  "rules": {
    "sweepit/jsx-on-noun-verb-handler-props": [
      "error",
      {
        "extendVerbs": ["change", "disable", "disabled"],
        "extendNouns": ["value", "feature", "item"]
      }
    ]
  }
}
```

## Examples

### Incorrect

```tsx
<Input onChangeValue={handleChange} />
<Form onSubmitForm={handleSubmit} />
<Modal onCloseModal={handleClose} />
<Select onChangeOption={handleChange} />
<Button onClickButton={handleClick} />
<FeatureFlag onDisableFeature={handleDisable} />
<FeatureFlag onDisabledFeature={handleDisabled} />
```

### Correct

```tsx
<Input onValueChange={handleChange} />
<Form onFormSubmit={handleSubmit} />
<Modal onModalClose={handleClose} />
<Select onOptionChange={handleChange} />
<Button onButtonClick={handleClick} />
<button onClick={handleClick} />
<input onChange={handleChange} />
<FeatureFlag onFeatureDisable={handleDisable} />
<FeatureFlag onFeatureDisabled={handleDisabled} />
```

With custom options:

```tsx
// eslint rule options:
// { extendVerbs: ['archived'], extendNouns: ['item'] }
<Item onItemArchived={handleArchived} />
```

## How To Fix

1. For `on{Verb}{Noun}`, reorder to `on{Noun}{Verb}`.
2. Keep the same handler implementation; only rename the prop API.
3. Update both component definition and all call sites.

```tsx
// before
<Input onChangeValue={handleChange} />

// after
<Input onValueChange={handleChange} />
```

## When Not To Use It

Disable this rule if:

- Your codebase uses a different convention for handler prop names.
- You prefer `on{Verb}{Noun}` for consistency with existing APIs.
- You have third-party components that require the opposite pattern.
