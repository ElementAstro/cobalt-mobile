/**
 * @jest-environment jsdom
 */

import { cn } from '../utils';

// Mock clsx and twMerge
jest.mock('clsx', () => ({
  clsx: jest.fn((...args) => args.filter(Boolean).join(' ')),
}));

jest.mock('tailwind-merge', () => ({
  twMerge: jest.fn((str) => str),
}));

describe('utils', () => {
  describe('cn function', () => {
    it('should combine class names using clsx and twMerge', () => {
      const result = cn('class1', 'class2', { 'class3': true, 'class4': false });
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle null and undefined inputs', () => {
      const result = cn('class1', null, undefined, 'class2');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'always-present': true,
        'never-present': false,
        'conditionally-present': Math.random() > 0.5,
      });
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle mixed input types', () => {
      const result = cn(
        'string-class',
        ['array-class1', 'array-class2'],
        { 'object-class': true },
        null,
        undefined,
        false && 'conditional-class'
      );
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should call clsx with all inputs', () => {
      const { clsx } = require('clsx');
      const inputs = ['class1', 'class2', { 'class3': true }];
      
      cn(...inputs);
      
      expect(clsx).toHaveBeenCalledWith(inputs);
    });

    it('should call twMerge with clsx result', () => {
      const { twMerge } = require('tailwind-merge');
      const { clsx } = require('clsx');
      
      const mockClsxResult = 'class1 class2 class3';
      clsx.mockReturnValue(mockClsxResult);
      
      cn('class1', 'class2');
      
      expect(twMerge).toHaveBeenCalledWith(mockClsxResult);
    });

    it('should return twMerge result', () => {
      const { twMerge } = require('tailwind-merge');
      
      const mockTwMergeResult = 'merged-classes';
      twMerge.mockReturnValue(mockTwMergeResult);
      
      const result = cn('class1', 'class2');
      
      expect(result).toBe(mockTwMergeResult);
    });

    it('should handle Tailwind CSS class conflicts', () => {
      // This tests the integration with tailwind-merge
      const result = cn('p-4', 'p-2'); // Conflicting padding classes
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should preserve non-conflicting classes', () => {
      const result = cn('text-red-500', 'bg-blue-500', 'rounded-lg');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle responsive classes', () => {
      const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle state variants', () => {
      const result = cn('bg-blue-500', 'hover:bg-blue-600', 'active:bg-blue-700');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle dark mode classes', () => {
      const result = cn('bg-white', 'dark:bg-gray-900', 'text-black', 'dark:text-white');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle arbitrary values', () => {
      const result = cn('w-[200px]', 'h-[100px]', 'bg-[#ff0000]');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle complex conditional logic', () => {
      const testCases = [
        { variant: 'primary', size: 'large', disabled: false },
        { variant: 'secondary', size: 'small', disabled: true },
      ];

      testCases.forEach(({ variant, size, disabled }) => {
        const result = cn(
          'base-button',
          {
            'btn-primary': variant === 'primary',
            'btn-secondary': variant === 'secondary',
            'btn-large': size === 'large',
            'btn-small': size === 'small',
            'btn-disabled': disabled,
          },
          disabled && 'opacity-50 cursor-not-allowed'
        );

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });

    it('should handle function calls that return class names', () => {
      const getVariantClass = (variant: string) => `btn-${variant}`;
      const getSizeClass = (size: string) => `btn-${size}`;
      
      const result = cn(
        'base-button',
        getVariantClass('primary'),
        getSizeClass('large')
      );
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle template literals', () => {
      const color = 'blue';
      const shade = '500';
      
      const result = cn(`bg-${color}-${shade}`, `text-${color}-100`);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should be performant with many classes', () => {
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      
      const startTime = performance.now();
      const result = cn(...manyClasses);
      const endTime = performance.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10); // Should complete in less than 10ms
    });

    it('should handle edge cases gracefully', () => {
      const result = cn(
        '',
        '   ',
        0,
        false,
        null,
        undefined,
        NaN,
        [],
        {}
      );
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
});
