# Owned original reference tests

These3 original test files belong to notebook because their imported source modules match this repository’s exact captured blobs. Current implementation files and assertions are unchanged. Import and proven fixture/resource URL locators are ported to this repository; no cross-repository private source imports or compatibility path shims are added.

Mechanical source-test baseline `c03dcda764515e403f41f427cee391e1ce68ad6b`; merge `5c6a4ff4aae03f5f98163b7505ad436ae8678117`. Private phase44 preserves earlier paths, explicit copy boundaries and source-to-result commit/ref maps. The locator-normalized complete AST is unchanged, not just selected assertions.

Run `npm run test:reference`. This is Node unit/reference qualification of the retained domain modules, not browser/worker/kernel/renderer/storage/authentication/human-agent acceptance. Current app hosting/build and shared-operation integration gates remain separately open.

Captured baseline and current port: 6 pass, 0 fail, 0 cancelled, 0 skipped across 6 reported Node subtests. Top-level assertion-only files count as one reported Node subtest, not individual assertions.
