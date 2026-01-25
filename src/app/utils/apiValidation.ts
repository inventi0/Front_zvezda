/**
 * Runtime API Response Validation
 * Validates API responses using Zod schemas
 */

import { z } from 'zod';
import { logger } from '@/app/utils/logger';

/**
 * Validate API response against Zod schema
 * 
 * @param data - Raw API response data
 * @param schema - Zod schema to validate against
 * @param context - Context for error messages (e.g., 'getProductById')
 * @returns Validated and typed data
 * @throws Error if validation fails
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`API response validation failed: ${context}`, error, {
        errors: error.errors,
        data: data instanceof Error ? error.message : data,
      });
      throw new Error(
        `Invalid API response format in ${context}: ${error.errors.map(e => e.message).join(', ')}`
      );
    }
    throw error;
  }
}
