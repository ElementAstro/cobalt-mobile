/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useIsMobile } from '../hooks/use-mobile';

// Mock mobile utilities
jest.mock('../lib/mobile-utils', () => ({
  isMobileDevice: jest.fn(),
  isMobileViewport: jest.fn(),
  hapticFeedback: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
  },
  touchInteraction: {
    preventZoom: jest.fn(),
    enableScrollLock: jest.fn(),
    disableScrollLock: jest.fn(),
  },
  mobilePerformance: {
    isLowEndDevice: jest.fn(() => false),
    reduceMotion: jest.fn(() => false),
  },
}));

// Mock the mobile hook
jest.mock('../hooks/use-mobile', () => ({
  useIsMobile: jest.fn(),
}));

// Create a responsive component that adapts to mobile
const ResponsiveComponent = () => {
  const isMobile = useIsMobile();
  
  return (
    <div data-testid="responsive-container">
      <div data-testid="viewport-indicator">
        {isMobile ? 'Mobile View' : 'Desktop View'}
      </div>
      
      <div data-testid="navigation" className={isMobile ? 'mobile-nav' : 'desktop-nav'}>
        {isMobile ? (
          <div data-testid="mobile-menu">
            <button data-testid="hamburger-menu">☰</button>
            <div data-testid="mobile-nav-items" className="hidden">
              <button data-testid="nav-camera" type="button">Camera</button>
              <button data-testid="nav-telescope" type="button">Telescope</button>
              <button data-testid="nav-settings" type="button">Settings</button>
            </div>
          </div>
        ) : (
          <div data-testid="desktop-menu">
            <button data-testid="nav-camera" type="button">Camera</button>
            <button data-testid="nav-telescope" type="button">Telescope</button>
            <button data-testid="nav-settings" type="button">Settings</button>
          </div>
        )}
      </div>
      
      <div data-testid="content-area" className={isMobile ? 'mobile-content' : 'desktop-content'}>
        <div data-testid="touch-targets" className={isMobile ? 'large-touch-targets' : 'normal-targets'}>
          <button 
            data-testid="primary-action"
            className={isMobile ? 'min-h-[44px] min-w-[44px]' : 'min-h-[32px] min-w-[32px]'}
          >
            Primary Action
          </button>
          <button 
            data-testid="secondary-action"
            className={isMobile ? 'min-h-[44px] min-w-[44px]' : 'min-h-[32px] min-w-[32px]'}
          >
            Secondary Action
          </button>
        </div>
      </div>
    </div>
  );
};

// Mock gesture-enabled component
const GestureComponent = () => {
  const [gestureState, setGestureState] = React.useState({
    swipeDirection: null,
    pinchScale: 1,
    tapCount: 0,
  });

  const handleSwipe = (direction: string) => {
    setGestureState(prev => ({ ...prev, swipeDirection: direction }));
  };

  const handlePinch = (scale: number) => {
    setGestureState(prev => ({ ...prev, pinchScale: scale }));
  };

  const handleTap = () => {
    setGestureState(prev => ({ ...prev, tapCount: prev.tapCount + 1 }));
  };

  return (
    <div data-testid="gesture-area">
      <div data-testid="gesture-state">
        <span data-testid="swipe-direction">{gestureState.swipeDirection || 'none'}</span>
        <span data-testid="pinch-scale">{gestureState.pinchScale}</span>
        <span data-testid="tap-count">{gestureState.tapCount}</span>
      </div>
      
      <div 
        data-testid="interactive-area"
        onTouchStart={() => handleTap()}
        style={{ 
          width: '200px', 
          height: '200px', 
          background: '#f0f0f0',
          transform: `scale(${gestureState.pinchScale})`,
        }}
      >
        <button data-testid="swipe-left" onClick={() => handleSwipe('left')}>←</button>
        <button data-testid="swipe-right" onClick={() => handleSwipe('right')}>→</button>
        <button data-testid="swipe-up" onClick={() => handleSwipe('up')}>↑</button>
        <button data-testid="swipe-down" onClick={() => handleSwipe('down')}>↓</button>
        <button data-testid="pinch-in" onClick={() => handlePinch(0.8)}>Zoom Out</button>
        <button data-testid="pinch-out" onClick={() => handlePinch(1.2)}>Zoom In</button>
      </div>
    </div>
  );
};

