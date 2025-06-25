/**
 * Global validation constants for the application
 */

export const VALIDATION_LIMITS = {
  /** Maximum length for message content and text parts */
  MESSAGE_MAX_LENGTH: 16348,

  /** Maximum length for file and attachment names */
  FILE_NAME_MAX_LENGTH: 2000,

  /** Maximum file size for uploads (in bytes) */
  FILE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Convenience exports for commonly used limits
 */
export const MESSAGE_MAX_LENGTH = VALIDATION_LIMITS.MESSAGE_MAX_LENGTH;
export const FILE_NAME_MAX_LENGTH = VALIDATION_LIMITS.FILE_NAME_MAX_LENGTH;
export const FILE_MAX_SIZE = VALIDATION_LIMITS.FILE_MAX_SIZE;

/**
 * Toolkit registry constants
 */
export const TOOLKITS = {
  GOOGLE_DRIVE: "google-drive",
} as const;
