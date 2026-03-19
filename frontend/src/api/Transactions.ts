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

import type {
  CreateTransactionRequest,
  PaginatedResponseOfTransactionDto,
  TransactionBalanceDto,
  TransactionDto,
  UpdateTransactionRequest,
} from "./data-contracts";
import { ContentType, HttpClient, type RequestParams } from "./http-client";

export class Transactions<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Transactions
   * @name TransactionsGetAll
   * @request GET:/api/Transactions
   */
  transactionsGetAll = (
    query?: {
      type?: string | null;
      /** @format date-time */
      startDate?: string | null;
      /** @format date-time */
      endDate?: string | null;
      search?: string | null;
      targetCurrency?: string | null;
      /**
       * @format int32
       * @default 1
       */
      page?: number;
      /**
       * @format int32
       * @default 25
       */
      pageSize?: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<PaginatedResponseOfTransactionDto, any>({
      path: `/api/Transactions`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Transactions
   * @name TransactionsCreate
   * @request POST:/api/Transactions
   */
  transactionsCreate = (
    data: CreateTransactionRequest,
    params: RequestParams = {},
  ) =>
    this.request<TransactionDto, any>({
      path: `/api/Transactions`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Transactions
   * @name TransactionsGetBalance
   * @request GET:/api/Transactions/balance
   */
  transactionsGetBalance = (
    query?: {
      /** @default "USD" */
      targetCurrency?: string;
      type?: string | null;
      /** @format date-time */
      startDate?: string | null;
      /** @format date-time */
      endDate?: string | null;
      search?: string | null;
    },
    params: RequestParams = {},
  ) =>
    this.request<TransactionBalanceDto, any>({
      path: `/api/Transactions/balance`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Transactions
   * @name TransactionsGetById
   * @request GET:/api/Transactions/{id}
   */
  transactionsGetById = (id: number, params: RequestParams = {}) =>
    this.request<TransactionDto, any>({
      path: `/api/Transactions/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Transactions
   * @name TransactionsUpdate
   * @request PUT:/api/Transactions/{id}
   */
  transactionsUpdate = (
    id: number,
    data: UpdateTransactionRequest,
    params: RequestParams = {},
  ) =>
    this.request<TransactionDto, any>({
      path: `/api/Transactions/${id}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Transactions
   * @name TransactionsDelete
   * @request DELETE:/api/Transactions/{id}
   */
  transactionsDelete = (id: number, params: RequestParams = {}) =>
    this.request<Blob, any>({
      path: `/api/Transactions/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Transactions
   * @name TransactionsDeleteMany
   * @request DELETE:/api/Transactions
   */
  transactionsDeleteMany = (
    data: { ids: number[] },
    params: RequestParams = {},
  ) =>
    this.request<{ deleted: number }, any>({
      path: `/api/Transactions/bulk`,
      method: "DELETE",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}