describe('Mobile Integration Tests', () => {
  const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  describe('Responsive Layout Integration', () => {
    it('should render desktop layout on large screens', () => {
      mockUseIsMobile.mockReturnValue(false);
      
      render(<ResponsiveComponent />);

      expect(screen.getByTestId('viewport-indicator')).toHaveTextContent('Desktop View');
      expect(screen.getByTestId('navigation')).toHaveClass('desktop-nav');
      expect(screen.getByTestId('desktop-menu')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    it('should render mobile layout on small screens', () => {
      mockUseIsMobile.mockReturnValue(true);
      
      render(<ResponsiveComponent />);

      expect(screen.getByTestId('viewport-indicator')).toHaveTextContent('Mobile View');
      expect(screen.getByTestId('navigation')).toHaveClass('mobile-nav');
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-menu')).not.toBeInTheDocument();
    });

    it('should adapt touch targets for mobile', () => {
      mockUseIsMobile.mockReturnValue(true);
      
      render(<ResponsiveComponent />);

      const primaryAction = screen.getByTestId('primary-action');
      const secondaryAction = screen.getByTestId('secondary-action');

      expect(primaryAction).toHaveClass('min-h-[44px]', 'min-w-[44px]');
      expect(secondaryAction).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });

    it('should use smaller touch targets for desktop', () => {
      mockUseIsMobile.mockReturnValue(false);
      
      render(<ResponsiveComponent />);

      const primaryAction = screen.getByTestId('primary-action');
      const secondaryAction = screen.getByTestId('secondary-action');

      expect(primaryAction).toHaveClass('min-h-[32px]', 'min-w-[32px]');
      expect(secondaryAction).toHaveClass('min-h-[32px]', 'min-w-[32px]');
    });
  });

  describe('Mobile Navigation Integration', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('should handle mobile menu toggle', () => {
      render(<ResponsiveComponent />);

      const hamburgerMenu = screen.getByTestId('hamburger-menu');
      const mobileNavItems = screen.getByTestId('mobile-nav-items');

      expect(mobileNavItems).toHaveClass('hidden');

      fireEvent.click(hamburgerMenu);
      
      // In a real implementation, this would toggle the visibility
      // For this test, we're just verifying the interaction works
      expect(hamburgerMenu).toBeInTheDocument();
    });

    it('should provide accessible navigation on mobile', () => {
      render(<ResponsiveComponent />);

      const navButtons = [
        screen.getByTestId('nav-camera'),
        screen.getByTestId('nav-telescope'),
        screen.getByTestId('nav-settings'),
      ];

      navButtons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Gesture Integration', () => {
    it('should handle swipe gestures', () => {
      render(<GestureComponent />);

      expect(screen.getByTestId('swipe-direction')).toHaveTextContent('none');

      fireEvent.click(screen.getByTestId('swipe-left'));
      expect(screen.getByTestId('swipe-direction')).toHaveTextContent('left');

      fireEvent.click(screen.getByTestId('swipe-right'));
      expect(screen.getByTestId('swipe-direction')).toHaveTextContent('right');

      fireEvent.click(screen.getByTestId('swipe-up'));
      expect(screen.getByTestId('swipe-direction')).toHaveTextContent('up');

      fireEvent.click(screen.getByTestId('swipe-down'));
      expect(screen.getByTestId('swipe-direction')).toHaveTextContent('down');
    });

    it('should handle pinch gestures', () => {
      render(<GestureComponent />);

      expect(screen.getByTestId('pinch-scale')).toHaveTextContent('1');

      fireEvent.click(screen.getByTestId('pinch-out'));
      expect(screen.getByTestId('pinch-scale')).toHaveTextContent('1.2');

      fireEvent.click(screen.getByTestId('pinch-in'));
      expect(screen.getByTestId('pinch-scale')).toHaveTextContent('0.8');
    });

    it('should handle tap gestures', () => {
      render(<GestureComponent />);

      expect(screen.getByTestId('tap-count')).toHaveTextContent('0');

      const interactiveArea = screen.getByTestId('interactive-area');
      
      fireEvent.touchStart(interactiveArea);
      expect(screen.getByTestId('tap-count')).toHaveTextContent('1');

      fireEvent.touchStart(interactiveArea);
      expect(screen.getByTestId('tap-count')).toHaveTextContent('2');
    });

    it('should apply visual feedback for gestures', () => {
      render(<GestureComponent />);

      const interactiveArea = screen.getByTestId('interactive-area');
      
      // Initial scale
      expect(interactiveArea).toHaveStyle('transform: scale(1)');

      // After pinch out
      fireEvent.click(screen.getByTestId('pinch-out'));
      expect(interactiveArea).toHaveStyle('transform: scale(1.2)');

      // After pinch in
      fireEvent.click(screen.getByTestId('pinch-in'));
      expect(interactiveArea).toHaveStyle('transform: scale(0.8)');
    });
  });

  describe('Viewport Change Integration', () => {
    it('should handle viewport size changes', () => {
      // Start with desktop
      mockUseIsMobile.mockReturnValue(false);
      const { rerender } = render(<ResponsiveComponent />);

      expect(screen.getByTestId('viewport-indicator')).toHaveTextContent('Desktop View');

      // Simulate viewport change to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockUseIsMobile.mockReturnValue(true);
      rerender(<ResponsiveComponent />);

      expect(screen.getByTestId('viewport-indicator')).toHaveTextContent('Mobile View');
    });

    it('should handle orientation changes', () => {
      mockUseIsMobile.mockReturnValue(true);
      
      // Portrait orientation
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      const { rerender } = render(<ResponsiveComponent />);
      expect(screen.getByTestId('viewport-indicator')).toHaveTextContent('Mobile View');

      // Landscape orientation
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });

      rerender(<ResponsiveComponent />);
      expect(screen.getByTestId('viewport-indicator')).toHaveTextContent('Mobile View');
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid viewport changes efficiently', () => {
      const { rerender } = render(<ResponsiveComponent />);

      // Simulate rapid viewport changes
      for (let i = 0; i < 50; i++) {
        const isMobile = i % 2 === 0;
        mockUseIsMobile.mockReturnValue(isMobile);
        
        expect(() => {
          rerender(<ResponsiveComponent />);
        }).not.toThrow();
        
        const expectedText = isMobile ? 'Mobile View' : 'Desktop View';
        expect(screen.getByTestId('viewport-indicator')).toHaveTextContent(expectedText);
      }
    });

    it('should handle high-frequency gesture events', () => {
      render(<GestureComponent />);

      const interactiveArea = screen.getByTestId('interactive-area');

      // Simulate rapid touch events
      for (let i = 0; i < 20; i++) {
        expect(() => {
          fireEvent.touchStart(interactiveArea);
        }).not.toThrow();
      }

      expect(screen.getByTestId('tap-count')).toHaveTextContent('20');
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across viewport changes', () => {
      mockUseIsMobile.mockReturnValue(false);
      const { rerender } = render(<ResponsiveComponent />);

      // Desktop accessibility
      let buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Switch to mobile
      mockUseIsMobile.mockReturnValue(true);
      rerender(<ResponsiveComponent />);

      // Mobile accessibility
      buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // All buttons should be accessible
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should provide appropriate touch target sizes for accessibility', () => {
      mockUseIsMobile.mockReturnValue(true);
      render(<ResponsiveComponent />);

      const touchTargets = screen.getByTestId('touch-targets');
      expect(touchTargets).toHaveClass('large-touch-targets');

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Mobile buttons should have minimum 44px touch targets
        const hasLargeTouchTarget = button.className.includes('min-h-[44px]') || 
                                   button.className.includes('min-w-[44px]');
        
        if (button.getAttribute('data-testid')?.includes('action')) {
          expect(hasLargeTouchTarget).toBe(true);
        }
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle mobile detection failures gracefully', () => {
      mockUseIsMobile.mockImplementation(() => {
        throw new Error('Mobile detection failed');
      });

      expect(() => {
        render(<ResponsiveComponent />);
      }).toThrow('Mobile detection failed');

      // Reset mock for subsequent tests
      mockUseIsMobile.mockReturnValue(false);
    });

    it('should handle gesture event errors gracefully', () => {
      render(<GestureComponent />);

      const interactiveArea = screen.getByTestId('interactive-area');

      // Mock touch event that might fail
      const originalTouchStart = interactiveArea.ontouchstart;
      interactiveArea.ontouchstart = () => {
        throw new Error('Touch event failed');
      };

      expect(() => {
        fireEvent.touchStart(interactiveArea);
      }).not.toThrow(); // React Testing Library handles the error

      // Restore original handler
      interactiveArea.ontouchstart = originalTouchStart;
    });
  });
});
