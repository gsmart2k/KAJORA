import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

import { initialIntents } from '@/data/mock';
import type { CreateIntentInput, Intent } from '@/types';

type KajoraContextValue = {
  intents: Intent[];
  interestedIds: Set<string>;
  createIntent: (input: CreateIntentInput) => string;
  expressInterest: (id: string) => void;
  withdrawInterest: (id: string) => void;
  findIntent: (id: string) => Intent | undefined;
};

const KajoraContext = createContext<KajoraContextValue | null>(null);

export function KajoraProvider({ children }: PropsWithChildren) {
  const [intents, setIntents] = useState(initialIntents);
  const [interestedIds, setInterestedIds] = useState(() => new Set(['rice-otaefun']));

  const value = useMemo<KajoraContextValue>(
    () => ({
      intents,
      interestedIds,
      findIntent: (id) => intents.find((intent) => intent.id === id),
      expressInterest: (id) => {
        setInterestedIds((current) => new Set(current).add(id));
        setIntents((current) =>
          current.map((intent) =>
            intent.id === id ? { ...intent, interestedCount: intent.interestedCount + 1 } : intent,
          ),
        );
      },
      withdrawInterest: (id) => {
        setInterestedIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        setIntents((current) =>
          current.map((intent) =>
            intent.id === id
              ? { ...intent, interestedCount: Math.max(0, intent.interestedCount - 1) }
              : intent,
          ),
        );
      },
      createIntent: (input) => {
        const id = `intent-${Date.now()}`;
        const intent: Intent = {
          ...input,
          id,
          type: 'buying-intent',
          creator: { name: 'Tobi', initials: 'TA', completedGroups: 0, phoneVerified: true },
          area: input.location.split(',')[0]?.trim() || input.location,
          interestedCount: 0,
          createdAgo: 'Just now',
          status: 'open',
          accent: 'green',
        };
        setIntents((current) => [intent, ...current]);
        return id;
      },
    }),
    [intents, interestedIds],
  );

  return <KajoraContext.Provider value={value}>{children}</KajoraContext.Provider>;
}

export function useKajora() {
  const context = useContext(KajoraContext);
  if (!context) {
    throw new Error('useKajora must be used inside KajoraProvider');
  }
  return context;
}
