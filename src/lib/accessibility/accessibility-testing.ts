/**
 * Accessibility Testing Utilities
 * Automated accessibility testing and validation
 */

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  element: string;
  message: string;
  suggestion: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface AccessibilityReport {
  score: number; // 0-100
  issues: AccessibilityIssue[];
  passedChecks: string[];
  summary: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  recommendations: string[];
}

/**
 * Comprehensive accessibility checker
 */
export class AccessibilityChecker {
  private rules: Map<string, (element: Element) => AccessibilityIssue[]> = new Map();

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    // Color contrast checking
    this.rules.set('color-contrast', (element) => {
      const issues: AccessibilityIssue[] = [];
      const style = window.getComputedStyle(element);
      const bgColor = style.backgroundColor;
      const textColor = style.color;
      
      if (bgColor && textColor) {
        const contrast = this.calculateContrast(bgColor, textColor);
        if (contrast < 4.5) {
          issues.push({
            type: 'error',
            rule: 'color-contrast',
            element: this.getElementSelector(element),
            message: `Insufficient color contrast ratio: ${contrast.toFixed(2)}`,
            suggestion: 'Increase contrast to at least 4.5:1 for normal text',
            severity: 'serious'
          });
        }
      }
      
      return issues;
    });

    // Alt text for images
    this.rules.set('img-alt', (element) => {
      const issues: AccessibilityIssue[] = [];
      if (element.tagName === 'IMG') {
        const img = element as HTMLImageElement;
        if (!img.alt && !img.getAttribute('aria-label')) {
          issues.push({
            type: 'error',
            rule: 'img-alt',
            element: this.getElementSelector(element),
            message: 'Image missing alt text',
            suggestion: 'Add descriptive alt text or aria-label',
            severity: 'serious'
          });
        }
      }
      return issues;
    });

