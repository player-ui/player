# First Time Contributors
This will assume that this will be your first time contributing to an open source project.

## Roadmap: 

- Forking Repo and creating a PR

## Forking the repo
The git workflow for forking is slightly different than the normal branch workflow. Rather than cloning the main repo and pushing a new branch, each person works off of their own fork and pushes their own branches there. This helps limit the need (especially for non-team members) to give out access rights to the repo to push up a branch, and also helps keep the main repo clean from stale branches.

The easiest way to maintain your own fork is via the GitHub CLI, which you can easily install through Homebrew. After you've gone through the intial setup, the CLI gives us a few powerful commands that do most of the legwork for us when working with a fork. I'll start by cloning the repo that'd I'd like to contribute to:

```
git clone https://github.com/player-ui/player.git
``````

From there, change into the repo and leverage the first CLI command:

```
cd player
gh repo fork
```

This command creates the fork for us from the repo we've cloned, sets up a new remote to publish to, and renames the previous remote so we can easily reference it:


```
? Would you like to add a remote for the fork? Yes
✓ Added remote origin


$ git remote -v
origin  https://github.intuit.com/shamm/onboarding.git (fetch)
origin  https://github.intuit.com/shamm/onboarding.git (push)
upstream    https://github.intuit.com/player-team/onboarding.git (fetch)
upstream    https://github.intuit.com/player-team/onboarding.git (push)
```

From here, you can create a new branch

```
git checkout -b my-new-feature
```

The -u here is important because it allows any future push-es to this repo to always use origin as the remote that it wants to push to.

When you're ready to submit a Pull Request, there's a great CLI command for that one too:

```
gh pr create
```
This will guide you through writing your PR and creating it for the repo. You can also quickly monitor the status of the CI checks with:

```
gh pr checks
```
This will show all checks that have run on your PR and if they have passed or failed, and additionally add any links to quickly jump to the checks to debug.

Lastly, to keep the repo in sync, we can leverage the upstream remote that was created for us at the start:

```
# Make sure we're on master branch first
git checkout master
git pull upstream master
git push origin master
``````

This allows us to quickly take everything that the main repo has on master and push it back up to our fork. Typically you need to make sure you're doing this anytime you want to contribute to the repo to ensure you don't have a stale branch with outdated files.

You are able to create forks and PR's through [github as well](https://github.com/player-ui/player).



