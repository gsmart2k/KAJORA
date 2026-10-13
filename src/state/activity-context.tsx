import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { readStoredJson, writeStoredJson } from '@/lib/storage';
import { useAuth } from '@/state/auth-context';
import { useKajora } from '@/state/kajora-context';
import { groupActivity } from '@/lib/group-activity';

type ReadState = Record<string, string>;
type Activity = { unread: Record<string, number>; newGroups: string[]; total: number; markRead: (id: string) => void };
const Context = createContext<Activity>({ unread: {}, newGroups: [], total: 0, markRead: () => {} });

export function ActivityProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const { groups, messagesByGroup, requestsByIntent } = useKajora();
  const [read, setRead] = useState<ReadState>({});
  const [ready, setReady] = useState(false);
  const key = `kajora.read.v1.${session?.userId ?? 'signed-out'}`;
  useEffect(() => {
    let active = true;
    void readStoredJson<ReadState>(key).then((stored) => {
      if (active) { setRead(stored ?? {}); setReady(true); }
    });
    return () => { active = false; };
  }, [key]);
  useEffect(() => {
    if (ready && session) void writeStoredJson(key, read).catch(() => {});
  }, [key, read, ready, session]);
  const markRead = useCallback((id: string) => {
    if (!ready) return;
    // Use the last loaded server timestamp, never the device clock.
    const latest = (messagesByGroup[id] ?? []).reduce((last, message) =>
      message.createdAt && message.createdAt > last ? message.createdAt : last, '');
    setRead((current) => current[id] !== undefined && current[id] >= latest ? current : { ...current, [id]: latest });
  }, [messagesByGroup, ready]);
  const value = useMemo(() => {
    const { unread, newGroups, activeCount } = groupActivity(groups, messagesByGroup, read, ready);
    const total = activeCount
      + Object.values(requestsByIntent).reduce((sum, requests) => sum + requests.length, 0);
    return { unread, newGroups, total, markRead };
  }, [groups, markRead, messagesByGroup, read, ready, requestsByIntent]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useActivity = () => useContext(Context);
