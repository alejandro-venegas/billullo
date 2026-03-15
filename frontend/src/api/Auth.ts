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
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
} from "./data-contracts";
import { ContentType, HttpClient, type RequestParams } from "./http-client";

export class Auth<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Auth
   * @name AuthRegisterCreate
   * @request POST:/api/Auth/register
   */
  authRegisterCreate = (data: RegisterRequest, params: RequestParams = {}) =>
    this.request<AuthResponse, any>({
      path: `/api/Auth/register`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthLoginCreate
   * @request POST:/api/Auth/login
   */
  authLoginCreate = (data: LoginRequest, params: RequestParams = {}) =>
    this.request<AuthResponse, any>({
      path: `/api/Auth/login`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthRefreshCreate
   * @request POST:/api/Auth/refresh
   */
  authRefreshCreate = (data: RefreshRequest, params: RequestParams = {}) =>
    this.request<AuthResponse, any>({
      path: `/api/Auth/refresh`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthLogoutCreate
   * @request POST:/api/Auth/logout
   */
  authLogoutCreate = (data: RefreshRequest, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/Auth/logout`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
