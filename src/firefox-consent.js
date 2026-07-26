export const syncDataTypes = [
  "personallyIdentifyingInfo",
  "authenticationInfo",
  "personalCommunications",
  "browsingActivity",
];

export async function requestFirefoxSyncConsent(browserApi) {
  if (!browserApi?.permissions?.getAll || !browserApi.permissions.request)
    return true;
  const permissions = await browserApi.permissions.getAll();
  if (!("data_collection" in permissions)) return true;
  return browserApi.permissions.request({ data_collection: syncDataTypes });
}
