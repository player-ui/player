# Android Demo App

# Local Development with Android Studio

This will be a getting started guide on contributing to Player on Android.

It's been tested on Andriod Studio Chipmunk(2021.2.1) and Android Studio Giraffe(2022.3.1). Although other versions may work as well.

Assuming you have read the [requirements on the root contributing guide](https://github.com/player-ui/player/blob/main/CONTRIBUTING.md).

1. Once you have Android Studio installed, you will need to go to tools->SDK Manager->SDK Platforms.
   1.  Make sure you have **only** the following SDK installed: Android API 32.
   *If you are using Android Giraffe, you may need to click on show package details and it will be under Android12L. (Android SDK Platrform 32)*
2. The next step will be to make sure you have the right SDK Build tools and NDK. Click on the SDK Tools tab and make sure you have the following clicked:
   1. 30.0.3
   2. 21.4.7075529
3. You will now need to create an android device for emulation. Click on Device Manager and do create new device.
   1. You will need to download an Sv2.
   2. You should now be able to click the play button to start up your device.
4. You should now be able to run  `bazel build //android/demo`
5. The following are different ways to run the apk on your device. If the following methods do not work, we can manually drop the APK that gets generated from the build command to the emulated android device.

```
bazel run //android:demo
```

```
bazel mobile-install //android/demo
```

If those command do not run, you can find the apk in `bazelbin/android/demo/install.runfiles/player/android/demo/demo.apk` and drag this apk onto the emulated device. This will install it. ( you may need to swipe on the device to see the application)



## Troubleshooting Guide



### 1. If you are seeing issues around Toolchain and sdk
Check your SDK and NDK versions in SDK Manager in Android Studio. As well as your `ANDROID_HOME` and `ANDROID_NDK_HOME` in your bash or zsh profiles to make sure they are properly set.


### 2. If you are seeing Errors around babel:
```
could not find dependency @babel/helper-string-parser of @babel.plugin-transform-react-jsx/noode_modules/@babel/types
Error: Analysis of target '//android/demo:demo' failed; build aborted.
```
Make sure you have done a `bundle install`



### 3. Error Message :
```
 ResourceProcessorBusyBox failed: error executing command bazel-out/darwin-opt-exec-2B5CBBC6/bin/external/bazel_tools/src/tools/android/java/com/google/devtools/build/android/ResourceProcessorBusyBox --tool LINK_STATIC_LIBRARY -- --aapt2 ... (remaining 17 arguments skipped)
```
**Possible Solution:** Check your SDK and NDK versions in SDK Manager in Android Studio. As well as your `ANDROID_HOME` and `ANDROID_NDK_HOME` in your bash or zsh profiles to make sure they are properly set.

You can also do `ls $ANDROID_HOME/platforms` and make sure that there are no versions higher than 30.
