# Disallow pass-through-only props (`no-pass-through-props`)

Do not accept props in owner components if they are only forwarded unchanged to child props.

## Why

Pass-through-only props hide ownership boundaries. They make parent components look responsible for values they never own or transform.

## Rule Details

- **Target**: PascalCase React component functions with destructured props.
- **Reported**: Props that are only used as direct JSX prop forwards.
- **Allowed**:
  - Props that are transformed, derived, or used in local logic.
  - `children` composition.

## Options

```ts
type NoPassThroughPropsOptions = {
  allowedDepth?: number; // default: 1
};
```

- `allowedDepth`: Maximum allowed pass-through chain depth before reporting.
- Default `1` allows one wrapper pass-through (for example, a thin input wrapper over `<input />`).
- Depth `2+` becomes a composition-pressure signal and is reported.

## Examples

### Incorrect

```tsx
const NativeInput = ({ ...props }: InputProps) => <input {...props} />;

const Input = ({ ...props }: InputProps) => <NativeInput {...props} />;

const FormField = ({ ...props }: InputProps) => <Input {...props} />;
}
```

### Correct

```tsx
function Card({ title }: { title: string }) {
  const headingText = title.toUpperCase();
  return <Heading title={headingText} />;
}

const Input: React.FC<InputProps> = ({ type = 'text', ...props }) => (
  <input type={type} {...props} />
);

function Dialog({ children }: { children: React.ReactNode }) {
  return <DialogRoot>{children}</DialogRoot>;
}
```

## How To Fix

1. Keep value ownership local where possible.
2. Derive values before passing them down.
3. Prefer `children` for composition boundaries instead of pass-through prop relays.

```tsx
// before
function Card({ title }: { title: string }) {
  return <Heading title={title} />;
}

// after
function Card({ title }: { title: string }) {
  const headingText = title.toUpperCase();
  return <Heading title={headingText} />;
}
```
