import assert from 'node:assert/strict';
import test from 'node:test';
import { requestFirefoxSyncConsent, syncDataTypes } from '../src/firefox-consent.js';

test('does not request Firefox data consent in browsers without the feature', async () => {
  assert.equal(await requestFirefoxSyncConsent({}), true);
});

test('requests the declared optional data types before enabling sync in Firefox', async () => {
  let request;
  const result = await requestFirefoxSyncConsent({
    permissions: {
      getAll: async () => ({ data_collection: [] }),
      request: async (options) => { request = options; return true; },
    },
  });
  assert.equal(result, true);
  assert.deepEqual(request, { data_collection: syncDataTypes });
});
