# Forms

This guide explains how to build forms that work with Server Actions in Axiom.

## The Pattern

We use real `<form>` elements with `useActionState` for validation feedback. This gives us:
- Works without JavaScript (progressive enhancement)
- Accessible by default
- Automatic pending state
- Type-safe validation errors

**Reference code**: `src/shared/lib/auth/actions.ts`, `src/features/researcher/components/paper-version-control/PaperDetailsStep.tsx`

---

## Two Form Styles in This Codebase

### 1. Multi-step wizard forms (controlled inputs)

Used in paper registration and contract builder. State lives in a custom hook; components receive values and callbacks as props. No `<form>` element — submission is triggered by a button calling a handler in the hook.

**When to use:** Multi-step flows, forms that need client-side computation before submit (e.g. SHA-256 hashing, Lit encryption, wallet signing).

**Reference:** `src/features/researcher/components/paper-version-control/PaperDetailsStep.tsx`, `src/features/researcher/hooks/usePaperRegistration.ts`

### 2. Server Action forms (`useActionState`)

Used for simple, self-contained mutations. The `<form action={action}>` sends `FormData` directly to a Server Action. Validation errors flow back through `state`.

**When to use:** Single-purpose forms where server-side validation is the main concern (e.g. profile updates, role selection, ORCID connection).

**Reference:** `src/shared/lib/auth/actions.ts` — `doLogin`, `doLogout` are the existing Server Actions.

---

## Basic Server Action Form

```tsx
'use client';

import { useActionState } from 'react';
import { updateProfile, type State } from '@/src/features/auth/actions';

export function UpdateProfileForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    updateProfile,
    { errors: {}, message: null }
  );

  return (
    <form action={action} className="flex flex-col gap-[18px]">
      {/* Display name field */}
      <div>
        <label
          htmlFor="displayName"
          style={{ fontSize: 11, color: '#8a8070', marginBottom: 6, display: 'block' }}
        >
          Display Name <span style={{ color: '#d4645a' }}>*</span>
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          aria-describedby={state.errors?.displayName ? 'displayName-error' : undefined}
          style={{
            width: '100%', padding: '10px 14px',
            background: 'rgba(30,28,24,0.8)',
            border: '1px solid rgba(120,110,95,0.25)',
            borderRadius: 4, color: '#d4ccc0',
            fontFamily: "'Georgia', serif", fontSize: 13, outline: 'none',
          }}
        />
        {state.errors?.displayName && (
          <p
            id="displayName-error"
            className="text-xs italic mt-1.5 px-1"
            style={{ color: '#d4645a' }}
            aria-live="polite"
          >
            {state.errors.displayName[0]}
          </p>
        )}
      </div>

      {/* General error */}
      {state.message && (
        <p className="text-xs" style={{ color: '#d4645a' }} aria-live="polite">
          {state.message}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="rounded py-2 px-4 text-sm font-serif cursor-pointer"
        style={{
          background: pending ? 'rgba(120,110,95,0.1)' : 'rgba(201,164,74,0.12)',
          border: '1px solid rgba(201,164,74,0.3)',
          color: pending ? '#6a6050' : '#c9a44a',
        }}
      >
        {pending ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
}
```

The matching Server Action:

```ts
// src/features/auth/actions.ts
'use server';

import { z } from 'zod';

export type State = {
  errors?: { displayName?: string[] };
  message: string | null;
};

const schema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
});

export async function updateProfile(prevState: State, formData: FormData): Promise<State> {
  const result = schema.safeParse({ displayName: formData.get('displayName') });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors, message: null };
  }

  // ... write to DB via features/users/mutations.ts

  return { errors: {}, message: null };
}
```

---

## Styling Conventions

Forms in this codebase share consistent inline styles. Extract them to avoid repetition:

```tsx
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(30,28,24,0.8)',
  border: '1px solid rgba(120,110,95,0.25)',
  borderRadius: 4, color: '#d4ccc0',
  fontFamily: "'Georgia', serif", fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#8a8070',
  marginBottom: 6, display: 'block',
};
```

These are defined at module scope in each component file. Do not put them in a shared file — keep them co-located with the component. This also prevents re-creation on every render (a performance pattern used throughout the codebase).

---

## Multi-Step Wizard Pattern

For forms that span multiple steps (paper registration, contract builder):

