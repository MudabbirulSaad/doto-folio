export interface SupabaseResult<T = unknown> {
  data: T | null
  error: { message: string; code?: string } | null
  count?: number | null
}

export interface SupabaseQuery extends PromiseLike<SupabaseResult<unknown>> {
  select(columns?: string, options?: unknown): SupabaseQuery
  insert(value: unknown): SupabaseQuery
  update(value: unknown): SupabaseQuery
  delete(): SupabaseQuery
  upsert(value: unknown, options?: unknown): SupabaseQuery
  eq(column: string, value: unknown): SupabaseQuery
  neq(column: string, value: unknown): SupabaseQuery
  gte(column: string, value: unknown): SupabaseQuery
  gt(column: string, value: unknown): SupabaseQuery
  lte(column: string, value: unknown): SupabaseQuery
  is(column: string, value: unknown): SupabaseQuery
  in(column: string, values: unknown[]): SupabaseQuery
  ilike(column: string, pattern: string): SupabaseQuery
  or(filters: string): SupabaseQuery
  not(column: string, operator: string, value: unknown): SupabaseQuery
  order(column: string, options?: unknown): SupabaseQuery
  range(from: number, to: number): SupabaseQuery
  limit(value: number): SupabaseQuery
  single<T = unknown>(): Promise<SupabaseResult<T>>
  maybeSingle<T = unknown>(): Promise<SupabaseResult<T>>
}

export interface SupabaseAuthUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface SupabaseAuthSessionResult {
  session: unknown
  user: SupabaseAuthUser | null
}

export interface SupabaseAuthClient {
  signInWithOtp(input: unknown): Promise<SupabaseResult>
  verifyOtp(input: unknown): Promise<SupabaseResult<SupabaseAuthSessionResult>>
  signOut(): Promise<SupabaseResult>
  getUser(input?: unknown): Promise<SupabaseResult<{ user: SupabaseAuthUser | null }>>
  admin?: {
    getUserById(id: string): Promise<SupabaseResult<{ user: SupabaseAuthUser | null }>>
    listUsers(input?: unknown): Promise<SupabaseResult<{ users: SupabaseAuthUser[] }>>
    createUser(input: unknown): Promise<SupabaseResult<{ user: SupabaseAuthUser | null }>>
    updateUserById(id: string, input: unknown): Promise<SupabaseResult<{ user: SupabaseAuthUser | null }>>
  }
}

export interface SupabaseDataClient {
  from(table: string): SupabaseQuery
  rpc(name: string, args?: unknown): Promise<SupabaseResult>
  auth?: SupabaseAuthClient
}

export type SupabaseAuthDataClient = SupabaseDataClient & {
  auth: SupabaseAuthClient
}

export type SupabaseAdminDataClient = SupabaseDataClient & {
  auth: SupabaseAuthClient & { admin: NonNullable<SupabaseAuthClient['admin']> }
}
