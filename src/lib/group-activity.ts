import type { BuyingGroup, GroupMessage } from '@/types';

export function groupActivity(groups: BuyingGroup[], messages: Record<string, GroupMessage[]>, read: Record<string, string>, ready: boolean) {
  const unread = Object.fromEntries(groups.map((group) => [group.id, ready
    ? (messages[group.id] ?? []).filter((message) => !message.mine && message.createdAt && message.createdAt > (read[group.id] ?? '')).length : 0]));
  const newGroups = ready ? groups.filter((group) => read[group.id] === undefined).map((group) => group.id) : [];
  const activeCount = groups.filter((group) => unread[group.id] > 0 || newGroups.includes(group.id)).length;
  return { unread, newGroups, activeCount };
}
