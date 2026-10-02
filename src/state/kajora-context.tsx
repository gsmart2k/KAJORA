import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { readStoredJson, writeStoredJson } from '@/lib/storage';
import {
  createRemoteIntent,
  expressRemoteInterest,
  fetchInterestedPostIds,
  fetchIntents,
  fetchRemoteGroups,
  fetchRemoteMessages,
  sendRemoteMessage,
  withdrawRemoteInterest,
} from '@/lib/supabase-rest';
import { useAuth } from '@/state/auth-context';
import type { BuyingGroup, CreateIntentInput, GroupMessage, Intent, IntentStatus } from '@/types';

const DEMO_DATA_KEY = 'kajora.demo.data.v3';

type DataState = {
  groups: BuyingGroup[];
  intents: Intent[];
  interestedIds: Set<string>;
  messagesByGroup: Record<string, GroupMessage[]>;
};

type StoredDemoData = Omit<DataState, 'interestedIds'> & { interestedIds: string[] };

type KajoraContextValue = DataState & {
  error: string;
  isLoading: boolean;
  createIntent: (input: CreateIntentInput) => Promise<string>;
  expressInterest: (id: string) => Promise<string | null>;
  withdrawInterest: (id: string) => Promise<void>;
  findIntent: (id: string) => Intent | undefined;
  findGroup: (id: string) => BuyingGroup | undefined;
  getGroupForIntent: (intentId: string) => BuyingGroup | undefined;
  loadGroupMessages: (groupId: string) => Promise<void>;
  sendGroupMessage: (groupId: string, body: string) => Promise<string | null>;
  refresh: () => Promise<void>;
};

const demoInitialState: DataState = {
  groups: [],
  intents: [],
  interestedIds: new Set(),
  messagesByGroup: {},
};

const emptyRemoteState: DataState = {
  groups: [],
  intents: [],
  interestedIds: new Set(),
  messagesByGroup: {},
};

const KajoraContext = createContext<KajoraContextValue | null>(null);

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function storedData(state: DataState): StoredDemoData {
  return { ...state, interestedIds: [...state.interestedIds] };
}

