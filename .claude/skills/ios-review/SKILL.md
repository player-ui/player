---
name: ios-review
description: Review Swift/iOS code against team conventions. Use when the user asks to review Swift code, runs /ios-review, or when writing or editing Swift files in this repo. Enforces standards that linters cannot catch.
context: fork
---

## Current diff (when reviewing a PR)
- Diff: !`git diff HEAD~1 2>/dev/null || echo "No diff available"`

# iOS Code Review — Team Conventions

Review the code (or the diff above if present) against the rules below. Apply **General Rules** always. Apply **UI Rules** only if the changes include SwiftUI views (files containing `View`, `body`, `@ViewBuilder`, or SwiftUI imports).

For each violation, report:
- **Rule**: which rule was broken
- **Location**: file + line number
- **Suggestion**: concrete fix

If no violations are found, say so clearly.

---

## Authoritative Style Guides

Apply these guides in full during every review:

1. **[Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/)** — naming, documentation, Boolean assertions, protocol suffixes, factory method prefixes, mutating/nonmutating pairs, parameter ordering.
2. **[Google Swift Style Guide](https://google.github.io/swift/)** — formatting, brace style, import ordering, enum layout, trailing closures, trailing commas, `///` documentation format.

The team rules below are **additions or overrides** to those guides. Do not re-report violations already covered by the guides unless a rule here applies a stricter standard.

---

## General Rules

### 1. Function length ≤ 50 lines
Functions should generally be 50 lines or fewer. If a function exceeds this, suggest extracting logical chunks into named helpers.

**Why:** Long functions are harder to read, test, and maintain. Shorter functions with clear names make the call site self-documenting.

### 2. Avoid 2+ depth nested conditionals
Nested conditionals (`if`, `guard`, `switch`, `for`, `while`, `repeat`) at a depth greater than 2 (more than one conditional inside another) are a bad pattern. Prefer:
- `guard`/`else` to exit early instead of nesting
- Extracting conditions into well-named boolean variables or functions
- AI-assisted rewrites when nesting is deep

Flag any conditional nested inside another at a depth greater than 2, OR with unnecessary nesting that could be chained.

**Why:** Deep nesting hides the happy path, increases cognitive load, and makes it easy to miss edge cases. Early exits keep logic linear and readable.

### 3. Use async/await instead of callbacks
All async code should use Swift's `async/await`. Callbacks (completion handlers, closures passed as the last argument to async operations) are the old pattern and should not appear in new code.

**Why:** Callbacks invert control flow and make error handling inconsistent. `async/await` reads top-to-bottom, composes cleanly with `try`, and eliminates callback pyramids.

### 4. Name functions after intent, not implementation
Function names should describe *what* the function achieves, not *how* it works. For example, a function that registers a hook to make an interaction fail should be called `failInteraction()`, not `registerFailureHook()`.

Also: add comments on functions you cannot rename (e.g. protocol requirements, library callbacks) explaining their intent.

**Why:** Implementation details change; intent rarely does. Names tied to mechanics rot as the code evolves and obscure the purpose at the call site.

### 5. Public methods before private methods
`public` and `open` methods should appear near the top of a type, just below `init`.

Correct order within a type:
1. `init`
2. `public`/`open` methods
3. `internal` methods
4. `private` methods

**Why:** Public APIs are hard to change post-release. Placing them at the top makes the contract immediately visible to reviewers without scrolling past implementation details.

### 6. Use shorthand `guard/if let foo` (not `guard/if let foo = foo`)
Modern Swift (5.7+) supports shorthand optional binding. Prefer:
```swift
guard let foo else { return }   // ✅
if let bar { ... }              // ✅
```
Over:
```swift
guard let foo = foo else { return }  // ❌ verbose
if let bar = bar { ... }             // ❌ verbose
```

**Why:** The redundant `= foo` is noise. Shorthand is idiomatic Swift 5.7+ and reduces visual clutter.

### 7. No force-unwrap (`!`) in production code — stricter than Google guide
Force-unwrap is **forbidden** in production code. Use `guard let`, `if let`, or `??` with an appropriate default. The only acceptable use of `!` is in test code (where crashes surface bugs immediately).

This is stricter than the Google Swift Style Guide, which allows force-unwrap with a safety comment. We do not permit that escape hatch in production.

**Why:** Force-unwrap turns a recoverable nil into an unrecoverable crash. Production code should handle unexpected nils gracefully rather than terminating.

### 8. Use `private extension String` for string constants (not bare literals or `enum`)
Define file-scoped string constants as a `private extension String` at the bottom of the file:
```swift
// ✅ Prefer
private extension String {
    static let submitTitle = "Submit"
}
// Usage — shorthand works wherever String is accepted
button.setTitle(.submitTitle)
```
Exception: use an `enum` (not `String` extension) for **closed, finite sets** where the compiler should enforce exhaustiveness — e.g. state type discriminators (`VIEW`, `ACTION`, `EXTERNAL`).

**Why:** The `private extension String` pattern enables the clean `.foo` shorthand at every call site without polluting the global namespace. Enums are reserved for cases where exhaustiveness matters.

### 9. Always use `[weak self]` in closures
Any closure that captures `self` must use `[weak self]`, regardless of whether a retain cycle is obvious. This includes completion handlers, notification callbacks, and any escaping closure.

**Why:** Retain cycles through closures are easy to introduce and hard to spot in review. Requiring `[weak self]` universally eliminates the need to reason about object lifetimes on a case-by-case basis.

### 10. Always capture `[weak self]` explicitly inside `Task` closures
`Task { }` creates its own capture scope and does **not** inherit `[weak self]` from an enclosing closure. Always re-declare it:
```swift
// ❌ Wrong — self is strongly captured inside the Task
doSomething { [weak self] in
    Task {
        self?.handle()  // self is strong here despite outer [weak self]
    }
}

// ✅ Correct
doSomething { [weak self] in
    Task { [weak self] in
        self?.handle()
    }
}
```

**Why:** Forgetting `[weak self]` inside a `Task` creates a retain cycle even when the enclosing closure correctly uses `[weak self]`. The two capture lists are independent.

---

## UI Rules

> Only apply these rules if the diff includes SwiftUI view code.

### 11. Avoid if/else branching on SwiftUI Views
In SwiftUI, views inside `if/else` branches have different structural identities even if they look identical. Instead of branching on views, branch on *properties* (color, size, text, etc.):
```swift
// ❌ Avoid
if isHighlighted {
    Text("Hello").foregroundColor(.red)
} else {
    Text("Hello").foregroundColor(.black)
}

// ✅ Prefer
Text("Hello").foregroundColor(isHighlighted ? .red : .black)
```

Use `@ViewBuilder` when you genuinely need to return different view types from a branch.

**Why:** Branching on views causes animation glitches, performance regressions, and unexpected state resets because SwiftUI treats each branch as a distinct view identity.

Reference: [Demystify SwiftUI — WWDC21](https://developer.apple.com/videos/play/wwdc2021/10022/)

### 12. Use generics (`<Content: View>`) instead of `AnyView`
`AnyView` erases type information and reduces performance. Prefer generics:
```swift
// ❌ Avoid
func wrap(_ view: AnyView) -> some View { ... }

// ✅ Prefer
func wrap<Content: View>(_ view: Content) -> some View { ... }
```

**Why:** Generics preserve type information and let the compiler optimize the view hierarchy.
