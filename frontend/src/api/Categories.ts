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
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "./data-contracts";
import { ContentType, HttpClient, type RequestParams } from "./http-client";

export class Categories<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Categories
   * @name CategoriesGetAll
   * @request GET:/api/Categories
   */
  categoriesGetAll = (params: RequestParams = {}) =>
    this.request<CategoryDto[], any>({
      path: `/api/Categories`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Categories
   * @name CategoriesCreate
   * @request POST:/api/Categories
   */
  categoriesCreate = (
    data: CreateCategoryRequest,
    params: RequestParams = {},
  ) =>
    this.request<CategoryDto, any>({
      path: `/api/Categories`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Categories
   * @name CategoriesGetById
   * @request GET:/api/Categories/{id}
   */
  categoriesGetById = (id: number, params: RequestParams = {}) =>
    this.request<CategoryDto, any>({
      path: `/api/Categories/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Categories
   * @name CategoriesUpdate
   * @request PUT:/api/Categories/{id}
   */
  categoriesUpdate = (
    id: number,
    data: UpdateCategoryRequest,
    params: RequestParams = {},
  ) =>
    this.request<CategoryDto, any>({
      path: `/api/Categories/${id}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Categories
   * @name CategoriesDelete
   * @request DELETE:/api/Categories/{id}
   */
  categoriesDelete = (id: number, params: RequestParams = {}) =>
    this.request<Blob, any>({
      path: `/api/Categories/${id}`,
      method: "DELETE",
      ...params,
    });
}
