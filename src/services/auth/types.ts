export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
};

export type AuthCredits = {
  balance: number;
  monthlyAllowance: number;
  allowanceUsed: number;
  renewsAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
  credits: AuthCredits;
};

export type MeResponse = {
  user: AuthUser;
  credits: AuthCredits;
};

export type DeleteAccountResponse = {
  deleted: boolean;
};

export type RawAuthUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  picture?: string | null;
  createdAt?: string | null;
};

export type RawAuthCredits = Partial<AuthCredits> & {
  balance?: number;
};

export function normalizeAuthUser(user?: RawAuthUser | null): AuthUser {
  return {
    id: user?.id ?? '',
    email: user?.email ?? null,
    name: user?.name ?? null,
    avatarUrl: user?.avatarUrl ?? user?.picture ?? null,
    createdAt: user?.createdAt ?? null,
  };
}

export function normalizeAuthCredits(
  credits?: RawAuthCredits | null,
): AuthCredits {
  return {
    balance: credits?.balance ?? 0,
    monthlyAllowance: credits?.monthlyAllowance ?? 0,
    allowanceUsed: credits?.allowanceUsed ?? 0,
    renewsAt: credits?.renewsAt ?? '',
  };
}
