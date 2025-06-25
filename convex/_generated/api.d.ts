/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as api_keys from "../api_keys.js";
import type * as auth from "../auth.js";
import type * as authAdapter from "../authAdapter.js";
import type * as chat_actions from "../chat/actions.js";
import type * as chat_mutations from "../chat/mutations.js";
import type * as chat_node from "../chat/node.js";
import type * as chat_queries from "../chat/queries.js";
import type * as chat_shared from "../chat/shared.js";
import type * as googledrive_base from "../googledrive/base.js";
import type * as googledrive_client from "../googledrive/client.js";
import type * as googledrive_index from "../googledrive/index.js";
import type * as googledrive_mutations from "../googledrive/mutations.js";
import type * as googledrive_queries from "../googledrive/queries.js";
import type * as googledrive_server from "../googledrive/server.js";
import type * as googledrive_shared from "../googledrive/shared.js";
import type * as googledrive_tools_list_files_base from "../googledrive/tools/list_files/base.js";
import type * as googledrive_tools_list_files_client from "../googledrive/tools/list_files/client.js";
import type * as googledrive_tools_list_files_server from "../googledrive/tools/list_files/server.js";
import type * as googledrive_tools_read_file_base from "../googledrive/tools/read_file/base.js";
import type * as googledrive_tools_read_file_client from "../googledrive/tools/read_file/client.js";
import type * as googledrive_tools_read_file_server from "../googledrive/tools/read_file/server.js";
import type * as googledrive_tools_search_files_base from "../googledrive/tools/search_files/base.js";
import type * as googledrive_tools_search_files_client from "../googledrive/tools/search_files/client.js";
import type * as googledrive_tools_search_files_server from "../googledrive/tools/search_files/server.js";
import type * as googledrive_tools_tools from "../googledrive/tools/tools.js";
import type * as googledrive_utils from "../googledrive/utils.js";
import type * as http from "../http.js";
import type * as myFunctions from "../myFunctions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  api_keys: typeof api_keys;
  auth: typeof auth;
  authAdapter: typeof authAdapter;
  "chat/actions": typeof chat_actions;
  "chat/mutations": typeof chat_mutations;
  "chat/node": typeof chat_node;
  "chat/queries": typeof chat_queries;
  "chat/shared": typeof chat_shared;
  "googledrive/base": typeof googledrive_base;
  "googledrive/client": typeof googledrive_client;
  "googledrive/index": typeof googledrive_index;
  "googledrive/mutations": typeof googledrive_mutations;
  "googledrive/queries": typeof googledrive_queries;
  "googledrive/server": typeof googledrive_server;
  "googledrive/shared": typeof googledrive_shared;
  "googledrive/tools/list_files/base": typeof googledrive_tools_list_files_base;
  "googledrive/tools/list_files/client": typeof googledrive_tools_list_files_client;
  "googledrive/tools/list_files/server": typeof googledrive_tools_list_files_server;
  "googledrive/tools/read_file/base": typeof googledrive_tools_read_file_base;
  "googledrive/tools/read_file/client": typeof googledrive_tools_read_file_client;
  "googledrive/tools/read_file/server": typeof googledrive_tools_read_file_server;
  "googledrive/tools/search_files/base": typeof googledrive_tools_search_files_base;
  "googledrive/tools/search_files/client": typeof googledrive_tools_search_files_client;
  "googledrive/tools/search_files/server": typeof googledrive_tools_search_files_server;
  "googledrive/tools/tools": typeof googledrive_tools_tools;
  "googledrive/utils": typeof googledrive_utils;
  http: typeof http;
  myFunctions: typeof myFunctions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
