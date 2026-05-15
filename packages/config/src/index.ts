// Shared configuration constants across packages.
// Runtime values come from environment variables — never hardcode secrets here.

export const APP_NAME = 'Messenger';
export const APP_VERSION = '1.0.0';

export const DEFAULT_MESSAGE_PAGE_SIZE = 50;
export const DEFAULT_USERS_PAGE_SIZE = 20;
export const ACCESS_CODE_LENGTH = 12; // characters in the raw code
export const TYPING_DEBOUNCE_MS = 3000;
