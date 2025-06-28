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
import type * as accounts from "../accounts.js";
import type * as api_keys from "../api_keys.js";
import type * as authAdapter from "../authAdapter.js";
import type * as chat_actions from "../chat/actions.js";
import type * as chat_mutations from "../chat/mutations.js";
import type * as chat_node from "../chat/node.js";
import type * as chat_queries from "../chat/queries.js";
import type * as chat_shared from "../chat/shared.js";
import type * as files from "../files.js";
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
  accounts: typeof accounts;
  api_keys: typeof api_keys;
  authAdapter: typeof authAdapter;
  "chat/actions": typeof chat_actions;
  "chat/mutations": typeof chat_mutations;
  "chat/node": typeof chat_node;
  "chat/queries": typeof chat_queries;
  "chat/shared": typeof chat_shared;
  files: typeof files;
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
