export interface SupabaseResult<T = any> {
  data: T | null
  error: { message: string; code?: string } | null
  count?: number | null
}

export interface SupabaseQuery extends PromiseLike<SupabaseResult> {
  select(columns?: string, options?: unknown): SupabaseQuery
  insert(value: unknown): SupabaseQuery
  update(value: unknown): SupabaseQuery
  delete(): SupabaseQuery
  upsert(value: unknown, options?: unknown): SupabaseQuery
  eq(column: string, value: unknown): SupabaseQuery
  neq(column: string, value: unknown): SupabaseQuery
  gte(column: string, value: unknown): SupabaseQuery
  lte(column: string, value: unknown): SupabaseQuery
  in(column: string, values: unknown[]): SupabaseQuery
  ilike(column: string, pattern: string): SupabaseQuery
  or(filters: string): SupabaseQuery
  not(column: string, operator: string, value: unknown): SupabaseQuery
  order(column: string, options?: unknown): SupabaseQuery
  range(from: number, to: number): SupabaseQuery
  limit(value: number): SupabaseQuery
  single<T = any>(): Promise<SupabaseResult<T>>
  maybeSingle<T = any>(): Promise<SupabaseResult<T>>
}

export interface SupabaseAuthClient {
  signInWithOtp(input: unknown): Promise<SupabaseResult>
  verifyOtp(input: unknown): Promise<SupabaseResult>
  signOut(): Promise<SupabaseResult>
  getUser(input?: unknown): Promise<SupabaseResult>
  admin?: {
    getUserById(id: string): Promise<SupabaseResult>
    listUsers(input?: unknown): Promise<SupabaseResult<{ users: any[] }>>
    createUser(input: unknown): Promise<SupabaseResult>
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
