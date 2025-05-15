#!/bin/bash

current_branch=$(git symbolic-ref --short HEAD)

if [[ $current_branch != "develop" && ! $current_branch =~ ^release/[0-9]+\.[0-9]+\.[0-9]+(-rc)?$ ]]; then
  echo "The current Git branch ($current_branch) is not 'develop' or in the format 'release/X.Y.Z' or 'release/X.Y.Z-rc'."
  exit 1
fi

# Check if the parameter is provided
read -p "React native release version: " version

# Check if the version number matches the semver format
if ! [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-rc)?$ ]]; then
  echo "The release version number does not match the semver format (X.Y.Z or X.Y.Z-rc)."
  exit 1
fi


branch_name="release/$version"
git branch $branch_name
git checkout $branch_name

echo "Branch $branch_name has been created."

package_json="package.json"
current_version=$(grep -Eo '"target-version": "[^"]+"' $package_json | cut -d '"' -f 4)
sed -i '' "s/\"target-version\": \".*\"/\"target-version\": \"$version\"/" $package_json

echo "Bump SDK version from $current_version to $version."

git add $package_json

android_gradle="android/build.gradle"
ios_podspec="MindboxSdk.podspec"

read -p "Android SDK version: " android_sdk_version

# Check if the version number matches the semver format
if ! [[ $android_sdk_version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-rc)?$ ]]; then
  echo "The Android SDK version number does not match the semver format (X.Y.Z or X.Y.Z-rc)."
  exit 1
fi

sed -i '' "s/  api 'cloud.mindbox:mobile-sdk:.*/  api 'cloud.mindbox:mobile-sdk:${android_sdk_version}'/" "$android_gradle"
echo "Bump $android_gradle to $android_sdk_version"

read -p "iOS SDK version: " ios_sdk_version

# Check if the version number matches the semver format
if ! [[ $ios_sdk_version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-rc)?$ ]]; then
  echo "The iOS SDK version number does not match the semver format (X.Y.Z or X.Y.Z-rc)."
  exit 1
fi

sed -i '' "s/  s.dependency \"Mindbox\", .*/  s.dependency \"Mindbox\", \"${ios_sdk_version}\"/" "$ios_podspec"
sed -i '' "s/  s.dependency \"MindboxNotifications\", .*/  s.dependency \"MindboxNotifications\", \"${ios_sdk_version}\"/" "$ios_podspec"
echo "Bump $ios_podspec to $ios_sdk_version"

git add "$android_gradle" "$ios_podspec"

changelog="CHANGELOG.md"

awk -v android="$android_sdk_version" -v ios="$ios_sdk_version" 'NR==3{print "## [Unreleased]\n\n ### Changes\n - Upgrade Android SDK dependency to v"android"\n - Upgrade iOS SDK dependency to v"ios"\n"}1' "$changelog" > "${changelog}.tmp" && mv "${changelog}.tmp" "$changelog"

echo "Insert Unreleased section to $changelog"

git add "$changelog"

echo "Branch $branch_name has been created."

git commit -m "Bump SDK version to $version" --no-verify
