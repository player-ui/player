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

## General Rules

### 1. Function length ≤ 50 lines
Functions should be 50 lines or fewer. If a function exceeds this, suggest extracting logical chunks into named helpers.

**Why:** Long functions are harder to read, test, and maintain. Shorter functions with clear names make the call site self-documenting.

### 2. Avoid nested conditionals
Nested conditionals (`if`, `guard`, `switch`, `for`, `while`, `repeat`) are a bad pattern in iOS code. Prefer:
- `guard`/`else` to exit early instead of nesting
- Extracting conditions into well-named boolean variables or functions
- AI-assisted rewrites when nesting is deep

Flag any conditional nested inside another conditional.

**Why:** Deep nesting hides the happy path, increases cognitive load, and makes it easy to miss edge cases. Early exits keep logic linear and readable.

### 3. Use async/await instead of callbacks
All async code should use Swift's `async/await`. Callbacks (completion handlers, closures passed as the last argument to async operations) are the old pattern and should not appear in new code.

**Why:** Callbacks invert control flow and make error handling inconsistent. `async/await` reads top-to-bottom, composes cleanly with `try`, and eliminates callback pyramids.

### 4. Clear logic path — name functions after intent, not implementation
Function names should describe *what* the function achieves (its intention), not *how* it works technically. For example, a function that registers a hook to make an interaction fail should be called `failInteraction()`, not `registerFailureHook()`.

Also: add comments on functions you can't rename (e.g. protocol requirements, library callbacks) explaining their intent.

**Why:** Implementation details change; intent rarely does. Names tied to mechanics rot as the code evolves and obscure the purpose at the call site.

### 5. Public methods before private methods
`public` and `open` methods should appear near the top of a type, just below `init`.

Correct order within a type:
1. `init`
2. `public`/`open` methods
3. `internal` methods
4. `private` methods

**Why:** Public APIs are hard to change post-release. Placing them at the top makes the contract immediately visible to reviewers without scrolling past implementation details.

### 6. Doc comments on all public/open declarations
Every `public` or `open` function, property, type, and initializer must have a doc comment (`///`). This includes anything a consumer of the library will interact with directly.

**Why:** Doc comments are the contract between the library and its callers. They surface in Xcode "Quick help" and are the first place a consumer looks before reading source.

### 7. Use shorthand `guard/if let foo` (not `guard/if let foo = foo`)
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

### 8. No force-unwrap (`!`) in production code
Force-unwrap crashes the app if the value is nil. Use `guard let`, `if let`, or `??` with an appropriate default instead. The only acceptable use of `!` is in test code (where crashes surface bugs immediately).

**Why:** Force-unwrap turns a recoverable nil into an unrecoverable crash. Production code should handle unexpected nils gracefully rather than terminating.

### 9. Boolean variables should start with `is` (preferred), `has`, `should`, `can`, or similar
Boolean variables and properties should read as a yes/no question. E.g. `isEnabled`, `hasLoaded`, `shouldRetry`. Avoid names like `enabled`, `loaded`, `retry`.

**Why:** Boolean names that read as questions make conditionals (`if isEnabled`) self-explanatory. Noun/verb names (`if enabled`, `if retry`) are ambiguous and harder to parse at a glance.

### 10. Use `private extension String` for string constants (not bare string literals or `enum`)
Define file-scoped string constants as a `private extension String` at the bottom of the file:
```swift
// ✅ Prefer
private extension String {
    static let submitTitle = "Submit"
}
// Usage — shorthand works wherever String is accepted
button.setTitle(.submitTitle)
```
Exception: use an `enum` (not `String` extension) for **closed, finite sets** where the compiler should enforce exhaustiveness — e.g. state type discriminators (`VIEW`, `ACTION`, `EXTERNAL`). Those are better modeled as enums so the compiler catches missing cases.

**Why:** The `private extension String` pattern enables the clean `.foo` shorthand at every call site without polluting the global namespace. Enums are reserved for cases where exhaustiveness matters — mixing the two degrades the compiler's ability to catch missing cases.

### 11. Avoid abbreviations that obscure intent
Variable and parameter names should be clear to a reader unfamiliar with the codebase. Avoid:
- Programming jargon new contributors may not know (e.g. `noop`)
- Acronyms that collide with common abbreviations (e.g. `CI` → "Continuous Integration")
- Single-letter or heavily truncated names outside of trivial loop indices

Prefer descriptive middle-ground names: `placeholderBeacon` over `noopBeacon`, `error` over `e`.

**Why:** Abbreviations that seem obvious to the author are often opaque to reviewers and future maintainers. Colliding acronyms introduce a second source of confusion on top of the original ambiguity.

### 12. Always use `[weak self]` in closures
Any closure that captures `self` must use `[weak self]`, regardless of whether a retain cycle is obvious. This includes completion handlers, notification callbacks, and any escaping closure.

**Why:** Retain cycles through closures are easy to introduce and hard to spot in review. Requiring `[weak self]` universally eliminates the need to reason about object lifetimes on a case-by-case basis.

### 13. Always capture `[weak self]` explicitly inside `Task` closures
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

### 15. Avoid if/else branching on SwiftUI Views
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

### 16. Use generics (`<T: View>`) instead of `AnyView`
`AnyView` erases type information and reduces performance. Prefer generics:
```swift
// ❌ Avoid
func wrap(_ view: AnyView) -> some View { ... }

// ✅ Prefer
func wrap<Content: View>(_ view: Content) -> some View { ... }
```

**Why:** Generics preserve type information and let the compiler optimize the view hierarchy.
