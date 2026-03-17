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
  UpdatePreferencesRequest,
  UserDto,
} from "./data-contracts";
import { ContentType, HttpClient, type RequestParams } from "./http-client";

export class Auth<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Auth
   * @name AuthRegister
   * @request POST:/api/Auth/register
   */
  authRegister = (data: RegisterRequest, params: RequestParams = {}) =>
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
   * @name AuthLogin
   * @request POST:/api/Auth/login
   */
  authLogin = (data: LoginRequest, params: RequestParams = {}) =>
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
   * @name AuthRefresh
   * @request POST:/api/Auth/refresh
   */
  authRefresh = (data: RefreshRequest, params: RequestParams = {}) =>
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
   * @name AuthLogout
   * @request POST:/api/Auth/logout
   */
  authLogout = (data: RefreshRequest, params: RequestParams = {}) =>
    this.request<Blob, any>({
      path: `/api/Auth/logout`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthGetPreferences
   * @request GET:/api/Auth/preferences
   */
  authGetPreferences = (params: RequestParams = {}) =>
    this.request<UserDto, any>({
      path: `/api/Auth/preferences`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthUpdatePreferences
   * @request PATCH:/api/Auth/preferences
   */
  authUpdatePreferences = (
    data: UpdatePreferencesRequest,
    params: RequestParams = {},
  ) =>
    this.request<UserDto, any>({
      path: `/api/Auth/preferences`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}
