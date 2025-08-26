#!/usr/bin/env bash

set -eo pipefail # exit immediately if any command fails.

# Defer installing, creating, and booting an emulator unless required
EMULATOR_IMG="system-images;android-33;default;x86_64"
EMULATOR_READY=$([ "$(adb devices | tail -n +2 | grep -w "device" | wc -l)" -gt 0 ] && echo "true" || echo "false")

create_and_wait_for_emulator() {
  if [ "$EMULATOR_READY" != "true" ]; then
    echo "Creating emulator..."
    sdkmanager "$EMULATOR_IMG"
    echo "no" | avdmanager --verbose create avd -n test -k "$EMULATOR_IMG" -g default
    nohup emulator -avd test -delay-adb -verbose -gpu swiftshader_indirect -no-snapshot -noaudio -no-boot-anim &
    circle-android wait-for-boot
    echo "Emulator ready..."
    EMULATOR_READY=true
  else
    echo "Emulator already ready..."
  fi
}

# Only need to test for cached tests if the emulator isn't setup
if [ "$EMULATOR_READY" != "true" ]; then
  set +e
  echo "Checking if '$@' is cached..."
  # Only check if tests are relevant, cached means it will pass
  bash -c 'bazel test --config=ci "$@" &> /dev/null' bash "$@"
  # 0 exit code means the test passed
  if [ $? -eq 0 ]; then
    echo "'$@' was cached - no emulator required"
  else
    set -e
    create_and_wait_for_emulator
  fi
  set -e
fi

# Trigger test w/ logs & -e to propagate failure
bazel test --config=ci "$@"
