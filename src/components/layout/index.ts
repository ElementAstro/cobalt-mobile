// Desktop Layout Components
export {
  DesktopLayout,
  DESKTOP_BREAKPOINTS,
  DESKTOP_SIDEBAR_WIDTHS,
  DESKTOP_SPACING,
} from './desktop-layout';

export {
  DesktopGrid,
  DesktopColumns,
  DesktopMasonry,
  DesktopGridPresets,
  DESKTOP_GRID_CONFIGS,
  DESKTOP_GRID_GAPS,
} from './desktop-grid';

export {
  DesktopSidebarNavigation,
  DesktopBreadcrumbs,
  DesktopHeader,
  DesktopTabs,
} from './desktop-navigation';

export {
  DesktopDashboardLayout,
  DesktopContentLayout,
  DesktopMultiPanelLayout,
  DesktopSplitLayout,
  DesktopTabbedLayout,
  DesktopCardGridLayout,
} from './desktop-page-layouts';

export {
  AdaptiveLayout,
  ResponsiveWrapper,
  LayoutTransition,
  AdaptiveGrid,
  LayoutProvider,
  LayoutContext,
  useLayoutContext,
} from './adaptive-layout';

// Desktop Utilities
export {
  DesktopOnly,
  MobileOnly,
  BreakpointIndicator,
  DesktopViewSwitcher,
  DesktopDensityControl,
  DesktopPanelResizer,
  DesktopFullscreenToggle,
  DesktopResponsiveContainer,
  DesktopAnimationWrapper,
} from '../ui/desktop-utilities';

// Desktop Hooks
export {
  useDesktopResponsive,
  useDesktopLayoutPreferences,
  useDesktopGrid,
  useDesktopKeyboardShortcuts,
  useDesktopMouse,
  getDesktopSpacing,
  getDesktopFontSize,
} from '../../hooks/use-desktop-responsive';

// Types
export type {
  DesktopBreakpoint,
  DesktopResponsiveState,
  DesktopLayoutPreferences,
  DesktopGridConfig,
  DesktopKeyboardShortcuts,
  DesktopMouseState,
} from '../../hooks/use-desktop-responsive';
