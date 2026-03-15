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
  token: string;
  refreshToken: string;
  /** @format date-time */
  expiresAt: string;
  user: UserDto;
}

export interface CategoryDto {
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  id: number | string;
  name: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  parentCategoryId: number | null | string;
  color: null | string;
  /**
   * @format int32
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  ruleCount: number | string;
  /**
   * @format int32
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  transactionCount: number | string;
}

export interface CategoryRuleDto {
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  id: number | string;
  pattern: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  categoryId: number | string;
  categoryName: null | string;
}

export interface CreateCategoryRequest {
  name: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  parentCategoryId?: number | null | string;
  color?: null | string;
}

export interface CreateCategoryRuleRequest {
  pattern: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  categoryId: number | string;
}

export interface CreateEmailParsingRuleRequest {
  name: string;
  senderAddress: null | string;
  subjectPattern: null | string;
  amountRegex: string;
  dateRegex: string;
  dateFormat: string;
  currencyFixed: null | string;
  currencyRegex: null | string;
  descriptionFixed: null | string;
  descriptionRegex: null | string;
  transactionType: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  categoryId: number | null | string;
  /**
   * @format int32
   * @default 0
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  priority?: number | string;
}

export interface CreateTransactionRequest {
  /** @format date-time */
  date: string;
  description: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  categoryId: number | null | string;
  /**
   * @format double
   * @pattern ^-?(?:0|[1-9]\d*)(?:\.\d+)?$
   */
  amount: number | string;
  currency: string;
  type: string;
}

export interface EmailConfigDto {
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  id: number | string;
  imapHost: string;
  /**
   * @format int32
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  imapPort: number | string;
  emailAddress: string;
  hasPassword: boolean;
  useSsl: boolean;
  enabled: boolean;
}

export interface EmailParsingRuleDto {
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  id: number | string;
  name: string;
  senderAddress: null | string;
  subjectPattern: null | string;
  amountRegex: string;
  dateRegex: string;
  dateFormat: string;
  currencyFixed: null | string;
  currencyRegex: null | string;
  descriptionFixed: null | string;
  descriptionRegex: null | string;
  transactionType: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  categoryId: number | null | string;
  categoryName: null | string;
  /**
   * @format int32
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  priority: number | string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PaginatedResponseOfTransactionDto {
  items: TransactionDto[];
  /**
   * @format int32
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  totalCount: number | string;
  /**
   * @format int32
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  page: number | string;
  /**
   * @format int32
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  pageSize: number | string;
  /**
   * @format int32
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  totalPages: number | string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RuleMatchResult {
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  categoryId: number | null | string;
  categoryName: null | string;
  conflicts: boolean;
  matches: CategoryRuleDto[];
}

export interface TestConnectionResult {
  success: boolean;
  error: null | string;
}

export interface TestEmailConfigRequest {
  imapHost: string;
  /**
   * @format int32
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  imapPort: number | string;
  emailAddress: string;
  password: string;
  /** @default true */
  useSsl?: boolean;
}

export interface TestEmailParsingResult {
  matched: boolean;
  /**
   * @format double
   * @pattern ^-?(?:0|[1-9]\d*)(?:\.\d+)?$
   */
  amount: null | number | string;
  /** @format date-time */
  date: null | string;
  currency: null | string;
  description: null | string;
  error: null | string;
}

export interface TestEmailParsingRuleRequest {
  emailBody: string;
  emailSubject: string;
  senderAddress: string;
  amountRegex: string;
  dateRegex: string;
  dateFormat: string;
  currencyFixed: null | string;
  currencyRegex: null | string;
  descriptionFixed: null | string;
  descriptionRegex: null | string;
}

export interface TransactionDto {
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  id: number | string;
  /** @format date-time */
  date: string;
  description: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  categoryId: number | null | string;
  categoryName: null | string;
  /**
   * @format double
   * @pattern ^-?(?:0|[1-9]\d*)(?:\.\d+)?$
   */
  amount: number | string;
  currency: string;
  type: string;
  source: string;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}

export interface UpdateCategoryRequest {
  name: string;
  color?: null | string;
}

export interface UpdateCategoryRuleRequest {
  pattern: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  categoryId: number | string;
}

export interface UpdateEmailParsingRuleRequest {
  name: string;
  senderAddress: null | string;
  subjectPattern: null | string;
  amountRegex: string;
  dateRegex: string;
  dateFormat: string;
  currencyFixed: null | string;
  currencyRegex: null | string;
  descriptionFixed: null | string;
  descriptionRegex: null | string;
  transactionType: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  categoryId: number | null | string;
  /**
   * @format int32
   * @default 0
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  priority?: number | string;
}

export interface UpdateTransactionRequest {
  /** @format date-time */
  date: string;
  description: string;
  /**
   * @format int64
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  categoryId: number | null | string;
  /**
   * @format double
   * @pattern ^-?(?:0|[1-9]\d*)(?:\.\d+)?$
   */
  amount: number | string;
  currency: string;
  type: string;
}

export interface UpsertEmailConfigRequest {
  imapHost: string;
  /**
   * @format int32
   * @pattern ^-?(?:0|[1-9]\d*)$
   */
  imapPort: number | string;
  emailAddress: string;
  password: null | string;
  /** @default true */
  useSsl?: boolean;
  /** @default false */
  enabled?: boolean;
}

export interface UserDto {
  id: string;
  email: string;
}
