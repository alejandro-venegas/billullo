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
   * @name TransactionsList
   * @request GET:/api/Transactions
   */
  transactionsList = (
    query?: {
      type?: string;
      /** @format date-time */
      startDate?: string;
      /** @format date-time */
      endDate?: string;
      search?: string;
      /**
       * @format int32
       * @default 1
       * @pattern ^-?(?:0|[1-9]\d*)$
       */
      page?: number | string;
      /**
       * @format int32
       * @default 25
       * @pattern ^-?(?:0|[1-9]\d*)$
       */
      pageSize?: number | string;
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
   * @name TransactionsDetail
   * @request GET:/api/Transactions/{id}
   */
  transactionsDetail = (id: number | string, params: RequestParams = {}) =>
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
    id: number | string,
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
  transactionsDelete = (id: number | string, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/Transactions/${id}`,
      method: "DELETE",
      ...params,
    });
}
