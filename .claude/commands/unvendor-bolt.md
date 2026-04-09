Switch from the vendored bolt-js tarball to the latest published `@slack/bolt` package on npm.

## Steps

1. Look up the latest published version of `@slack/bolt`:
   ```
   npm view @slack/bolt version
   ```

2. Delete the `vendor/` directory:
   ```
   rm -rf vendor
   ```

3. In both `package.json` files (`claude-agent-sdk/package.json`, `openai-agents-sdk/package.json`), replace the `"@slack/bolt": "file:../vendor/slack-bolt-*.tgz"` value with `"@slack/bolt": "^<version>"` using the version from step 1.

4. Run `npm install` in both app directories to update `package-lock.json`:
   ```
   cd claude-agent-sdk && npm install
   cd ../openai-agents-sdk && npm install
   ```

5. If `.github/dependabot.yml` has an `ignore` rule for `@slack/bolt`, remove it so Dependabot can manage updates.

6. Update `README.md` — replace the "Local Development" section that describes vendored bolt with:
   ```
   ## Local Development

   This repo uses [`@slack/bolt`](https://www.npmjs.com/package/@slack/bolt) from npm.
   ```

7. Report the version change to the user. Do NOT commit — let the user review first.