    // Form labels
    this.rules.set('form-labels', (element) => {
      const issues: AccessibilityIssue[] = [];
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        const input = element as HTMLInputElement;
        const hasLabel = this.hasAssociatedLabel(input);
        
        if (!hasLabel && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
          issues.push({
            type: 'error',
            rule: 'form-labels',
            element: this.getElementSelector(element),
            message: 'Form control missing label',
            suggestion: 'Add a label element or aria-label attribute',
            severity: 'serious'
          });
        }
      }
      return issues;
    });

    // Keyboard navigation
    this.rules.set('keyboard-navigation', (element) => {
      const issues: AccessibilityIssue[] = [];
      if (this.isInteractive(element)) {
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex === '-1' && !element.getAttribute('aria-hidden')) {
          issues.push({
            type: 'warning',
            rule: 'keyboard-navigation',
            element: this.getElementSelector(element),
            message: 'Interactive element not keyboard accessible',
            suggestion: 'Remove tabindex="-1" or add keyboard event handlers',
            severity: 'moderate'
          });
        }
      }
      return issues;
    });

    // ARIA attributes
    this.rules.set('aria-attributes', (element) => {
      const issues: AccessibilityIssue[] = [];
      const ariaAttributes = Array.from(element.attributes).filter(attr => 
        attr.name.startsWith('aria-')
      );
      
      ariaAttributes.forEach(attr => {
        if (!this.isValidAriaAttribute(attr.name, attr.value)) {
          issues.push({
            type: 'error',
            rule: 'aria-attributes',
            element: this.getElementSelector(element),
            message: `Invalid ARIA attribute: ${attr.name}="${attr.value}"`,
            suggestion: 'Check ARIA specification for valid values',
            severity: 'moderate'
          });
        }
      });
      
      return issues;
    });

    // Touch target size
    this.rules.set('touch-targets', (element) => {
      const issues: AccessibilityIssue[] = [];
      if (this.isInteractive(element)) {
        const rect = element.getBoundingClientRect();
        const minSize = 44; // 44px minimum touch target
        
        if (rect.width < minSize || rect.height < minSize) {
          issues.push({
            type: 'warning',
            rule: 'touch-targets',
            element: this.getElementSelector(element),
            message: `Touch target too small: ${rect.width}x${rect.height}px`,
            suggestion: `Increase size to at least ${minSize}x${minSize}px`,
            severity: 'moderate'
          });
        }
      }
      return issues;
    });
  }

  public checkElement(element: Element): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    this.rules.forEach((rule, ruleName) => {
      try {
        const ruleIssues = rule(element);
        issues.push(...ruleIssues);
      } catch (error) {
        console.warn(`Error running accessibility rule ${ruleName}:`, error);
      }
    });
    
    return issues;
  }

  public checkPage(): AccessibilityReport {
    const allElements = document.querySelectorAll('*');
    const allIssues: AccessibilityIssue[] = [];
    const passedChecks: string[] = [];
    
    allElements.forEach(element => {
      const issues = this.checkElement(element);
      allIssues.push(...issues);
    });

    // Count issues by severity
    const summary = {
      critical: allIssues.filter(i => i.severity === 'critical').length,
      serious: allIssues.filter(i => i.severity === 'serious').length,
      moderate: allIssues.filter(i => i.severity === 'moderate').length,
      minor: allIssues.filter(i => i.severity === 'minor').length,
    };

    // Calculate score (100 - weighted penalty)
    const score = Math.max(0, 100 - (
      summary.critical * 25 +
      summary.serious * 10 +
      summary.moderate * 5 +
      summary.minor * 1
    ));

    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues);

    return {
      score,
      issues: allIssues,
      passedChecks,
      summary,
      recommendations
    };
  }

  private calculateContrast(bg: string, fg: string): number {
    // Simplified contrast calculation
    // In production, would use proper color parsing and WCAG formula
    const bgLum = this.getLuminance(bg);
    const fgLum = this.getLuminance(fg);
    
    const lighter = Math.max(bgLum, fgLum);
    const darker = Math.min(bgLum, fgLum);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(color: string): number {
    // Simplified luminance calculation
    // Would need proper color parsing in production
    return 0.5; // Placeholder
  }

  private hasAssociatedLabel(input: HTMLInputElement): boolean {
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return true;
    }
    
    // Check if input is inside a label
    const parentLabel = input.closest('label');
    return !!parentLabel;
  }

  private isInteractive(element: Element): boolean {
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'];
    const hasClickHandler = element.getAttribute('onclick') || 
                           element.getAttribute('role') === 'button';
    
    return interactiveTags.includes(element.tagName) || hasClickHandler;
  }

  private isValidAriaAttribute(name: string, value: string): boolean {
    // Simplified ARIA validation
    // In production, would check against full ARIA specification
    const validAttributes = [
      'aria-label', 'aria-labelledby', 'aria-describedby',
      'aria-expanded', 'aria-hidden', 'aria-live',
      'aria-atomic', 'aria-relevant', 'aria-busy'
    ];
    
    return validAttributes.includes(name);
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations: string[] = [];
    const issueTypes = new Set(issues.map(i => i.rule));
    
    if (issueTypes.has('color-contrast')) {
      recommendations.push('Improve color contrast ratios throughout the application');
    }
    
    if (issueTypes.has('img-alt')) {
      recommendations.push('Add descriptive alt text to all images');
    }
    
    if (issueTypes.has('form-labels')) {
      recommendations.push('Ensure all form controls have proper labels');
    }
    
    if (issueTypes.has('keyboard-navigation')) {
      recommendations.push('Improve keyboard navigation support');
    }
    
    if (issueTypes.has('touch-targets')) {
      recommendations.push('Increase touch target sizes for mobile accessibility');
    }
    
    return recommendations;
  }
}

/**
 * Quick accessibility check for development
 */
export function quickAccessibilityCheck(): AccessibilityReport {
  const checker = new AccessibilityChecker();
  return checker.checkPage();
}

/**
 * Accessibility testing hook for React components
 */
export function useAccessibilityTesting(enabled: boolean = process.env.NODE_ENV === 'development') {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  
  const runCheck = useCallback(() => {
    if (!enabled) return;
    
    setTimeout(() => {
      const checker = new AccessibilityChecker();
      const newReport = checker.checkPage();
      setReport(newReport);
      
      if (newReport.issues.length > 0) {
        console.group('🔍 Accessibility Issues Found');
        newReport.issues.forEach(issue => {
          console.warn(`${issue.severity.toUpperCase()}: ${issue.message}`, {
            element: issue.element,
            suggestion: issue.suggestion
          });
        });
        console.groupEnd();
      }
    }, 100);
  }, [enabled]);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  return { report, runCheck };
}

export default AccessibilityChecker;
