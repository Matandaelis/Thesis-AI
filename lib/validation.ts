/**
 * Validation utilities for API requests and data integrity.
 * Provides runtime type checking for JSON data.
 */

// Type-safe validation result
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Safely parse JSON with error handling.
 */
export const parseJSON = <T = any>(text: string): ValidationResult<T> => {
  try {
    const data = JSON.parse(text);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Invalid JSON: ${message}` };
  }
};

/**
 * Validate a string is non-empty.
 */
export const validateString = (
  value: unknown, 
  fieldName: string,
  minLength = 1,
  maxLength = 10000
): ValidationResult<string> => {
  if (typeof value !== 'string') {
    return { success: false, error: `${fieldName} must be a string` };
  }
  
  const trimmed = value.trim();
  
  if (trimmed.length < minLength) {
    return { success: false, error: `${fieldName} is too short (minimum ${minLength} characters)` };
  }
  
  if (trimmed.length > maxLength) {
    return { success: false, error: `${fieldName} is too long (maximum ${maxLength} characters)` };
  }
  
  return { success: true, data: trimmed };
};

/**
 * Validate an array.
 */
export const validateArray = <T = any>(
  value: unknown,
  fieldName: string,
  maxLength = 1000
): ValidationResult<T[]> => {
  if (!Array.isArray(value)) {
    return { success: false, error: `${fieldName} must be an array` };
  }
  
  if (value.length > maxLength) {
    return { success: false, error: `${fieldName} exceeds maximum length of ${maxLength}` };
  }
  
  return { success: true, data: value };
};

/**
 * Validate an object.
 */
export const validateObject = (
  value: unknown,
  fieldName: string
): ValidationResult<Record<string, any>> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { success: false, error: `${fieldName} must be an object` };
  }
  
  return { success: true, data: value as Record<string, any> };
};

/**
 * Validate a number is within a range.
 */
export const validateNumber = (
  value: unknown,
  fieldName: string,
  min = -Infinity,
  max = Infinity
): ValidationResult<number> => {
  if (typeof value !== 'number' || isNaN(value)) {
    return { success: false, error: `${fieldName} must be a number` };
  }
  
  if (value < min || value > max) {
    return { success: false, error: `${fieldName} must be between ${min} and ${max}` };
  }
  
  return { success: true, data: value };
};

/**
 * Validate a boolean.
 */
export const validateBoolean = (
  value: unknown,
  fieldName: string
): ValidationResult<boolean> => {
  if (typeof value !== 'boolean') {
    return { success: false, error: `${fieldName} must be a boolean` };
  }
  
  return { success: true, data: value };
};

/**
 * Validate an embedding vector (array of numbers).
 */
export const validateEmbedding = (
  value: unknown,
  fieldName = 'embedding',
  expectedDimension?: number
): ValidationResult<number[]> => {
  if (!Array.isArray(value)) {
    return { success: false, error: `${fieldName} must be an array` };
  }
  
  if (value.length === 0) {
    return { success: false, error: `${fieldName} must not be empty` };
  }
  
  if (value.length > 10000) {
    return { success: false, error: `${fieldName} exceeds maximum length of 10000` };
  }
  
  // Validate all elements are numbers
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'number' || isNaN(value[i])) {
      return { success: false, error: `${fieldName}[${i}] must be a number` };
    }
  }
  
  // Validate dimension if expected
  if (expectedDimension !== undefined && value.length !== expectedDimension) {
    return { success: false, error: `${fieldName} dimension mismatch: expected ${expectedDimension}, got ${value.length}` };
  }
  
  return { success: true, data: value };
};

/**
 * Validate a date string in ISO format.
 */
export const validateDate = (
  value: unknown,
  fieldName: string
): ValidationResult<Date> => {
  if (typeof value !== 'string') {
    return { success: false, error: `${fieldName} must be a date string` };
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { success: false, error: `${fieldName} is not a valid date` };
  }
  
  return { success: true, data: date };
};

/**
 * Validate an enum value.
 */
export const validateEnum = <T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): ValidationResult<T> => {
  if (typeof value !== 'string') {
    return { success: false, error: `${fieldName} must be a string` };
  }
  
  if (!allowedValues.includes(value as T)) {
    return { success: false, error: `${fieldName} must be one of: ${allowedValues.join(', ')}` };
  }
  
  return { success: true, data: value as T };
};

/**
 * Create a validation error with a specific HTTP status.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
