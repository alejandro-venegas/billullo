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
  TestScrapeResult,
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
   * @name EmailConfigGet
   * @request GET:/api/EmailConfig
   */
  emailConfigGet = (params: RequestParams = {}) =>
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
   * @name EmailConfigUpsert
   * @request PUT:/api/EmailConfig
   */
  emailConfigUpsert = (
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
    this.request<Blob, any>({
      path: `/api/EmailConfig`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags EmailConfig
   * @name EmailConfigTestConnection
   * @request POST:/api/EmailConfig/test
   */
  emailConfigTestConnection = (
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
  /**
   * No description
   *
   * @tags EmailConfig
   * @name EmailConfigTestScrape
   * @request POST:/api/EmailConfig/test-scrape
   */
  emailConfigTestScrape = (params: RequestParams = {}) =>
    this.request<TestScrapeResult, any>({
      path: `/api/EmailConfig/test-scrape`,
      method: "POST",
      format: "json",
      ...params,
    });
  /**
   * @name EmailConfigScrape
   * @request POST:/api/EmailConfig/scrape
   */
  emailConfigScrape = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/EmailConfig/scrape`,
      method: "POST",
      ...params,
    });
}
