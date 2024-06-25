#!/bin/bash

if [ -d $ANDROID_HOME ]
then
    echo "Directory $ANDROID_HOME already exists so we're skipping the install. If you'd like to install fresh tools, edit this script to invalidate the CI cache."
    exit 0
fi

accept_all_android_licenses() {
  ANDROID_LICENSES="$ANDROID_HOME/licenses"
  if [ ! -d $ANDROID_LICENSES ]; then
    echo "Android licenses directory doesn't exist, creating one..."
    mkdir -p $ANDROID_LICENSES
  fi

  accept_license_of android-googletv-license 601085b94cd77f0b54ff86406957099ebe79c4d6
  accept_license_of android-sdk-license 8933bad161af4178b1185d1a37fbf41ea5269c55
  accept_license_of android-sdk-license d56f5187479451eabf01fb78af6dfcb131a6481e
  accept_license_of android-sdk-license 24333f8a63b6825ea9c5514f83c2829b004d1fee
  accept_license_of android-sdk-preview-license 84831b9409646a918e30573bab4c9c91346d8abd
  accept_license_of android-sdk-preview-license 504667f4c0de7af1a06de9f4b1727b84351f2910
  accept_license_of google-gdk-license 33b6a2b64607f11b759f320ef9dff4ae5c47d97a
  accept_license_of intel-android-extra-license d975f751698a77b662f1254ddbeed3901e976f5a
}

accept_license_of() {
  local license=$1
  local content=$2
  local file=$ANDROID_LICENSES/$license
  if [ -f $file ]; then
    if grep -q "^$content$" $file; then
      echo "$license: $content has been accepted already"
    else
      echo "Accepting $license: $content ..."
      echo -e $content >> $file
    fi
  else
    echo "Accepting $license: $content ..."
    echo -e $content > $file
  fi
}

ANDROID_SDK_VERSION=4333796
ANDROID_VERSION=33
ANDROID_BUILD_TOOLS_VERSION=33.0.1
ANDROID_NDK_VERSION=21.4.7075529

mkdir -p $ANDROID_HOME
cd $ANDROID_HOME
curl https://dl.google.com/android/repository/sdk-tools-darwin-$ANDROID_SDK_VERSION.zip -o sdk-tools.zip

unzip sdk-tools.zip

SDK_MANAGER=$ANDROID_HOME/tools/bin/sdkmanager

yes | $SDK_MANAGER --licenses
yes | $SDK_MANAGER --update

$SDK_MANAGER "ndk;${ANDROID_NDK_VERSION}"
