import { describe, it, expect } from 'vitest';
import { validateEmail, validateAccountId } from './validation';

describe('validation', () => {
  describe('validateEmail', () => {
    it('should return valid for correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email обязателен');
    });

    it('should return invalid for incorrect email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email введен неверно');
    });

    it('should return invalid for email without domain', () => {
      const result = validateEmail('test@');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email введен неверно');
    });
  });

  describe('validateAccountId', () => {
    it('should return valid for correct account ID', () => {
      const result = validateAccountId('steamuser123', 'top-up');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty account ID', () => {
      const result = validateAccountId('', 'top-up');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ID аккаунта обязателен');
    });

    it('should return invalid for too short account ID', () => {
      const result = validateAccountId('ab', 'top-up');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Проверьте формат ID');
    });

    it('should return invalid for account ID with invalid characters', () => {
      const result = validateAccountId('user@123', 'top-up');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ID содержит недопустимые символы');
    });

    it('should accept valid characters for top-up', () => {
      const result = validateAccountId('user_123-abc', 'top-up');
      expect(result.valid).toBe(true);
    });
  });
});
