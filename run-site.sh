#!/bin/bash

# Script to run the Player UI documentation site from the root directory
# This is a wrapper around the bazel command that runs the site

echo "Starting Player UI documentation site..."
echo "This will run the site on http://localhost:3000"

# Run the site using bazel
bazel run //docs/site:dev

# Note: If you want to build the site instead, you can use:
# bazel build //docs/site:site