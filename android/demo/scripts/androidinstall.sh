#!/bin/bash

set -u -e -o pipefail

adb install -r -d android/demo/demo.apk
adb shell monkey -p com.intuit.playerui.android.reference.demo 1