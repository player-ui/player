#!/bin/bash

set -u -e -o pipefail

# Setup runfiles library
if [[ ! -d "${RUNFILES_DIR:-/dev/null}" && ! -f "${RUNFILES_MANIFEST_FILE:-/dev/null}" ]]; then
    if [[ -f "$0.runfiles_manifest" ]]; then
        export RUNFILES_MANIFEST_FILE="$0.runfiles_manifest"
    elif [[ -f "$0.runfiles/MANIFEST" ]]; then
        export RUNFILES_MANIFEST_FILE="$0.runfiles/MANIFEST"
    elif [[ -d "$0.runfiles" ]]; then
        export RUNFILES_DIR="$0.runfiles"
    fi
fi

if [[ -f "${RUNFILES_DIR:-/dev/null}/bazel_tools/tools/bash/runfiles/runfiles.bash" ]]; then
    source "${RUNFILES_DIR}/bazel_tools/tools/bash/runfiles/runfiles.bash"
elif [[ -f "${RUNFILES_MANIFEST_FILE:-/dev/null}" ]]; then
    source "$(grep -m1 "^bazel_tools/tools/bash/runfiles/runfiles.bash " \
        "$RUNFILES_MANIFEST_FILE" | cut -d ' ' -f 2-)"
fi

# Install app to test
adb install android/demo/demo.apk

# Install test app
adb install android/demo/demo_test_app.apk

DEVICE_API_LEVEL=$(adb shell getprop ro.build.version.sdk)

FORCE_QUERYABLE_OPTION=""
if [[ $DEVICE_API_LEVEL -ge 30 ]]; then
   FORCE_QUERYABLE_OPTION="--force-queryable"
fi

# Use runfiles to access the APK files provided as data dependencies
ORCHESTRATOR_APK="${RUNFILES_DIR}/+_repo_rules2+android_test_orchestrator_apk/file/downloaded"
SERVICES_APK="${RUNFILES_DIR}/+_repo_rules2+android_test_services_apk/file/downloaded"

cp "$ORCHESTRATOR_APK" orchestrator.apk
cp "$SERVICES_APK" test_services.apk


# Install the test orchestrator.
adb install $FORCE_QUERYABLE_OPTION -r orchestrator.apk

# Install test services.
adb install $FORCE_QUERYABLE_OPTION -r test_services.apk

adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

# Inspiration: https://gist.github.com/swenson/f797ffea7e243d889406#file-runtests-sh

# adb shell throws away the return value, so we have to hack do some magic
# see https://code.google.com/p/android/issues/detail?id=3254

adb logcat -c &&
python3 - <<END
import os
import re
import subprocess as sp
import sys
import threading
import time

done = False

def update():
  while not done:
    time.sleep(5)
    print("Running...")

# Start idling thread to prevent CI from killing the process for inactivity
t = threading.Thread(target=update)
t.daemon = True
t.start()

# Wait for device and launch tests with Androidx test orchestrator
def run():
  os.system('adb wait-for-device')
  p = sp.Popen("""adb shell 'CLASSPATH=\$(pm path androidx.test.services) app_process / \
               androidx.test.services.shellexecutor.ShellMain am instrument -w -e clearPackageData true \
               -e targetInstrumentation com.intuit.playerui.android.reference.demo.test/androidx.test.runner.AndroidJUnitRunner \
               androidx.test.orchestrator/.AndroidTestOrchestrator'""",
               shell=True, stdout=sp.PIPE, stderr=sp.PIPE, stdin=sp.PIPE, text=True)

  return p.communicate()

# Search for JUnit success log
success = re.compile(r'OK \(\d+ test(s)?\)')

stdout, stderr = run()
done = True
print(stderr)
print(stdout)

if success.search(stderr + stdout):
  sys.exit(0)
else:
  sys.exit(1) # make sure we fail if the tests fail
END
RETVAL=$?
adb logcat -d '*:E'

exit $RETVAL
