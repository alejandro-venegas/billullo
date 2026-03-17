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
  CategoryRuleDto,
  CreateCategoryRuleRequest,
  RuleMatchResult,
  UpdateCategoryRuleRequest,
} from "./data-contracts";
import { ContentType, HttpClient, type RequestParams } from "./http-client";

export class Rules<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Rules
   * @name RulesGetAll
   * @request GET:/api/Rules
   */
  rulesGetAll = (params: RequestParams = {}) =>
    this.request<CategoryRuleDto[], any>({
      path: `/api/Rules`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Rules
   * @name RulesCreate
   * @request POST:/api/Rules
   */
  rulesCreate = (data: CreateCategoryRuleRequest, params: RequestParams = {}) =>
    this.request<CategoryRuleDto, any>({
      path: `/api/Rules`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Rules
   * @name RulesGetById
   * @request GET:/api/Rules/{id}
   */
  rulesGetById = (id: number, params: RequestParams = {}) =>
    this.request<CategoryRuleDto, any>({
      path: `/api/Rules/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Rules
   * @name RulesUpdate
   * @request PUT:/api/Rules/{id}
   */
  rulesUpdate = (
    id: number,
    data: UpdateCategoryRuleRequest,
    params: RequestParams = {},
  ) =>
    this.request<CategoryRuleDto, any>({
      path: `/api/Rules/${id}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Rules
   * @name RulesDelete
   * @request DELETE:/api/Rules/{id}
   */
  rulesDelete = (id: number, params: RequestParams = {}) =>
    this.request<Blob, any>({
      path: `/api/Rules/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Rules
   * @name RulesMatch
   * @request GET:/api/Rules/match
   */
  rulesMatch = (
    query?: {
      description?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<RuleMatchResult, any>({
      path: `/api/Rules/match`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Rules
   * @name RulesDeleteByCategoryId
   * @request DELETE:/api/Rules/by-category/{categoryId}
   */
  rulesDeleteByCategoryId = (categoryId: number, params: RequestParams = {}) =>
    this.request<Blob, any>({
      path: `/api/Rules/by-category/${categoryId}`,
      method: "DELETE",
      ...params,
    });
}
