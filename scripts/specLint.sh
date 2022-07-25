#!/usr/bin/env bash


# Fetch artifacts from this build
mkdir -p /tmp/$CIRCLE_BUILD_NUMBER
./fetchArtifacts.sh > /tmp/$CIRCLE_BUILD_NUMBER/artifacts.json

ls -la /tmp

# Find the pod zip url
export CIRCLE_CI_ZIP=$(./parseArtifactJson.js /tmp/$CIRCLE_BUILD_NUMBER/artifacts.json)

echo $CIRCLE_CI_ZIP

bundle exec pod spec lint ../PlayerUI.podspec