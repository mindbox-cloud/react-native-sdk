#!/bin/bash

# Check if the parameter is provided
if [ $# -eq 0 ]; then
  echo "Please provide the release version number as a parameter."
  exit 1
fi

# Check if the version number matches the semver format
if ! [[ $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+(-rc)?$ ]]; then
  echo "The release version number does not match the semver format (X.Y.Z or X.Y.Z-rc)."
  exit 1
fi

# Check the current Git branch
current_branch=$(git symbolic-ref --short HEAD)

if [[ $current_branch != "develop" && ! $current_branch =~ ^release/[0-9]+\.[0-9]+\.[0-9]+(-rc)?$ ]]; then
  echo "The current Git branch ($current_branch) is not 'develop' or in the format 'release/X.Y.Z' or 'release/X.Y.Z-rc'."
  exit 1
fi

# Create a branch with the version name
version=$1
branch_name="release/$version"
git branch $branch_name
git checkout $branch_name

package_json="package.json"
current_version=$(grep -Eo '"target-version": "[^"]+"' $package_json | cut -d '"' -f 4)
sed -i '' "s/\"target-version\": \".*\"/\"target-version\": \"$version\"/" $package_json

echo "Bump SDK version from $current_version to $version."

git add $package_json
git commit -m "Bump SDK version to $version" --no-verify

echo "Branch $branch_name has been created."
