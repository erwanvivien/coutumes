fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android bump_version

```sh
[bundle exec] fastlane android bump_version
```

Read the highest versionCode live on Play across all tracks, bump past it, and persist to app.config.js

### android release

```sh
[bundle exec] fastlane android release
```

Build a signed release AAB and upload it to Play Console. Usage: `fastlane android release track:internal`

## iOS

### ios bump_version

```sh
[bundle exec] fastlane ios bump_version
```

Read the highest build number on TestFlight (or App Store), bump past it, and persist to app.config.js

### ios release

```sh
[bundle exec] fastlane ios release
```

Build a signed release IPA and upload it to TestFlight. Usage: `fastlane ios release app_store:true`

### ios push_metadata

```sh
[bundle exec] fastlane ios push_metadata
```

Re-push metadata/screenshots for the App Store version already created by `release app_store:true`, without rebuilding or re-uploading the binary

---

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The README.md is auto-generated, do not modify by hand.
