import { convertCurrency } from '../../src/lib/utils';

describe('Utility Functions', () => {
  describe('convertCurrency', () => {
    it('should return the same amount when currencies are the same', () => {
      expect(convertCurrency(100, 'USD', 'USD')).toBe(100);
      expect(convertCurrency(100, 'EUR', 'EUR')).toBe(100);
      expect(convertCurrency(100, 'GBP', 'GBP')).toBe(100);
    });

    it('should convert USD to other currencies correctly', () => {
      expect(convertCurrency(100, 'USD', 'EUR')).toBe(92);
      
      expect(convertCurrency(100, 'USD', 'GBP')).toBe(79);
      
      expect(convertCurrency(100, 'USD', 'JPY')).toBe(15120);
    });

    it('should convert other currencies to USD correctly', () => {
      expect(convertCurrency(92, 'EUR', 'USD')).toBe(100);
      
      expect(convertCurrency(79, 'GBP', 'USD')).toBe(100);
      
      expect(convertCurrency(15120, 'JPY', 'USD')).toBeCloseTo(100, 0);
    });

    it('should convert between non-USD currencies correctly', () => {
      expect(convertCurrency(100, 'EUR', 'GBP')).toBeCloseTo(85.87, 1);
      
      expect(convertCurrency(100, 'GBP', 'EUR')).toBeCloseTo(116.45, 1);
      
      expect(convertCurrency(15000, 'JPY', 'CAD')).toBeCloseTo(135.91, 1);
    });

    it('should handle fractional amounts correctly', () => {
      expect(convertCurrency(10.55, 'USD', 'EUR')).toBeCloseTo(9.71, 2);
      expect(convertCurrency(10.55, 'USD', 'GBP')).toBeCloseTo(8.33, 2);
      
      expect(convertCurrency(10.559, 'USD', 'EUR')).toBe(9.71);
    });
  });
}); 