```
src/features/{domain}/hooks/useDomain.ts              — all state, step index, handlers, submit logic
src/features/{domain}/components/{subdomain}/
  StepOne.tsx                                          — controlled inputs, no internal state
  StepTwo.tsx
  StepNavigation.tsx                                   — prev/next buttons, disabled logic
src/app/(protected)/{role}/{route}/page.tsx            — server component passes initialData to client boundary
```

**Key rules:**
- Each step component is purely controlled: receives values + `onChange` callbacks as props.
- The hook owns all state and orchestrates submission (hashing → encrypt → upload → API → HCS).
- `StepNavigation` receives `onNext`, `onBack`, `canProceed` from the hook.

**Reference:** `src/features/researcher/hooks/usePaperRegistration.ts` + `src/features/researcher/components/paper-version-control/`

---

## `useActionState` Key Parts

```tsx
const [state, action, pending] = useActionState(serverAction, initialState);
```

| Value | Description |
|-------|-------------|
| `state` | Object returned by the last Server Action call. On first render, equals `initialState`. |
| `action` | Pass to `<form action={action}>`. Automatically sends `FormData` to the server. |
| `pending` | `true` while the action is in-flight. Use to disable the submit button. |

Initial state must match your `State` type:

```ts
{ errors: {}, message: null }
```

---

## When to Use `.bind()`

If the form needs context that isn't a form field (e.g. a paper ID):

```tsx
export function AddKeywordForm({ paperId }: { paperId: string }) {
  const addKeywordWithId = addKeyword.bind(null, paperId);
  const [state, action, pending] = useActionState(addKeywordWithId, { errors: {}, message: null });

  return <form action={action}>...</form>;
}
```

Server Action receives the bound argument first:

```ts
export async function addKeyword(
  paperId: string,     // bound argument — comes first
  prevState: State,
  formData: FormData
) { ... }
```

---

## Accessibility Checklist

### 1. Every input needs a label

```tsx
<label htmlFor="title" style={labelStyle}>Title</label>
<input id="title" name="title" />
```

### 2. Connect errors to their input

```tsx
<input
  id="title"
  aria-describedby={state.errors?.title ? 'title-error' : undefined}
/>
{state.errors?.title && (
  <p id="title-error" aria-live="polite" style={{ color: '#d4645a' }}>
    {state.errors.title[0]}
  </p>
)}
```

### 3. Announce errors to screen readers

`aria-live="polite"` on error paragraphs causes screen readers to announce the error when it appears.

### 4. Disable the submit button while pending

```tsx
<button type="submit" disabled={pending}>
  {pending ? 'Saving...' : 'Save'}
</button>
```

---

## Special Cases in This Codebase

### File inputs (paper upload)

File inputs need special handling because they can't be a plain controlled `<input value={...}>`. Use a hidden `<input type="file">` triggered by a styled div:

```tsx
const fileInputRef = useRef<HTMLInputElement>(null);

<input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
<div onClick={() => fileInputRef.current?.click()}>
  Click to upload PDF
</div>
```

Hash the file client-side immediately on selection — do not wait for form submission:

```ts
const hash = await hashFile(file); // src/shared/lib/hashing.ts — Web Crypto API
```

**Reference:** `src/features/researcher/components/paper-version-control/PaperDetailsStep.tsx`

### Confidential fields

Some fields must never appear in on-chain hashes. Add a visible note beneath the field:

```tsx
<textarea ... />
<div className="text-xs italic mt-1.5 px-1" style={{ color: '#6a6050' }}>
  These comments are stored off-chain only and are never included in the review hash anchored on Hedera.
</div>
```

**Reference:** `src/features/reviewer/components/review-workspace/GeneralCommentsSection.tsx` (`confidentialEditorComments` field)

---

## Common Mistakes

### Using `onSubmit` instead of `action`

```tsx
// DON'T
<form onSubmit={handleSubmit}>

// DO
<form action={action}>
```

### Managing validation state with `useState`

```tsx
// DON'T
const [errors, setErrors] = useState({});

// DO
const [state, action, pending] = useActionState(myAction, { errors: {}, message: null });
// state.errors comes from the server
```

### Missing `aria-live` on error messages

```tsx
// DON'T
{error && <p style={{ color: '#d4645a' }}>{error}</p>}

// DO
{error && <p id="field-error" aria-live="polite" style={{ color: '#d4645a' }}>{error}</p>}
```

### Hashing after upload instead of before

Always hash client-side before any upload or API call. The on-chain hash must be of the original unencrypted content.

```ts
// DO — in the onChange handler, not in the submit handler
const hash = await hashFile(file);
setFileHash(hash);
// then later: encrypt → upload → record hash on-chain
```
