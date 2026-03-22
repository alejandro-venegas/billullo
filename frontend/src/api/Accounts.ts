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
  AccountDto,
  AdjustBalanceRequest,
  CreateAccountRequest,
  DeleteAccountRequest,
  TransactionBalanceDto,
  TransactionDto,
  UpdateAccountRequest,
} from "./data-contracts";
import { ContentType, HttpClient, type RequestParams } from "./http-client";

export class Accounts<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Accounts
   * @name AccountsGetAll
   * @request GET:/api/Accounts
   */
  accountsGetAll = (params: RequestParams = {}) =>
    this.request<AccountDto[], any>({
      path: `/api/Accounts`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Accounts
   * @name AccountsCreate
   * @request POST:/api/Accounts
   */
  accountsCreate = (
    data: CreateAccountRequest,
    params: RequestParams = {},
  ) =>
    this.request<AccountDto, any>({
      path: `/api/Accounts`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Accounts
   * @name AccountsGetById
   * @request GET:/api/Accounts/{id}
   */
  accountsGetById = (id: number, params: RequestParams = {}) =>
    this.request<AccountDto, any>({
      path: `/api/Accounts/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Accounts
   * @name AccountsUpdate
   * @request PUT:/api/Accounts/{id}
   */
  accountsUpdate = (
    id: number,
    data: UpdateAccountRequest,
    params: RequestParams = {},
  ) =>
    this.request<AccountDto, any>({
      path: `/api/Accounts/${id}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Accounts
   * @name AccountsDelete
   * @request DELETE:/api/Accounts/{id}
   */
  accountsDelete = (
    id: number,
    data: DeleteAccountRequest,
    params: RequestParams = {},
  ) =>
    this.request<Blob, any>({
      path: `/api/Accounts/${id}`,
      method: "DELETE",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Accounts
   * @name AccountsGetBalance
   * @request GET:/api/Accounts/{id}/balance
   */
  accountsGetBalance = (
    id: number,
    query?: {
      /** @default "USD" */
      targetCurrency?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<TransactionBalanceDto, any>({
      path: `/api/Accounts/${id}/balance`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Accounts
   * @name AccountsAdjustBalance
   * @request POST:/api/Accounts/{id}/adjust
   */
  accountsAdjustBalance = (
    id: number,
    data: AdjustBalanceRequest,
    params: RequestParams = {},
  ) =>
    this.request<TransactionDto, any>({
      path: `/api/Accounts/${id}/adjust`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}
