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

## Requirements

There are a few requirements in order for you to get your bazel build to run.

 ### You will need to have the following installed:

```
brew install mvn
brew install ruby
gem install bundler

```

###  android studio and java.

To do this, you should install [Android studio](https://developer.android.com/studio/?gclid=Cj0KCQjw0oyYBhDGARIsAMZEuMuf8iTh2xbMsrPY60dy8oTIJdeDm4Wi5BQdOx_b95-8DQLY3BjI5CUaApftEALw_wcB&gclsrc=aw.ds)
Once android studio is installed, create a new project, and at the topbar; navigate to tools -> SDK manager.
Preferences will open up ( APPEARANCE &BEHAVIOR > STSTEM SETTINGS > ANDROID SDK), click on SDK Tools tab.
At the time of writing (8/19/2022), the following SDK and NDK build are what works.
Android SDK 30.0.2, 29.0.2
Android NDK 21.4.7075529

Click save and then you will need to add some env variables.
you will need to set up and configure a java SDK and android SDK, including setting up environmental variables in your .zshrc (if you are using an intel mac on 12.3 Monterey)

```
export ANDROID_HOME=$HOME/Library/Android/sdk

export JAVA_HOME=$HOME/Library/Java/JavaVirtualMachines/adoptopenjdk-11.jdk/Contents/Home

export ANDROID_NDK_HOME=$HOME/Library/Android/sdk/ndk/21.4.7075529
```

### xcode

You will also need to make sure you have xcode installed.
A confirmed version of xcode that works is 13.2.1. To download an older version of xcode,
https://developer.apple.com/download/more/

you will need to sign in with an appleID to download a specific version. Although the latest version of xcode may still work, 13.2.1 is just a confirmed working version.

### running

you should now be able to do a `baze build //...`
You may want to do a `bazel clean --expunge` before building if youre build has failed before.



## Submitting a Pull Request

Please ensure that any new features have sufficient tests, code coverage, and documentation. 

When you're ready, submit a new pull request to the `main` branch and the team will be notified of the new requested changes. We'll do our best to respond as soon as we can. 

---

Inspired by react's [How to Contribute](https://reactjs.org/docs/how-to-contribute.html)