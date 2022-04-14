# How to Contribute

If you find something interesting you want contribute to the repo, feel free to raise a PR, or open an issue for features you'd like to see added.

## Proposing a Change

For small bug-fixes, documentation updates, or other trivial changes, feel free to jump straight to submitting a pull request. 

If the changes are larger (API design, architecture, etc), [opening an issue](https://github.com/player-ui/player/issues/new/choose) can be helpful to reduce implementation churn as we hash out the design.

## Building and Testing Locally

For speed and consistency, this repo leverages `bazel` as it's main build tool.

After forking the repo, run builds using:

```bash
bazel build //...
```

Tests can also be ran using:

```bash
bazel test //...
```
Check out the [bazel](https://bazel.build/) docs for more info.


## Submitting a Pull Request

Please ensure that any new features have sufficient tests, code coverage, and documentation. 

When you're ready, submit a new pull request to the `main` branch and the team will be notified of the new requested changes. We'll do our best to respond as soon as we can. 

---

Inspired by react's [How to Contribute](https://reactjs.org/docs/how-to-contribute.html)