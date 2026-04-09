Update the vendored bolt-js tarball to the latest commit on the `main` branch.

## Steps

1. If `.bolt-js-build/` exists, `cd` into it and run `git pull`. Otherwise, clone bolt-js:
   ```
   git clone --depth 1 https://github.com/slackapi/bolt-js.git .bolt-js-build
   ```

2. `cd .bolt-js-build` and install dependencies, then pack:
   ```
   npm install && npm pack
   ```

3. Remove any old `.tgz` files from `vendor/` and copy the new one in:
   ```
   rm -f ../vendor/slack-bolt-*.tgz
   cp slack-bolt-*.tgz ../vendor/
   ```

4. Update the tarball filename in `package.json` for both apps (`claude-agent-sdk/package.json`, `openai-agents-sdk/package.json`). Replace the existing `"@slack/bolt": "file:../vendor/slack-bolt-*.tgz"` value with the new filename.

5. Run `npm install` in both app directories to update `package-lock.json`:
   ```
   cd ../claude-agent-sdk && npm install
   cd ../openai-agents-sdk && npm install
   ```

6. Clean up the build directory:
   ```
   cd .. && rm -rf .bolt-js-build
   ```

7. Report the old version vs new version to the user. Do NOT commit — let the user review first.
