import { removeStoredValue, readStoredJson, writeStoredJson } from '@/lib/storage';
import type { CreateIntentInput, Intent, IntentStatus, PostType } from '@/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SESSION_KEY = 'kajora.supabase.session.v1';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project') &&
    !supabaseKey.includes('your-publishable-key'),
);

type SupabaseUser = {
  id: string;
  email?: string;
  phone?: string;
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user: SupabaseUser;
};

export type RemoteProfile = {
  id: string;
  display_name: string;
  discovery_area: string | null;
  phone_verified: boolean;
  completed_groups: number;
};

type PostRow = {
  id: string;
  creator_id: string;
  type: 'buying_intent' | 'available_share';
  state: 'open' | 'forming' | 'planning' | 'awaiting_confirmation';
  category: Intent['category'];
  product: string;
  title: string;
  description: string;
  desired_share: string;
  timing_text: string;
  budget_text: string | null;
  location_label: string;
  area_label: string;
  desired_people: number | null;
  joining_closed: boolean;
  created_at: string;
  creator: {
    display_name: string;
    completed_groups: number;
    phone_verified: boolean;
  } | null;
};

export type RemoteGroup = {
  group_members: { user_id: string; state: string }[];
  id: string;
  source_post_id: string;
  state: string;
};

export type RemoteMessage = {
  id: string;
  group_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { display_name: string } | null;
};

class SupabaseRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function requireConfig() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseKey) {
    throw new Error('Supabase is not configured.');
  }
  return { key: supabaseKey, url: supabaseUrl.replace(/\/$/, '') };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const config = requireConfig();
  const response = await fetch(`${config.url}${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${accessToken ?? config.key}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; msg?: string; error_description?: string }
      | null;
    throw new SupabaseRequestError(
      payload?.message ?? payload?.msg ?? payload?.error_description ?? 'The server could not complete that request.',
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function withExpiry(session: SupabaseSession): SupabaseSession {
  if (session.expires_at) return session;
  return { ...session, expires_at: Math.floor(Date.now() / 1000) + session.expires_in };
}

async function persistAuthResponse(response: Partial<SupabaseSession>) {
  if (!response.access_token || !response.refresh_token || !response.expires_in || !response.user) {
    throw new Error('This account still needs confirmation before it can sign in.');
  }
  const session = withExpiry(response as SupabaseSession);
  await writeStoredJson(SESSION_KEY, session);
  return session;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const response = await request<Partial<SupabaseSession>>('/auth/v1/token?grant_type=password', {
    body: JSON.stringify({ email, password }),
    method: 'POST',
  });
  return persistAuthResponse(response);
}

async function refreshSession(session: SupabaseSession) {
  const refreshed = withExpiry(
    await request<SupabaseSession>('/auth/v1/token?grant_type=refresh_token', {
      body: JSON.stringify({ refresh_token: session.refresh_token }),
      method: 'POST',
    }),
  );
  await writeStoredJson(SESSION_KEY, refreshed);
  return refreshed;
}

export async function restoreSupabaseSession() {
  const session = await readStoredJson<SupabaseSession>(SESSION_KEY);
  if (!session) return null;

  try {
    const expiresSoon = !session.expires_at || session.expires_at <= Math.floor(Date.now() / 1000) + 60;
    return expiresSoon ? await refreshSession(session) : session;
  } catch {
    await removeStoredValue(SESSION_KEY);
    return null;
  }
}

export async function signOutSupabase(session: SupabaseSession | null) {
  try {
    if (session) await request('/auth/v1/logout', { method: 'POST' }, session.access_token);
  } finally {
    await removeStoredValue(SESSION_KEY);
  }
}

export async function fetchProfile(session: SupabaseSession) {
  const rows = await request<RemoteProfile[]>(
    `/rest/v1/profiles?id=eq.${session.user.id}&select=id,display_name,discovery_area,phone_verified,completed_groups`,
    undefined,
    session.access_token,
  );
  return rows[0] ?? null;
}

export async function updateProfile(
  session: SupabaseSession,
  profile: { name: string; location: string },
) {
  const rows = await request<RemoteProfile[]>(
    `/rest/v1/profiles?id=eq.${session.user.id}&select=id,display_name,discovery_area,phone_verified,completed_groups`,
    {
      body: JSON.stringify({ display_name: profile.name, discovery_area: profile.location }),
      headers: { Prefer: 'return=representation' },
      method: 'PATCH',
    },
    session.access_token,
  );
  return rows[0];
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

function relativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(elapsed / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function mapPost(row: PostRow, counts: Map<string, number>): Intent {
  const name = row.creator?.display_name ?? 'KAJORA member';
  return {
    accent: row.type === 'available_share' ? 'clay' : 'green',
    area: row.area_label,
    budget: row.budget_text ?? undefined,
    category: row.category,
    createdAgo: relativeTime(row.created_at),
    creatorId: row.creator_id,
    creator: {
      completedGroups: row.creator?.completed_groups ?? 0,
      initials: initialsFor(name) || 'KJ',
      name,
      phoneVerified: row.creator?.phone_verified ?? false,
    },
    description: row.description,
    desiredPeople: row.desired_people ?? undefined,
    joiningClosed: row.joining_closed,
    desiredShare: row.desired_share,
    id: row.id,
    interestedCount: counts.get(row.id) ?? 0,
    location: row.location_label,
    product: row.product,
    status: row.state.replace('_', '-') as IntentStatus,
    timing: row.timing_text,
    title: row.title,
    type: row.type.replace('_', '-') as PostType,
  };
}

export async function fetchIntents(session: SupabaseSession) {
  const select = [
    'id,creator_id,type,state,category,product,title,description,desired_share,timing_text,budget_text',
    'location_label,area_label,desired_people,joining_closed,created_at',
    'creator:profiles!posts_creator_id_fkey(display_name,completed_groups,phone_verified)',
  ].join(',');
  const [posts, countRows] = await Promise.all([
    request<PostRow[]>(
      `/rest/v1/posts?select=${encodeURIComponent(select)}&state=in.(open,forming,planning,awaiting_confirmation)&order=created_at.desc`,
      undefined,
      session.access_token,
    ),
    request<{ post_id: string; interested_count: number }[]>(
      '/rest/v1/rpc/get_interest_counts',
      { body: '{}', method: 'POST' },
      session.access_token,
    ).catch(() => []),
  ]);
  const counts = new Map(countRows.map((row) => [row.post_id, Number(row.interested_count)]));
  return posts.map((post) => mapPost(post, counts));
}

export async function createRemoteIntent(
  session: SupabaseSession,
  input: CreateIntentInput,
) {
  const rows = await request<{ id: string }[]>(
    '/rest/v1/posts?select=id',
    {
      body: JSON.stringify({
        area_label: input.location.split(',')[0]?.trim() || input.location,
        category: input.category,
        creator_id: session.user.id,
        description: input.description,
        desired_share: input.desiredShare,
        desired_people: input.desiredPeople ?? null,
        location_label: input.location,
        product: input.product,
        timing_text: input.timing,
        title: input.title,
        type: 'buying_intent',
      }),
      headers: { Prefer: 'return=representation' },
      method: 'POST',
    },
    session.access_token,
  );
  return rows[0]?.id;
}

export async function fetchInterestedPostIds(session: SupabaseSession) {
  const rows = await request<{ post_id: string }[]>(
    `/rest/v1/interests?user_id=eq.${session.user.id}&state=in.(interested,ready,assigned,confirmed)&select=post_id`,
    undefined,
    session.access_token,
  );
  return rows.map((row) => row.post_id);
}

export async function fetchRemoteGroups(session: SupabaseSession) {
  return request<RemoteGroup[]>(
    '/rest/v1/buying_groups?select=id,source_post_id,state,group_members(user_id,state)&order=updated_at.desc',
    undefined,
    session.access_token,
  );
}

export async function expressRemoteInterest(session: SupabaseSession, postId: string) {
  return request<string | null>(
    '/rest/v1/rpc/express_interest',
    { body: JSON.stringify({ target_post: postId }), method: 'POST' },
    session.access_token,
  );
}

export async function withdrawRemoteInterest(session: SupabaseSession, postId: string) {
  await request(
    '/rest/v1/rpc/withdraw_interest',
    { body: JSON.stringify({ target_post: postId }), method: 'POST' },
    session.access_token,
  );
}

export async function fetchRemoteMessages(session: SupabaseSession, groupId: string) {
  const select = 'id,group_id,author_id,body,created_at,author:profiles!group_messages_author_id_fkey(display_name)';
  return request<RemoteMessage[]>(
    `/rest/v1/group_messages?group_id=eq.${groupId}&select=${encodeURIComponent(select)}&order=created_at.asc`,
    undefined,
    session.access_token,
  );
}

export async function sendRemoteMessage(session: SupabaseSession, groupId: string, body: string) {
  const select = 'id,group_id,author_id,body,created_at,author:profiles!group_messages_author_id_fkey(display_name)';
  const rows = await request<RemoteMessage[]>(
    `/rest/v1/group_messages?select=${encodeURIComponent(select)}`,
    {
      body: JSON.stringify({ author_id: session.user.id, body, group_id: groupId }),
      headers: { Prefer: 'return=representation' },
      method: 'POST',
    },
    session.access_token,
  );
  return rows[0];
}

export async function fetchJoinRequests(session: SupabaseSession, postId: string) {
  return request<{ user_id: string; display_name: string }[]>('/rest/v1/rpc/get_join_requests',
    { method: 'POST', body: JSON.stringify({ target_post: postId }) }, session.access_token);
}
export async function reviewJoinRequest(session: SupabaseSession, postId: string, applicant: string, approve: boolean) {
  await request('/rest/v1/rpc/review_join_request',
    { method: 'POST', body: JSON.stringify({ target_post: postId, applicant, approve }) }, session.access_token);
}
export async function setJoiningClosed(session: SupabaseSession, postId: string, closed: boolean) {
  await request('/rest/v1/rpc/set_joining_closed',
    { method: 'POST', body: JSON.stringify({ target_post: postId, closed }) }, session.access_token);
}
