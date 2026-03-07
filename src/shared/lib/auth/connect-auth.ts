import {
  getLoginPayload,
  doLogin,
  doLogout,
  isLoggedIn,
} from "@/src/shared/lib/auth/actions";

/**
 * Thirdweb ConnectButton `auth` prop config.
 * Shared across Sidebar and LoginFlow to avoid duplication.
 */
export const CONNECT_AUTH = { isLoggedIn, getLoginPayload, doLogin, doLogout } as const;
