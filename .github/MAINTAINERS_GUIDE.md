# Maintainers Guide

## Using Bolt Framework Development Builds

This repo vendors a pre-release build of [`@slack/bolt`](https://github.com/slackapi/bolt-js) from the `main` branch. The `.tgz` tarball lives in `vendor/` and is referenced by each implementation's `package.json`.

Two [Claude Code slash commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands) are available to manage this:

### `/vendor-bolt` — Update the vendored tarball

Clones bolt-js `main`, runs `npm pack`, replaces the tarball in `vendor/`, updates all `package.json` references, and regenerates lock files. Use this to pull in the latest unreleased bolt-js changes.

### `/unvendor-bolt` — Switch to the published npm package

Removes the `vendor/` directory, replaces the tarball reference in all `package.json` files with the latest `@slack/bolt` version from npm, regenerates lock files, and re-enables Dependabot updates. Use this when the vendored changes have been released and the repo should track the public package.

Both commands leave changes uncommitted for review.
