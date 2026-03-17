/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  /** @format date-time */
  expiresAt?: string;
  user?: UserDto;
}

export interface UserDto {
  id?: string;
  email?: string;
  preferredCurrency?: string;
}

export interface RegisterRequest {
  email?: string;
  password?: string;
}

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface RefreshRequest {
  refreshToken?: string;
}

export interface UpdatePreferencesRequest {
  preferredCurrency?: string;
}

export interface CategoryDto {
  /** @format int64 */
  id?: number;
  name?: string;
  /** @format int64 */
  parentCategoryId?: number | null;
  color?: string | null;
  /** @format int32 */
  ruleCount?: number;
  /** @format int32 */
  transactionCount?: number;
}

export interface CreateCategoryRequest {
  name?: string;
  /** @format int64 */
  parentCategoryId?: number | null;
  color?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string | null;
}

export interface EmailConfigDto {
  /** @format int64 */
  id?: number;
  imapHost?: string;
  /** @format int32 */
  imapPort?: number;
  emailAddress?: string;
  hasPassword?: boolean;
  useSsl?: boolean;
  enabled?: boolean;
}

export interface UpsertEmailConfigRequest {
  imapHost?: string;
  /** @format int32 */
  imapPort?: number;
  emailAddress?: string;
  password?: string | null;
  useSsl?: boolean;
  enabled?: boolean;
}

export interface TestConnectionResult {
  success?: boolean;
  error?: string | null;
}

export interface TestEmailConfigRequest {
  imapHost?: string;
  /** @format int32 */
  imapPort?: number;
  emailAddress?: string;
  password?: string;
  useSsl?: boolean;
}

export interface TestScrapeResult {
  success?: boolean;
  emails?: ScrapedEmail[] | null;
  error?: string | null;
}

export interface ScrapedEmail {
  uid?: number;
  from?: string;
  /** @format date-time */
  date?: string;
  subject?: string;
  bodyPreview?: string;
  parsedTransaction?: ParsedTransactionPreview | null;
  matchLog?: string[] | null;
}

export interface ParsedTransactionPreview {
  /** @format decimal */
  amount?: number | null;
  /** @format date-time */
  date?: string | null;
  currency?: string | null;
  description?: string | null;
  matchedRuleName?: string;
}

export interface EmailParsingRuleDto {
  /** @format int64 */
  id?: number;
  name?: string;
  senderAddress?: string | null;
  subjectPattern?: string | null;
  currencyFixed?: string | null;
  descriptionFixed?: string | null;
  transactionType?: string;
  /** @format int64 */
  categoryId?: number | null;
  categoryName?: string | null;
  /** @format int32 */
  priority?: number;
}

export interface CreateEmailParsingRuleRequest {
  name?: string;
  senderAddress?: string | null;
  subjectPattern?: string | null;
  currencyFixed?: string | null;
  descriptionFixed?: string | null;
  transactionType?: string;
  /** @format int64 */
  categoryId?: number | null;
  /** @format int32 */
  priority?: number;
}

export interface UpdateEmailParsingRuleRequest {
  name?: string;
  senderAddress?: string | null;
  subjectPattern?: string | null;
  currencyFixed?: string | null;
  descriptionFixed?: string | null;
  transactionType?: string;
  /** @format int64 */
  categoryId?: number | null;
  /** @format int32 */
  priority?: number;
}

export interface TestEmailParsingResult {
  matched?: boolean;
  /** @format decimal */
  amount?: number | null;
  /** @format date-time */
  date?: string | null;
  currency?: string | null;
  description?: string | null;
  error?: string | null;
}

export interface TestEmailParsingRuleRequest {
  emailBody?: string;
}

export interface CategoryRuleDto {
  /** @format int64 */
  id?: number;
  pattern?: string;
  /** @format int64 */
  categoryId?: number;
  categoryName?: string | null;
}

export interface RuleMatchResult {
  /** @format int64 */
  categoryId?: number | null;
  categoryName?: string | null;
  conflicts?: boolean;
  matches?: CategoryRuleDto[];
}

export interface CreateCategoryRuleRequest {
  pattern?: string;
  /** @format int64 */
  categoryId?: number;
}

export interface UpdateCategoryRuleRequest {
  pattern?: string;
  /** @format int64 */
  categoryId?: number;
}

export interface PaginatedResponseOfTransactionDto {
  items?: TransactionDto[];
  /** @format int32 */
  totalCount?: number;
  /** @format int32 */
  page?: number;
  /** @format int32 */
  pageSize?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface TransactionDto {
  /** @format int64 */
  id?: number;
  /** @format date-time */
  date?: string;
  description?: string;
  /** @format int64 */
  categoryId?: number | null;
  categoryName?: string | null;
  /** @format decimal */
  amount?: number;
  currency?: string;
  type?: string;
  source?: string;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
  /** @format decimal */
  convertedAmount?: number | null;
  targetCurrency?: string | null;
}

export interface TransactionBalanceDto {
  /** @format decimal */
  total?: number;
  targetCurrency?: string;
  breakdown?: CurrencyBalance[];
}

export interface CurrencyBalance {
  currency?: string;
  /** @format decimal */
  originalAmount?: number;
}

export interface CreateTransactionRequest {
  /** @format date-time */
  date?: string;
  description?: string;
  /** @format int64 */
  categoryId?: number | null;
  /** @format decimal */
  amount?: number;
  currency?: string;
  type?: string;
}

export interface UpdateTransactionRequest {
  /** @format date-time */
  date?: string;
  description?: string;
  /** @format int64 */
  categoryId?: number | null;
  /** @format decimal */
  amount?: number;
  currency?: string;
  type?: string;
}
