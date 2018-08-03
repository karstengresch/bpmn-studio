#!/bin/bash

_VERSION="0.0.1"

############
# This Script builds a clean setup of the BPMN - Studio.
# Keep in mind that your npm cache will be cleaned.
############

# Remove the node modules folder
echo "Removing Node Modules...."
rm -rf node_modules/

# Remove the package-lock file if it exists.
if [[ -e "$(pwd)/package-lock.json" ]]; then
  echo "Removing package lock file..."
  rm $(pwd)/package-lock.json
fi

# Clear the npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Install Node Modules
echo "Installing node modules..."
npm install --no-package-lock

# If npm install failed, we can abort the script execution since
# the build process would fail anyways.
if [[ $? -ne 0 ]]; then
  echo "NPM Install Failed. Exiting..."
  exit 1;
fi

# Build
echo "Building..."
npm run build
