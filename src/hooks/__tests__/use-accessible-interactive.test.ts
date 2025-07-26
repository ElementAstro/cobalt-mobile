/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useAccessibleInteractive } from '../use-accessibility';

describe('useAccessibleInteractive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should provide accessible props for interactive elements', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
          ariaLabel: 'Test button',
          disabled: false,
        })
      );

      const props = result.current.getAccessibleProps();

      expect(props).toEqual({
        ref: expect.any(Object),
        className: expect.any(String),
        role: 'button',
        tabIndex: 0,
        'aria-label': 'Test button',
        'aria-disabled': false,
        onKeyDown: expect.any(Function),
        onClick: expect.any(Function),
      });
    });

    it('should handle keyboard activation with Enter key', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
        })
      );

      const props = result.current.getAccessibleProps();
      
      // Simulate Enter key press
      act(() => {
        props.onKeyDown({ key: 'Enter', preventDefault: jest.fn() } as any);
      });

      expect(mockOnActivate).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard activation with Space key', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
        })
      );

      const props = result.current.getAccessibleProps();
      
      // Simulate Space key press
      act(() => {
        props.onKeyDown({ key: ' ', preventDefault: jest.fn() } as any);
      });

      expect(mockOnActivate).toHaveBeenCalledTimes(1);
    });

    it('should handle click activation', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
        })
      );

      const props = result.current.getAccessibleProps();
      
      act(() => {
        props.onClick();
      });

      expect(mockOnActivate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('should not activate when disabled', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
          disabled: true,
        })
      );

      const props = result.current.getAccessibleProps();
      
      act(() => {
        props.onKeyDown({ key: 'Enter', preventDefault: jest.fn() } as any);
        props.onClick();
      });

      expect(mockOnActivate).not.toHaveBeenCalled();
      expect(props['aria-disabled']).toBe(true);
      expect(props.tabIndex).toBe(-1);
    });

    it('should update disabled state dynamically', () => {
      const mockOnActivate = jest.fn();
      let disabled = false;
      
      const { result, rerender } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
          disabled,
        })
      );

      // Initially enabled
      let props = result.current.getAccessibleProps();
      expect(props['aria-disabled']).toBe(false);
      expect(props.tabIndex).toBe(0);

      // Update to disabled
      disabled = true;
      rerender();
      
      props = result.current.getAccessibleProps();
      expect(props['aria-disabled']).toBe(true);
      expect(props.tabIndex).toBe(-1);
    });
  });

  describe('Custom Configuration', () => {
    it('should handle custom role', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
          role: 'menuitem',
        })
      );

      const props = result.current.getAccessibleProps();
      expect(props.role).toBe('menuitem');
    });

    it('should handle custom aria attributes', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
          ariaLabel: 'Custom label',
          ariaExpanded: true,
          ariaHaspopup: 'menu',
        })
      );

      const props = result.current.getAccessibleProps();
      expect(props['aria-label']).toBe('Custom label');
      expect(props['aria-expanded']).toBe(true);
      expect(props['aria-haspopup']).toBe('menu');
    });

    it('should handle custom tabIndex', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
          tabIndex: 5,
        })
      );

      const props = result.current.getAccessibleProps();
      expect(props.tabIndex).toBe(5);
    });
  });

  describe('Event Handling', () => {
    it('should prevent default on activation keys', () => {
      const mockOnActivate = jest.fn();
      const mockPreventDefault = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
        })
      );

      const props = result.current.getAccessibleProps();
      
      act(() => {
        props.onKeyDown({ 
          key: 'Enter', 
          preventDefault: mockPreventDefault 
        } as any);
      });

      expect(mockPreventDefault).toHaveBeenCalled();
      expect(mockOnActivate).toHaveBeenCalled();
    });

    it('should not prevent default on non-activation keys', () => {
      const mockOnActivate = jest.fn();
      const mockPreventDefault = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
        })
      );

      const props = result.current.getAccessibleProps();
      
      act(() => {
        props.onKeyDown({ 
          key: 'Tab', 
          preventDefault: mockPreventDefault 
        } as any);
      });

      expect(mockPreventDefault).not.toHaveBeenCalled();
      expect(mockOnActivate).not.toHaveBeenCalled();
    });

    it('should handle Escape key without activation', () => {
      const mockOnActivate = jest.fn();
      const mockPreventDefault = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
        })
      );

      const props = result.current.getAccessibleProps();
      
      act(() => {
        props.onKeyDown({ 
          key: 'Escape', 
          preventDefault: mockPreventDefault 
        } as any);
      });

      expect(mockPreventDefault).not.toHaveBeenCalled();
      expect(mockOnActivate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onActivate callback', () => {
      expect(() => {
        renderHook(() =>
          useAccessibleInteractive({
            onActivate: undefined as any,
          })
        );
      }).not.toThrow();
    });

    it('should handle activation with missing callback gracefully', () => {
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: undefined as any,
        })
      );

      const props = result.current.getAccessibleProps();
      
      expect(() => {
        act(() => {
          props.onClick();
          props.onKeyDown({ key: 'Enter', preventDefault: jest.fn() } as any);
        });
      }).not.toThrow();
    });

    it('should handle malformed event objects', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
        })
      );

      const props = result.current.getAccessibleProps();
      
      expect(() => {
        act(() => {
          props.onKeyDown({} as any);
          props.onKeyDown(null as any);
        });
      }).not.toThrow();
    });
  });

  describe('Accessibility Best Practices', () => {
    it('should provide proper ARIA attributes for buttons', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
          ariaLabel: 'Submit form',
        })
      );

      const props = result.current.getAccessibleProps();
      
      expect(props.role).toBe('button');
      expect(props['aria-label']).toBe('Submit form');
      expect(props.tabIndex).toBe(0);
    });

    it('should support menu items with proper attributes', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
          role: 'menuitem',
          ariaHaspopup: 'submenu',
          ariaExpanded: false,
        })
      );

      const props = result.current.getAccessibleProps();
      
      expect(props.role).toBe('menuitem');
      expect(props['aria-haspopup']).toBe('submenu');
      expect(props['aria-expanded']).toBe(false);
    });

    it('should support toggle buttons', () => {
      const mockOnActivate = jest.fn();
      const { result } = renderHook(() =>
        useAccessibleInteractive({
          onActivate: mockOnActivate,
          ariaPressed: true,
        })
      );

      const props = result.current.getAccessibleProps();
      
      expect(props['aria-pressed']).toBe(true);
    });
  });
});
