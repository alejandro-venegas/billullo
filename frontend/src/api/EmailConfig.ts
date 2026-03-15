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
  EmailConfigDto,
  TestConnectionResult,
  TestEmailConfigRequest,
  UpsertEmailConfigRequest,
} from "./data-contracts";
import { ContentType, HttpClient, type RequestParams } from "./http-client";

export class EmailConfig<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags EmailConfig
   * @name EmailConfigList
   * @request GET:/api/EmailConfig
   */
  emailConfigList = (params: RequestParams = {}) =>
    this.request<EmailConfigDto, any>({
      path: `/api/EmailConfig`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags EmailConfig
   * @name EmailConfigUpdate
   * @request PUT:/api/EmailConfig
   */
  emailConfigUpdate = (
    data: UpsertEmailConfigRequest,
    params: RequestParams = {},
  ) =>
    this.request<EmailConfigDto, any>({
      path: `/api/EmailConfig`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags EmailConfig
   * @name EmailConfigDelete
   * @request DELETE:/api/EmailConfig
   */
  emailConfigDelete = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/EmailConfig`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags EmailConfig
   * @name EmailConfigTestCreate
   * @request POST:/api/EmailConfig/test
   */
  emailConfigTestCreate = (
    data: TestEmailConfigRequest,
    params: RequestParams = {},
  ) =>
    this.request<TestConnectionResult, any>({
      path: `/api/EmailConfig/test`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}
