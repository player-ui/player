#!/usr/bin/env bash


# Fetch artifacts from this build
./fetchArtifacts.sh > /tmp/$CIRCLE_BUILD_NUMBER/artifacts.json

# Find the pod zip url
export CIRCLE_CI_ZIP=$(./parseArtifactJson.js /tmp/$CIRCLE_BUILD_NUMER/artifacts.json)


bundle exec pod spec lint PlayerUI.podspec