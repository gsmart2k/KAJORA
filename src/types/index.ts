export type IntentCategory = 'Livestock' | 'Foodstuff' | 'Household';
export type PostType = 'buying-intent' | 'available-share';
export type IntentStatus = 'open' | 'forming' | 'planning' | 'awaiting-confirmation';

export type Intent = {
  id: string;
  creatorId?: string;
  type: PostType;
  creator: {
    name: string;
    initials: string;
    completedGroups: number;
    phoneVerified: boolean;
  };
  title: string;
  product: string;
  category: IntentCategory;
  location: string;
  area: string;
  timing: string;
  desiredShare: string;
  budget?: string;
  description: string;
  interestedCount: number;
  desiredPeople?: number;
  createdAgo: string;
  status: IntentStatus;
  accent: 'green' | 'clay' | 'ochre';
};

export type CreateIntentInput = {
  category: IntentCategory;
  title: string;
  product: string;
  location: string;
  timing: string;
  desiredShare: string;
  description: string;
};

export type BuyingGroup = {
  id: string;
  sourcePostId: string;
  state: IntentStatus;
  memberCount: number;
};

export type DecisionState = 'Agreed' | 'Discussing' | 'Suggested' | 'Not discussed';

export type GroupDecision = {
  label: string;
  value: string;
  state: DecisionState;
};

export type GroupMessage = {
  id: string;
  author: string;
  initials: string;
  body: string;
  time: string;
  mine?: boolean;
};
