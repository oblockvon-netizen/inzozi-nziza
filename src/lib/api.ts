import type {
  AdminStats,
  AdminUser,
  ApiErrorBody,
  AuthUser,
  Contribution,
  ContributionSummary,
  Fine,
  Loan,
} from "@/types/api";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

let csrfToken: string | null = null;
let csrfInitPromise: Promise<void> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

export async function initCsrf(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/auth/csrf`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new ApiError("Failed to initialize CSRF token", res.status);
  }
  const data = (await res.json()) as { csrfToken: string };
  csrfToken = data.csrfToken;
  return csrfToken;
}

async function ensureCsrf(): Promise<void> {
  if (csrfToken) return;
  if (!csrfInitPromise) {
    csrfInitPromise = initCsrf().then(() => undefined);
  }
  await csrfInitPromise;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | undefined;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    // ignore
  }
  return new ApiError(
    body?.message ?? res.statusText ?? "Request failed",
    res.status,
    body?.error
  );
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    await ensureCsrf();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retryOn401 && path !== "/api/v1/auth/refresh") {
    try {
      await authApi.refresh();
      return request<T>(path, options, false);
    } catch {
      throw await parseError(res);
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const authApi = {
  initCsrf,
  me: () => request<{ user: AuthUser }>("/api/v1/auth/me"),
  login: (body: { email: string; password: string }) =>
    request<{ user: AuthUser; csrfToken: string }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  signup: (body: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) =>
    request<{ user: AuthUser; csrfToken: string }>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () =>
    request<{ message: string }>("/api/v1/auth/logout", { method: "POST" }),
  refresh: () =>
    request<{ user: AuthUser; csrfToken: string }>(
      "/api/v1/auth/refresh",
      { method: "POST" },
      false
    ),
  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (body: { token: string; password: string }) =>
    request<{ message: string }>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  verifyEmail: (token: string) =>
    request<{ user: AuthUser; message: string }>("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  resendVerification: (email?: string) =>
    request<{ message: string }>("/api/v1/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify(email ? { email } : {}),
    }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const meApi = {
  updateProfile: (body: { fullName: string; phone?: string }) =>
    request<{ user: AuthUser; message: string }>("/api/v1/me/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export const contributionsApi = {
  mine: () =>
    request<{ contributions: Contribution[] }>("/api/v1/contributions/mine"),
  summary: () =>
    request<{ summary: ContributionSummary }>(
      "/api/v1/contributions/mine/summary"
    ),
  listAll: () =>
    request<{ contributions: Contribution[] }>("/api/v1/contributions/"),
  record: (body: {
    userId: string;
    amount: number;
    paymentDate?: string;
    referenceNumber?: string;
    notes?: string;
  }) =>
    request<{ contribution: Contribution; message: string }>(
      "/api/v1/contributions/",
      { method: "POST", body: JSON.stringify(body) }
    ),
};

export const loansApi = {
  mine: () => request<{ loans: Loan[] }>("/api/v1/loans/mine"),
  listAll: () => request<{ loans: Loan[] }>("/api/v1/loans/"),
  apply: (body: { amount: number; purpose: string }) =>
    request<{ loan: Loan; message: string }>("/api/v1/loans/mine", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  approve: (loanId: string, adminNotes?: string) =>
    request<{ loan: Loan; message: string }>(
      `/api/v1/loans/${loanId}/approve`,
      { method: "POST", body: JSON.stringify({ adminNotes }) }
    ),
  deny: (loanId: string, adminNotes?: string) =>
    request<{ loan: Loan; message: string }>(`/api/v1/loans/${loanId}/deny`, {
      method: "POST",
      body: JSON.stringify({ adminNotes }),
    }),
  recordPayment: (loanId: string, body: { amount: number; notes?: string }) =>
    request<{ loan: Loan; payment: unknown; message: string }>(
      `/api/v1/loans/${loanId}/payments`,
      { method: "POST", body: JSON.stringify(body) }
    ),
};

export const finesApi = {
  mine: () => request<{ fines: Fine[] }>("/api/v1/fines/mine"),
  listAll: () => request<{ fines: Fine[] }>("/api/v1/fines/"),
  issue: (body: {
    userId: string;
    amount: number;
    reason: string;
    adminNotes?: string;
  }) =>
    request<{ fine: Fine; message: string }>("/api/v1/fines/", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  recordPayment: (
    fineId: string,
    body: { amount: number; notes?: string }
  ) =>
    request<{ fine: Fine; payment: unknown; message: string }>(
      `/api/v1/fines/${fineId}/payments`,
      { method: "POST", body: JSON.stringify(body) }
    ),
  cancel: (fineId: string, adminNotes?: string) =>
    request<{ fine: Fine; message: string }>(
      `/api/v1/fines/${fineId}/cancel`,
      { method: "POST", body: JSON.stringify({ adminNotes }) }
    ),
};

export const adminApi = {
  users: () => request<{ users: AdminUser[] }>("/api/v1/admin/users"),
  stats: () => request<{ stats: AdminStats }>("/api/v1/admin/stats"),
  approveUser: (userId: string, adminNotes?: string) =>
    request<{ profile: unknown; message: string }>(
      `/api/v1/admin/users/${userId}/approve`,
      { method: "POST", body: JSON.stringify({ adminNotes }) }
    ),
  rejectUser: (userId: string, adminNotes?: string) =>
    request<{ profile: unknown; message: string }>(
      `/api/v1/admin/users/${userId}/reject`,
      { method: "POST", body: JSON.stringify({ adminNotes }) }
    ),
};

export function redirectForUser(user: AuthUser): string {
  if (user.accessRole === "ADMIN") return "/admin";
  return "/dashboard";
}

export function isStatus(status: string, expected: string): boolean {
  return status.toUpperCase() === expected.toUpperCase();
}

export { toNumber };
