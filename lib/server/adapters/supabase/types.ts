export interface SupabaseResult<T = any> {
  data: T | null
  error: { message?: string } | null
}

export interface SupabaseQuery extends PromiseLike<SupabaseResult> {
  select(columns?: string): SupabaseQuery
  insert(value: unknown): SupabaseQuery
  update(value: unknown): SupabaseQuery
  delete(): SupabaseQuery
  upsert(value: unknown, options?: unknown): SupabaseQuery
  eq(column: string, value: unknown): SupabaseQuery
  neq(column: string, value: unknown): SupabaseQuery
  in(column: string, values: unknown[]): SupabaseQuery
  ilike(column: string, pattern: string): SupabaseQuery
  order(column: string, options?: unknown): SupabaseQuery
  range(from: number, to: number): SupabaseQuery
  limit(value: number): SupabaseQuery
  single<T = unknown>(): Promise<SupabaseResult<T>>
  maybeSingle<T = unknown>(): Promise<SupabaseResult<T>>
}

export interface SupabaseAuthClient {
  signInWithOtp(input: unknown): Promise<SupabaseResult>
  verifyOtp(input: unknown): Promise<SupabaseResult>
  signOut(): Promise<SupabaseResult>
  getUser(): Promise<SupabaseResult>
  admin?: {
    getUserById(id: string): Promise<SupabaseResult>
  }
}

export interface SupabaseDataClient {
  from(table: string): SupabaseQuery
  rpc(name: string, args?: unknown): Promise<SupabaseResult>
  auth?: SupabaseAuthClient
}
