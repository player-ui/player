#!/bin/bash

set -u -e -o pipefail

adb install android/demo/demo.apk
adb install android/demo/demo_test_app.apk

adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

# adb shell throws away the return value, so we have to hack do some magic
# see https://code.google.com/p/android/issues/detail?id=3254

adb logcat -c &&
python - <<END
import os
import re
import subprocess as sp
import sys
import threading
import time
done = False
def update():
  # prevent CI from killing the process for inactivity
  while not done:
    time.sleep(5)
    print "Running..."
t = threading.Thread(target=update)
t.dameon = True
t.start()
def run():
  os.system('adb wait-for-device')
  p = sp.Popen('adb shell am instrument -w com.intuit.player.android.reference.demo.test/androidx.test.runner.AndroidJUnitRunner',
               shell=True, stdout=sp.PIPE, stderr=sp.PIPE, stdin=sp.PIPE)
  return p.communicate()
success = re.compile(r'OK \(\d+ tests\)')
stdout, stderr = run()
done = True
print stderr
print stdout
if success.search(stderr + stdout):
  sys.exit(0)
else:
  sys.exit(1) # make sure we fail if the tests fail
END
RETVAL=$?
adb logcat -d '*:E'

exit $RETVAL
