#!/bin/bash

set -u -e -o pipefail

adb install android/demo/demo.apk
adb install android/demo/demo_test_app.apk

adb shell am instrument -w com.intuit.player.android.reference.demo.test/androidx.test.runner.AndroidJUnitRunner
