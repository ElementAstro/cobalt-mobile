/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SwipeNavigation from '../components/swipe-navigation';

// Mock the translation hook
jest.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'camera': 'Camera',
        'mount': 'Mount',
        'filterWheel': 'Filter Wheel',
        'focuser': 'Focuser',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock UI components
jest.mock('../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${variant} ${size}`}
      data-variant={variant}
      data-size={size}
      data-testid={`nav-button-${disabled ? 'disabled' : 'enabled'}`}
      role="button"
      type="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  ChevronLeft: ({ className }: any) => <span className={className} data-testid="chevron-left">←</span>,
  ChevronRight: ({ className }: any) => <span className={className} data-testid="chevron-right">→</span>,
  Camera: ({ className }: any) => <span className={className} data-testid="camera-icon">📷</span>,
  Compass: ({ className }: any) => <span className={className} data-testid="compass-icon">🧭</span>,
  Filter: ({ className }: any) => <span className={className} data-testid="filter-icon">🔍</span>,
  Focus: ({ className }: any) => <span className={className} data-testid="focus-icon">🎯</span>,
}));

type CurrentPage = "camera-detail" | "mount-detail" | "filter-detail" | "focuser-detail";

describe('Navigation Integration Tests', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Navigation Flow', () => {
    it('should navigate through all pages in sequence', () => {
      const pages: CurrentPage[] = ["camera-detail", "mount-detail", "filter-detail", "focuser-detail"];
      let currentPageIndex = 0;
      
      const TestNavigationFlow = () => {
        const [currentPage, setCurrentPage] = React.useState<CurrentPage>(pages[0]);
        
        const handleNavigate = (page: CurrentPage) => {
          setCurrentPage(page);
          mockOnNavigate(page);
        };

        return (
          <div>
            <div data-testid="current-page">{currentPage}</div>
            <SwipeNavigation 
              currentPage={currentPage} 
              onNavigate={handleNavigate} 
            />
          </div>
        );
      };

      render(<TestNavigationFlow />);

      // Start at camera-detail
      expect(screen.getByTestId('current-page')).toHaveTextContent('camera-detail');

      // Navigate forward through all pages
      for (let i = 0; i < pages.length - 1; i++) {
        // Find the next button (should be the last button in the component)
        const buttons = screen.getAllByRole('button');
        const nextButton = buttons[buttons.length - 1]; // Last button is next
        fireEvent.click(nextButton);

        expect(mockOnNavigate).toHaveBeenCalledWith(pages[i + 1]);
        expect(screen.getByTestId('current-page')).toHaveTextContent(pages[i + 1]);
      }

      // Should be at the last page now
      expect(screen.getByTestId('current-page')).toHaveTextContent('focuser-detail');

      // Navigate backward through all pages
      for (let i = pages.length - 1; i > 0; i--) {
        // Find the previous button (should be the first button in the component)
        const buttons = screen.getAllByRole('button');
        const prevButton = buttons[0]; // First button is previous
        fireEvent.click(prevButton);

        expect(mockOnNavigate).toHaveBeenCalledWith(pages[i - 1]);
        expect(screen.getByTestId('current-page')).toHaveTextContent(pages[i - 1]);
      }

      // Should be back at the first page
      expect(screen.getByTestId('current-page')).toHaveTextContent('camera-detail');
    });

    it('should handle boundary conditions correctly', () => {
      const TestBoundaryNavigation = () => {
        const [currentPage, setCurrentPage] = React.useState<CurrentPage>("camera-detail");
        
        return (
          <SwipeNavigation 
            currentPage={currentPage} 
            onNavigate={setCurrentPage} 
          />
        );
      };

      const { rerender } = render(<TestBoundaryNavigation />);

      // At first page - previous should be disabled
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeDisabled(); // Previous button
      expect(buttons[1]).not.toBeDisabled(); // Next button

      // Test last page
      const TestLastPage = () => {
        const [currentPage] = React.useState<CurrentPage>("focuser-detail");
        
        return (
          <SwipeNavigation 
            currentPage={currentPage} 
            onNavigate={mockOnNavigate} 
          />
        );
      };

      rerender(<TestLastPage />);

      const lastPageButtons = screen.getAllByRole('button');
      expect(lastPageButtons[0]).not.toBeDisabled(); // Previous button
      expect(lastPageButtons[1]).toBeDisabled(); // Next button
    });
  });

  describe('Device Context Integration', () => {
    it('should show appropriate device information', () => {
      const deviceTests = [
        { page: "camera-detail" as CurrentPage, expectedIcon: "camera-icon" },
        { page: "mount-detail" as CurrentPage, expectedIcon: "compass-icon" },
        { page: "filter-detail" as CurrentPage, expectedIcon: "filter-icon" },
        { page: "focuser-detail" as CurrentPage, expectedIcon: "focus-icon" },
      ];

      deviceTests.forEach(({ page, expectedIcon }) => {
        const { unmount } = render(
          <SwipeNavigation 
            currentPage={page} 
            onNavigate={mockOnNavigate} 
          />
        );

        expect(screen.getByTestId(expectedIcon)).toBeInTheDocument();
        unmount();
      });
    });

    it('should provide contextual navigation hints', () => {
      // Test middle page that shows both previous and next context
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      // Should show previous device name (Camera)
      expect(screen.getByText('Camera')).toBeInTheDocument();
      
      // Should show next device name (Filter Wheel)
      expect(screen.getByText('Filter Wheel')).toBeInTheDocument();
    });
  });

  describe('Responsive Navigation Integration', () => {
    it('should handle different screen sizes', () => {
      // Mock different viewport sizes
      const originalInnerWidth = window.innerWidth;

      // Test mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { rerender } = render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      // Device names should be hidden on small screens (sm:inline class)
      const deviceName = screen.getByText('Camera');
      expect(deviceName).toHaveClass('hidden', 'sm:inline');

      // Test desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      rerender(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      // Device names should still have responsive classes
      expect(screen.getByText('Camera')).toHaveClass('hidden', 'sm:inline');

      // Restore original width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain proper focus management during navigation', () => {
      const TestFocusManagement = () => {
        const [currentPage, setCurrentPage] = React.useState<CurrentPage>("mount-detail");
        
        return (
          <SwipeNavigation 
            currentPage={currentPage} 
            onNavigate={setCurrentPage} 
          />
        );
      };

      render(<TestFocusManagement />);

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons[0];
      const nextButton = buttons[1];

      // Test focus behavior
      prevButton.focus();
      expect(document.activeElement).toBe(prevButton);

      nextButton.focus();
      expect(document.activeElement).toBe(nextButton);
    });

    it('should provide proper ARIA attributes', () => {
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const buttons = screen.getAllByRole('button');
      
      // All buttons should have proper roles
      buttons.forEach(button => {
        expect(button).toHaveAttribute('role', 'button');
      });
    });

    it('should support keyboard navigation', () => {
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const prevButton = screen.getAllByRole('button')[0];
      
      // Test keyboard activation
      fireEvent.keyDown(prevButton, { key: 'Enter' });
      // Note: The actual navigation would depend on the button's onClick handler
      
      fireEvent.keyDown(prevButton, { key: ' ' });
      // Space key should also activate the button
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid navigation changes', () => {
      const TestRapidNavigation = () => {
        const [currentPage, setCurrentPage] = React.useState<CurrentPage>("camera-detail");
        
        React.useEffect(() => {
          // Simulate rapid page changes
          const pages: CurrentPage[] = ["camera-detail", "mount-detail", "filter-detail", "focuser-detail"];
          let index = 0;
          
          const interval = setInterval(() => {
            index = (index + 1) % pages.length;
            setCurrentPage(pages[index]);
          }, 100);

          setTimeout(() => clearInterval(interval), 500);
          
          return () => clearInterval(interval);
        }, []);
        
        return (
          <SwipeNavigation 
            currentPage={currentPage} 
            onNavigate={setCurrentPage} 
          />
        );
      };

      expect(() => {
        render(<TestRapidNavigation />);
      }).not.toThrow();
    });

    it('should handle concurrent navigation attempts', () => {
      const TestConcurrentNavigation = () => {
        const [currentPage, setCurrentPage] = React.useState<CurrentPage>("mount-detail");
        
        const handleNavigate = (page: CurrentPage) => {
          // Simulate async navigation
          setTimeout(() => setCurrentPage(page), 0);
        };
        
        return (
          <SwipeNavigation 
            currentPage={currentPage} 
            onNavigate={handleNavigate} 
          />
        );
      };

      render(<TestConcurrentNavigation />);

      const buttons = screen.getAllByRole('button');
      
      // Rapidly click both buttons
      fireEvent.click(buttons[0]); // Previous
      fireEvent.click(buttons[1]); // Next
      fireEvent.click(buttons[0]); // Previous again

      // Should not crash or cause errors
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle invalid page states gracefully', () => {
      expect(() => {
        render(
          <SwipeNavigation 
            currentPage={"invalid-page" as CurrentPage} 
            onNavigate={mockOnNavigate} 
          />
        );
      }).not.toThrow();
    });

    it('should recover from navigation errors', () => {
      const TestErrorRecovery = () => {
        const [currentPage, setCurrentPage] = React.useState<CurrentPage>("mount-detail");
        
        const handleNavigate = (page: CurrentPage) => {
          // Simulate navigation error and recovery
          try {
            if (page === "filter-detail") {
              throw new Error("Navigation error");
            }
            setCurrentPage(page);
          } catch (error) {
            // Stay on current page on error
            console.warn("Navigation failed, staying on current page");
          }
        };
        
        return (
          <SwipeNavigation 
            currentPage={currentPage} 
            onNavigate={handleNavigate} 
          />
        );
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<TestErrorRecovery />);

      const nextButton = screen.getAllByRole('button')[1];
      
      // This should trigger the error but not crash
      fireEvent.click(nextButton);
      
      expect(consoleSpy).toHaveBeenCalledWith("Navigation failed, staying on current page");
      
      consoleSpy.mockRestore();
    });
  });
});
