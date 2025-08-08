/**
 * Security utilities for input validation, sanitization, and environment checks
 */

// Environment variable validation
export class EnvironmentValidator {
  private static requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_AWS_API_BASE_URL',
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID'
  ];

  // Sensitive variables that should NEVER have VITE_ prefix
  private static forbiddenViteVars = [
    'VITE_GOOGLE_CLIENT_SECRET',
    'VITE_SUPABASE_SERVICE_ROLE_KEY',
    'VITE_GITHUB_CLIENT_SECRET',
    'VITE_AWS_SECRET_ACCESS_KEY',
    'VITE_STRIPE_SECRET_KEY',
  ];

  static validateEnvironment(): { isValid: boolean; missingVars: string[]; exposedSecrets: string[] } {
    const missingVars: string[] = [];
    const exposedSecrets: string[] = [];
    
    // Check for required variables
    this.requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });

    // Check for exposed secrets
    this.forbiddenViteVars.forEach(varName => {
      if (process.env[varName]) {
        exposedSecrets.push(varName);
        console.error(`🚨 SECURITY RISK: ${varName} is exposed to the client! Remove VITE_ prefix and move to server-side.`);
      }
    });

    // Log security warnings in development
    if (process.env.NODE_ENV !== 'production' && exposedSecrets.length > 0) {
      console.warn(`
🔒 SECURITY WARNING: The following sensitive variables are exposed to the client:
${exposedSecrets.map(v => `- ${v}`).join('\n')}

These should be moved to server-side environment (.env.server) without the VITE_ prefix.
Client-side code should use Supabase Edge Functions for secure API calls.
      `);
    }

    return {
      isValid: missingVars.length === 0 && exposedSecrets.length === 0,
      missingVars,
      exposedSecrets
    };
  }

  static getSecureEnvVar(key: string): string {
    const altKey = key.startsWith('VITE_') ? `NEXT_PUBLIC_${key.slice(5)}` : key;
    const value = (process.env[key] || process.env[altKey]) as string | undefined;
    if (!value) {
      throw new Error(`Required environment variable ${key} is not configured`);
    }
    return value;
  }

  static logEnvironmentStatus(): void {
    if (typeof window === 'undefined') return; // avoid noisy logs during SSR
    console.log('🔍 Environment Security Check:');
    const { isValid, missingVars, exposedSecrets } = this.validateEnvironment();
    
    if (isValid) {
      console.log('✅ Environment configuration is secure');
    } else {
      if (missingVars.length > 0) {
        console.warn('⚠️ Missing required variables:', missingVars);
      }
      if (exposedSecrets.length > 0) {
        console.error('🚨 Security issues found:', exposedSecrets);
      }
    }
  }
}

// Input sanitization
export class InputSanitizer {
  /**
   * Sanitize HTML input to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Sanitize URL input
   */
  static sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL protocol');
      }
      return parsedUrl.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Remove potentially dangerous characters from general text input
   */
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  /**
   * Sanitize HTML email content - allows safe HTML tags but removes dangerous scripts
   */
  static sanitizeHtmlEmail(html: string): string {
    return html
      .trim()
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove javascript: protocols
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove form elements for security
      .replace(/<\s*(form|input|textarea|select|button)[^>]*>/gi, '')
      .replace(/<\/\s*(form|input|textarea|select|button)\s*>/gi, '');
  }
}

// Input validation
export class InputValidator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate that a string doesn't contain potential injection attacks
   */
  static isSafeText(text: string): boolean {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\(/i,
      /Function\(/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Validate HTML email content for security
   */
  static isSafeHtmlEmail(html: string): boolean {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<form/i,
      /<input/i,
      /<textarea/i,
      /<select/i,
      /<button/i,
      /eval\(/i,
      /Function\(/i,
      /document\./i,
      /window\./i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(html));
  }

  /**
   * Validate API response structure
   */
  static validateApiResponse(response: any, expectedFields: string[]): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }

    return expectedFields.every(field => field in response);
  }
}

// Security headers and CSP
export class SecurityHeaders {
  /**
   * Get recommended security headers for API requests
   */
  static getSecureHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }
}



// Error handling without information leakage
export class SecureErrorHandler {
  /**
   * Create user-safe error message without exposing sensitive information
   */
  static createSafeError(error: any, userMessage?: string): Error {
    // Log the full error for debugging (but not to user)
    console.error('Detailed error:', error);

    // Return sanitized error for user
    const safeMessage = userMessage || 'An error occurred. Please try again.';
    return new Error(safeMessage);
  }

  /**
   * Check if error message is safe to show to users
   */
  static isSafeErrorMessage(message: string): boolean {
    const sensitivePatterns = [
      /api[_-]?key/i,
      /secret/i,
      /token/i,
      /password/i,
      /internal server error/i,
      /database/i,
      /connection/i,
      /authentication failed/i
    ];

    return !sensitivePatterns.some(pattern => pattern.test(message));
  }
} 