function hydratedDemoData(stored: StoredDemoData | null): DataState {
  if (!stored) return demoInitialState;
  return { ...stored, interestedIds: new Set(stored.interestedIds) };
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function KajoraProvider({ children }: PropsWithChildren) {
  const { backendMode, session, supabaseSession } = useAuth();
  const [data, setData] = useState<DataState>(demoInitialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoHydrated, setDemoHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (backendMode !== 'supabase' || !supabaseSession) return;
    setIsLoading(true);
    setError('');
    try {
      const [intents, interestedIds, remoteGroups] = await Promise.all([
        fetchIntents(supabaseSession),
        fetchInterestedPostIds(supabaseSession),
        fetchRemoteGroups(supabaseSession),
      ]);
      const intentMap = new Map(intents.map((intent) => [intent.id, intent]));
      const groups = remoteGroups.map((group) => ({
        id: group.id,
        memberCount: (intentMap.get(group.source_post_id)?.interestedCount ?? 0) + 1,
        sourcePostId: group.source_post_id,
        state: group.state.replace('_', '-') as IntentStatus,
      }));
      setData((current) => ({
        groups,
        intents,
        interestedIds: new Set(interestedIds),
        messagesByGroup: current.messagesByGroup,
      }));
    } catch (loadError) {
      setError(messageFor(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [backendMode, supabaseSession]);

  useEffect(() => {
    if (!session) {
      if (backendMode === 'supabase') setData(emptyRemoteState);
      return;
    }
    if (backendMode === 'supabase') {
      setData(emptyRemoteState);
      void refresh();
      return;
    }

    let mounted = true;
    readStoredJson<StoredDemoData>(DEMO_DATA_KEY).then((stored) => {
      if (!mounted) return;
      setData(hydratedDemoData(stored));
      setDemoHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, [backendMode, refresh, session]);

  useEffect(() => {
    if (backendMode === 'demo' && session && demoHydrated) {
      void writeStoredJson(DEMO_DATA_KEY, storedData(data));
    }
  }, [backendMode, data, demoHydrated, session]);

  const createIntent = useCallback(
    async (input: CreateIntentInput) => {
      setError('');
      if (backendMode === 'supabase') {
        if (!supabaseSession) throw new Error('Your session expired. Please sign in again.');
        const id = await createRemoteIntent(supabaseSession, input);
        if (!id) throw new Error('The buying intention could not be created.');
        await refresh();
        return id;
      }

      const id = `intent-${Date.now()}`;
      const name = session?.name || 'Tobi';
      const intent: Intent = {
        ...input,
        accent: 'green',
        area: input.location.split(',')[0]?.trim() || input.location,
        createdAgo: 'Just now',
        creatorId: session?.userId,
        creator: {
          completedGroups: 0,
          initials: initialsFor(name) || 'TA',
          name,
          phoneVerified: false,
        },
        id,
        interestedCount: 0,
        status: 'open',
        type: 'buying-intent',
      };
      setData((current) => ({ ...current, intents: [intent, ...current.intents] }));
      return id;
    },
    [backendMode, refresh, session?.name, supabaseSession],
  );

  const expressInterest = useCallback(
    async (id: string) => {
      setError('');
      try {
        if (backendMode === 'supabase') {
          if (!supabaseSession) throw new Error('Your session expired. Please sign in again.');
          const groupId = await expressRemoteInterest(supabaseSession, id);
          await refresh();
          return groupId;
        }

        setData((current) => {
          if (current.interestedIds.has(id)) return current;
          const interestedIds = new Set(current.interestedIds).add(id);
          const intents = current.intents.map((intent) =>
            intent.id === id ? { ...intent, interestedCount: intent.interestedCount + 1, status: 'forming' as const } : intent,
          );
          const intent = intents.find((item) => item.id === id);
          const groups = current.groups.some((group) => group.sourcePostId === id)
            ? current.groups
            : [{ id, memberCount: (intent?.interestedCount ?? 1) + 1, sourcePostId: id, state: 'forming' as const }, ...current.groups];
          return { ...current, groups, interestedIds, intents };
        });
        return id;
      } catch (interestError) {
        setError(messageFor(interestError));
        return null;
      }
    },
    [backendMode, refresh, supabaseSession],
  );

  const withdrawInterest = useCallback(
    async (id: string) => {
      setError('');
      try {
        if (backendMode === 'supabase') {
          if (!supabaseSession) throw new Error('Your session expired. Please sign in again.');
          await withdrawRemoteInterest(supabaseSession, id);
          await refresh();
          return;
        }

        setData((current) => {
          const interestedIds = new Set(current.interestedIds);
          if (!interestedIds.delete(id)) return current;
          return {
            ...current,
            groups: current.groups.filter((group) => group.sourcePostId !== id),
            interestedIds,
            intents: current.intents.map((intent) =>
              intent.id === id
                ? { ...intent, interestedCount: Math.max(0, intent.interestedCount - 1) }
                : intent,
            ),
          };
        });
      } catch (withdrawError) {
        setError(messageFor(withdrawError));
      }
    },
    [backendMode, refresh, supabaseSession],
  );

  const loadGroupMessages = useCallback(
    async (groupId: string) => {
      if (backendMode !== 'supabase' || !supabaseSession || !session) return;
      try {
        const rows = await fetchRemoteMessages(supabaseSession, groupId);
        const messages = rows.map<GroupMessage>((row) => {
          const author = row.author?.display_name ?? 'KAJORA member';
          return {
            author,
            body: row.body,
            id: row.id,
            initials: initialsFor(author) || 'KJ',
            mine: row.author_id === session.userId,
            time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        });
        setData((current) => ({
          ...current,
          messagesByGroup: { ...current.messagesByGroup, [groupId]: messages },
        }));
      } catch (messageError) {
        setError(messageFor(messageError));
      }
    },
    [backendMode, session, supabaseSession],
  );

  const sendGroupMessage = useCallback(
    async (groupId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return 'Write a message first.';
      setError('');
      try {
        let message: GroupMessage;
        if (backendMode === 'supabase') {
          if (!supabaseSession || !session) throw new Error('Your session expired. Please sign in again.');
          const row = await sendRemoteMessage(supabaseSession, groupId, trimmed);
          if (!row) throw new Error('The message could not be sent.');
          const author = row.author?.display_name ?? session.name;
          message = {
            author,
            body: row.body,
            id: row.id,
            initials: initialsFor(author) || 'KJ',
            mine: true,
            time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        } else {
          const author = session?.name || 'You';
          message = {
            author,
            body: trimmed,
            id: `message-${Date.now()}`,
            initials: initialsFor(author) || 'YO',
            mine: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        setData((current) => ({
          ...current,
          messagesByGroup: {
            ...current.messagesByGroup,
            [groupId]: [...(current.messagesByGroup[groupId] ?? []), message],
          },
        }));
        return null;
      } catch (sendError) {
        const nextError = messageFor(sendError);
        setError(nextError);
        return nextError;
      }
    },
    [backendMode, session, supabaseSession],
  );

  const value = useMemo<KajoraContextValue>(
    () => ({
      ...data,
      createIntent,
      error,
      expressInterest,
      findGroup: (id) => data.groups.find((group) => group.id === id || group.sourcePostId === id),
      findIntent: (id) => data.intents.find((intent) => intent.id === id),
      getGroupForIntent: (intentId) => data.groups.find((group) => group.sourcePostId === intentId),
      isLoading,
      loadGroupMessages,
      refresh,
      sendGroupMessage,
      withdrawInterest,
    }),
    [createIntent, data, error, expressInterest, isLoading, loadGroupMessages, refresh, sendGroupMessage, withdrawInterest],
  );

  return <KajoraContext.Provider value={value}>{children}</KajoraContext.Provider>;
}

export function useKajora() {
  const context = useContext(KajoraContext);
  if (!context) throw new Error('useKajora must be used inside KajoraProvider');
  return context;
}
