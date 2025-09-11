import { encrypt, decrypt } from '../../utils/encryption';

describe('Encryption Utils', () => {
  describe('encrypt and decrypt', () => {
    test('should encrypt and decrypt text correctly', () => {
      const originalText = 'This is a secret message';
      
      const encrypted = encrypt(originalText);
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toContain(':'); // Should contain separator
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    test('should handle empty strings', () => {
      const originalText = '';
      
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    test('should handle special characters', () => {
      const originalText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    test('should produce different encrypted values for same input', () => {
      const originalText = 'same input';
      
      const encrypted1 = encrypt(originalText);
      const encrypted2 = encrypt(originalText);
      
      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      expect(decrypt(encrypted1)).toBe(originalText);
      expect(decrypt(encrypted2)).toBe(originalText);
    });

    test('should handle long text', () => {
      const originalText = 'a'.repeat(1000);
      
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });

    test('should handle unicode characters', () => {
      const originalText = '🚀 Hello 世界 🌍';
      
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(originalText);
    });
  });
});