/**
 * Input sanitization utilities for XSS and injection prevention
 * TC-87: Güvenlik & Spam Önlemi
 */

/**
 * HTML entities map for escaping dangerous characters
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string with HTML entities escaped
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove potentially dangerous HTML tags and scripts
 * @param input - The input string to sanitize
 * @returns Sanitized string with dangerous content removed
 */
export function stripDangerousTags(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  
  // Remove data: protocol for potential XSS
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, '');
  
  // Remove iframe, object, embed tags
  sanitized = sanitized.replace(/<(iframe|object|embed|form)[^>]*>.*?<\/\1>/gi, '');
  sanitized = sanitized.replace(/<(iframe|object|embed|form)[^>]*\/?>/gi, '');
  
  // Remove style tags with expressions
  sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gi, '');
  
  // Remove meta, link, base tags
  sanitized = sanitized.replace(/<(meta|link|base)[^>]*\/?>/gi, '');
  
  return sanitized;
}

/**
 * SQL injection patterns to detect and block
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|TRUNCATE|GRANT|REVOKE)\b)/gi,
  /(--)|(;)|(\/\*)|(\*\/)/g,
  /'(\s*)(OR|AND)(\s*)'?(\s*)(\d+|')/gi,
  /"(\s*)(OR|AND)(\s*)"?(\s*)(\d+|")/gi,
  /\b(OR|AND)\b\s+\d+\s*=\s*\d+/gi,
  /\b(OR|AND)\b\s+'[^']*'\s*=\s*'[^']*'/gi,
];

/**
 * Check if input contains potential SQL injection patterns
 * @param input - The input string to check
 * @returns Object with isValid boolean and detected patterns
 */
export function detectSqlInjection(input: string): { isValid: boolean; detectedPatterns: string[] } {
  if (!input || typeof input !== 'string') {
    return { isValid: true, detectedPatterns: [] };
  }
  
  const detectedPatterns: string[] = [];
  
  for (const pattern of SQL_INJECTION_PATTERNS) {
    const matches = input.match(pattern);
    if (matches) {
      detectedPatterns.push(...matches);
    }
  }
  
  return {
    isValid: detectedPatterns.length === 0,
    detectedPatterns,
  };
}

/**
 * XSS patterns to detect
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<svg\s+onload/gi,
  /<img\s+[^>]*onerror/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*["']?\s*javascript/gi,
];

/**
 * Check if input contains potential XSS patterns
 * @param input - The input string to check
 * @returns Object with isValid boolean and detected patterns
 */
export function detectXss(input: string): { isValid: boolean; detectedPatterns: string[] } {
  if (!input || typeof input !== 'string') {
    return { isValid: true, detectedPatterns: [] };
  }
  
  const detectedPatterns: string[] = [];
  
  for (const pattern of XSS_PATTERNS) {
    const matches = input.match(pattern);
    if (matches) {
      detectedPatterns.push(...matches);
    }
  }
  
  return {
    isValid: detectedPatterns.length === 0,
    detectedPatterns,
  };
}

/**
 * Comprehensive input sanitization that handles XSS and common injection patterns
 * @param input - The input string to sanitize
 * @returns Sanitized string safe for display and storage
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Step 1: Trim whitespace
  let sanitized = input.trim();
  
  // Step 2: Remove dangerous HTML tags and scripts
  sanitized = stripDangerousTags(sanitized);
  
  // Step 3: Escape remaining HTML entities
  sanitized = escapeHtml(sanitized);
  
  return sanitized;
}

/**
 * Validate and sanitize user input for forms
 * Returns validation result and sanitized value
 * @param input - The input string to validate and sanitize
 * @param options - Validation options
 * @returns Validation result with sanitized value
 */
export function validateAndSanitize(
  input: string,
  options: {
    maxLength?: number;
    minLength?: number;
    allowHtml?: boolean;
    checkSqlInjection?: boolean;
    checkXss?: boolean;
  } = {}
): {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
  warnings: string[];
} {
  const {
    maxLength = 10000,
    minLength = 0,
    allowHtml = false,
    checkSqlInjection = true,
    checkXss = true,
  } = options;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!input || typeof input !== 'string') {
    return {
      isValid: minLength === 0,
      sanitizedValue: '',
      errors: minLength > 0 ? ['Input is required'] : [],
      warnings: [],
    };
  }
  
  // Check length constraints
  if (input.length < minLength) {
    errors.push(`Input must be at least ${minLength} characters`);
  }
  
  if (input.length > maxLength) {
    errors.push(`Input must be no more than ${maxLength} characters`);
  }
  
  // Check for XSS patterns
  if (checkXss) {
    const xssResult = detectXss(input);
    if (!xssResult.isValid) {
      warnings.push('Potentially unsafe content detected and removed');
    }
  }
  
  // Check for SQL injection patterns
  if (checkSqlInjection) {
    const sqlResult = detectSqlInjection(input);
    if (!sqlResult.isValid) {
      warnings.push('Potentially unsafe patterns detected');
    }
  }
  
  // Sanitize the input
  let sanitizedValue = input;
  if (!allowHtml) {
    sanitizedValue = sanitizeInput(input);
  }
  
  // Enforce max length on sanitized value
  if (sanitizedValue.length > maxLength) {
    sanitizedValue = sanitizedValue.substring(0, maxLength);
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue,
    errors,
    warnings,
  };
}

/**
 * Safe text display - use when rendering user-generated content
 * @param text - The text to make safe for display
 * @returns Safe text for rendering
 */
export function safeText(text: string): string {
  return escapeHtml(text || '');
}
