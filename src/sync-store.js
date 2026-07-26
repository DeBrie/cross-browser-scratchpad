export function shouldApplyRemote(local, remote) {
  return Number(remote?.updatedAt ?? 0) > Number(local?.updatedAt ?? 0);
}

export function reconcileNotes(
  localValue,
  remoteValue,
  localLabel = "This browser",
  remoteLabel = "Another browser",
) {
  const local = String(localValue ?? "");
  const remote = String(remoteValue ?? "");
  if (!local.trim()) return { value: remote, merged: false };
  if (!remote.trim() || local === remote)
    return { value: local, merged: false };
  return {
    value: `## From ${localLabel}\n\n${local}\n\n---\n\n## From ${remoteLabel}\n\n${remote}`,
    merged: true,
  };
}
