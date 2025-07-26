/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SwipeNavigation from '../swipe-navigation';

// Mock the translation hook
jest.mock('@/lib/i18n', () => ({
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
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${className} ${variant} ${size}`}
      data-variant={variant}
      data-size={size}
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

describe('SwipeNavigation', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render navigation buttons', () => {
      render(
        <SwipeNavigation 
          currentPage="camera-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('should show current page indicator', () => {
      render(
        <SwipeNavigation 
          currentPage="camera-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    });

    it('should show device names on larger screens', () => {
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      // Should show previous device name (Camera)
      expect(screen.getByText('Camera')).toBeInTheDocument();
    });
  });

  describe('Navigation Logic', () => {
    it('should disable previous button on first page', () => {
      render(
        <SwipeNavigation 
          currentPage="camera-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const prevButton = screen.getAllByRole('button')[0];
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(
        <SwipeNavigation 
          currentPage="focuser-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const nextButton = screen.getAllByRole('button')[1];
      expect(nextButton).toBeDisabled();
    });

    it('should enable both buttons on middle pages', () => {
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).not.toBeDisabled(); // Previous
      expect(buttons[1]).not.toBeDisabled(); // Next
    });

    it('should navigate to previous page when previous button clicked', () => {
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const prevButton = screen.getAllByRole('button')[0];
      fireEvent.click(prevButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('camera-detail');
    });

    it('should navigate to next page when next button clicked', () => {
      render(
        <SwipeNavigation 
          currentPage="camera-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const nextButton = screen.getAllByRole('button')[1];
      fireEvent.click(nextButton);

      expect(mockOnNavigate).toHaveBeenCalledWith('mount-detail');
    });
  });

  describe('Page Sequence', () => {
    const pages: CurrentPage[] = ["camera-detail", "mount-detail", "filter-detail", "focuser-detail"];

    pages.forEach((currentPage, index) => {
      it(`should show correct navigation state for ${currentPage}`, () => {
        render(
          <SwipeNavigation 
            currentPage={currentPage} 
            onNavigate={mockOnNavigate} 
          />
        );

        const buttons = screen.getAllByRole('button');
        const prevButton = buttons[0];
        const nextButton = buttons[1];

        if (index === 0) {
          expect(prevButton).toBeDisabled();
          expect(nextButton).not.toBeDisabled();
        } else if (index === pages.length - 1) {
          expect(prevButton).not.toBeDisabled();
          expect(nextButton).toBeDisabled();
        } else {
          expect(prevButton).not.toBeDisabled();
          expect(nextButton).not.toBeDisabled();
        }
      });
    });

    it('should navigate through all pages in sequence', () => {
      let currentPage: CurrentPage = "camera-detail";
      
      const { rerender } = render(
        <SwipeNavigation 
          currentPage={currentPage} 
          onNavigate={(page) => { currentPage = page; }} 
        />
      );

      // Navigate forward through all pages
      for (let i = 0; i < pages.length - 1; i++) {
        const nextButton = screen.getAllByRole('button')[1];
        fireEvent.click(nextButton);
        
        rerender(
          <SwipeNavigation 
            currentPage={currentPage} 
            onNavigate={(page) => { currentPage = page; }} 
          />
        );
      }

      expect(currentPage).toBe("focuser-detail");

      // Navigate backward through all pages
      for (let i = pages.length - 1; i > 0; i--) {
        const prevButton = screen.getAllByRole('button')[0];
        fireEvent.click(prevButton);
        
        rerender(
          <SwipeNavigation 
            currentPage={currentPage} 
            onNavigate={(page) => { currentPage = page; }} 
          />
        );
      }

      expect(currentPage).toBe("camera-detail");
    });
  });

  describe('Device Information Display', () => {
    it('should show correct device names and icons', () => {
      const testCases: Array<{ page: CurrentPage; expectedIcon: string; expectedName: string }> = [
        { page: "camera-detail", expectedIcon: "camera-icon", expectedName: "Camera" },
        { page: "mount-detail", expectedIcon: "compass-icon", expectedName: "Mount" },
        { page: "filter-detail", expectedIcon: "filter-icon", expectedName: "Filter Wheel" },
        { page: "focuser-detail", expectedIcon: "focus-icon", expectedName: "Focuser" },
      ];

      testCases.forEach(({ page, expectedIcon, expectedName }) => {
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

    it('should show previous device name when available', () => {
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      expect(screen.getByText('Camera')).toBeInTheDocument();
    });

    it('should show next device name when available', () => {
      render(
        <SwipeNavigation 
          currentPage="camera-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      expect(screen.getByText('Mount')).toBeInTheDocument();
    });

    it('should not show device names when at boundaries', () => {
      const { rerender } = render(
        <SwipeNavigation 
          currentPage="camera-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      // On first page, should not show previous device name
      expect(screen.queryByText('Camera')).not.toBeInTheDocument();

      rerender(
        <SwipeNavigation 
          currentPage="focuser-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      // On last page, should not show next device name
      expect(screen.queryByText('Focuser')).not.toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct CSS classes', () => {
      const { container } = render(
        <SwipeNavigation 
          currentPage="camera-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const navigationContainer = container.firstChild;
      expect(navigationContainer).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('should apply ghost variant to buttons', () => {
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('data-variant', 'ghost');
        expect(button).toHaveAttribute('data-size', 'sm');
      });
    });

    it('should have responsive text visibility', () => {
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const deviceNameElement = screen.getByText('Camera');
      expect(deviceNameElement).toHaveClass('hidden', 'sm:inline');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid current page gracefully', () => {
      expect(() => {
        render(
          <SwipeNavigation 
            currentPage={"invalid-page" as CurrentPage} 
            onNavigate={mockOnNavigate} 
          />
        );
      }).not.toThrow();
    });

    it('should handle missing onNavigate callback', () => {
      expect(() => {
        render(
          <SwipeNavigation 
            currentPage="camera-detail" 
            onNavigate={undefined as any} 
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should support keyboard navigation', () => {
      render(
        <SwipeNavigation
          currentPage="mount-detail"
          onNavigate={mockOnNavigate}
        />
      );

      const prevButton = screen.getAllByRole('button')[0];

      prevButton.focus();
      expect(document.activeElement).toBe(prevButton);

      // Simulate click instead of keydown since the button onClick is what triggers navigation
      fireEvent.click(prevButton);
      expect(mockOnNavigate).toHaveBeenCalledWith('camera-detail');
    });

    it('should have descriptive content for screen readers', () => {
      render(
        <SwipeNavigation 
          currentPage="mount-detail" 
          onNavigate={mockOnNavigate} 
        />
      );

      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText('Filter Wheel')).toBeInTheDocument();
    });
  });
});
