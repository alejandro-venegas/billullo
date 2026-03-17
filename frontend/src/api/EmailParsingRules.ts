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
  CreateEmailParsingRuleRequest,
  EmailParsingRuleDto,
  TestEmailParsingResult,
  TestEmailParsingRuleRequest,
  UpdateEmailParsingRuleRequest,
} from "./data-contracts";
import { ContentType, HttpClient, type RequestParams } from "./http-client";

export class EmailParsingRules<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags EmailParsingRules
   * @name EmailParsingRulesGetAll
   * @request GET:/api/EmailParsingRules
   */
  emailParsingRulesGetAll = (params: RequestParams = {}) =>
    this.request<EmailParsingRuleDto[], any>({
      path: `/api/EmailParsingRules`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags EmailParsingRules
   * @name EmailParsingRulesCreate
   * @request POST:/api/EmailParsingRules
   */
  emailParsingRulesCreate = (
    data: CreateEmailParsingRuleRequest,
    params: RequestParams = {},
  ) =>
    this.request<EmailParsingRuleDto, any>({
      path: `/api/EmailParsingRules`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags EmailParsingRules
   * @name EmailParsingRulesGetById
   * @request GET:/api/EmailParsingRules/{id}
   */
  emailParsingRulesGetById = (id: number, params: RequestParams = {}) =>
    this.request<EmailParsingRuleDto, any>({
      path: `/api/EmailParsingRules/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags EmailParsingRules
   * @name EmailParsingRulesUpdate
   * @request PUT:/api/EmailParsingRules/{id}
   */
  emailParsingRulesUpdate = (
    id: number,
    data: UpdateEmailParsingRuleRequest,
    params: RequestParams = {},
  ) =>
    this.request<EmailParsingRuleDto, any>({
      path: `/api/EmailParsingRules/${id}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags EmailParsingRules
   * @name EmailParsingRulesDelete
   * @request DELETE:/api/EmailParsingRules/{id}
   */
  emailParsingRulesDelete = (id: number, params: RequestParams = {}) =>
    this.request<Blob, any>({
      path: `/api/EmailParsingRules/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags EmailParsingRules
   * @name EmailParsingRulesTestRule
   * @request POST:/api/EmailParsingRules/test
   */
  emailParsingRulesTestRule = (
    data: TestEmailParsingRuleRequest,
    params: RequestParams = {},
  ) =>
    this.request<TestEmailParsingResult, any>({
      path: `/api/EmailParsingRules/test`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}
