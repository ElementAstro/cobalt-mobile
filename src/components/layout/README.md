# Desktop Layout System

A comprehensive desktop layout system that seamlessly integrates with the existing mobile-first Cobalt Mobile application. This system provides desktop-optimized layouts, navigation patterns, and responsive components while maintaining full compatibility with the mobile experience.

## Features

- 🖥️ **Desktop-First Layouts**: Optimized for desktop screen sizes with multi-column layouts, sidebars, and panels
- 📱 **Seamless Mobile Integration**: Automatically falls back to mobile layouts on smaller screens
- 🎨 **Consistent Design System**: Uses existing design tokens and components
- ⚡ **Performance Optimized**: Conditional rendering and optimized animations
- 🔧 **Highly Configurable**: Extensive customization options for different use cases
- ♿ **Accessible**: Full keyboard navigation and screen reader support

## Quick Start

### 1. Basic Adaptive Layout

Replace your existing layout with the adaptive layout that automatically switches between mobile and desktop:

```tsx
import { AdaptiveLayout, LayoutProvider } from '@/components/layout';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <LayoutProvider>
      <AdaptiveLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        title="My Application"
      >
        <YourContent />
      </AdaptiveLayout>
    </LayoutProvider>
  );
}
```

### 2. Desktop-Specific Components

Use desktop-only components that automatically hide on mobile:

```tsx
import { DesktopOnly, MobileOnly } from '@/components/layout';

function MyComponent() {
  return (
    <>
      <DesktopOnly>
        <AdvancedDesktopFeature />
      </DesktopOnly>
      
      <MobileOnly>
        <SimpleMobileVersion />
      </MobileOnly>
    </>
  );
}
```

### 3. Responsive Grids

Use desktop-optimized grids that adapt to screen size:

```tsx
import { DesktopGrid, DesktopGridPresets } from '@/components/layout';

function Dashboard() {
  return (
    <DesktopGrid
      columns={{ desktop: 3, wide: 4, ultrawide: 5 }}
      gap="lg"
    >
      {cards.map(card => <Card key={card.id}>{card.content}</Card>)}
    </DesktopGrid>
  );
}

// Or use presets
function QuickDashboard() {
  return (
    <DesktopGridPresets.Dashboard>
      {cards}
    </DesktopGridPresets.Dashboard>
  );
}
```

## Components

### Layout Components

#### `DesktopLayout`
The main desktop layout component with sidebar, header, and right panel support.

```tsx
<DesktopLayout
  sidebar={<Navigation />}
  header={<Header />}
  rightPanel={<InfoPanel />}
  sidebarCollapsible={true}
  spacing="standard"
  maxWidth="container"
>
  <MainContent />
</DesktopLayout>
```

#### `AdaptiveLayout`
Automatically switches between desktop and mobile layouts based on screen size.

```tsx
<AdaptiveLayout
  currentPage="dashboard"
  onPageChange={handlePageChange}
  enableDesktopSidebar={true}
  enableMobileNavigation={true}
>
  <Content />
</AdaptiveLayout>
```

### Grid Components

#### `DesktopGrid`
Responsive grid with desktop-optimized column counts.

```tsx
<DesktopGrid
  columns={{ desktop: 3, wide: 4, ultrawide: 5 }}
  gap="md"
  autoFit={false}
>
  {items}
</DesktopGrid>
```

#### `DesktopColumns`
CSS columns layout for text-heavy content.

```tsx
<DesktopColumns columns={3} gap="lg">
  <Article />
</DesktopColumns>
```

### Navigation Components

#### `DesktopSidebarNavigation`
Full-featured sidebar navigation with collapsible sections.

```tsx
<DesktopSidebarNavigation
  currentPage="dashboard"
  onPageChange={handlePageChange}
  collapsed={false}
/>
```

#### `DesktopHeader`
Desktop header with breadcrumbs, search, and actions.

```tsx
<DesktopHeader
  title="Dashboard"
  breadcrumbs={[
    { label: 'Home', onClick: () => navigate('/') },
    { label: 'Dashboard' }
  ]}
  actions={<HeaderActions />}
  onSearch={handleSearch}
/>
```

### Page Layout Components

#### `DesktopDashboardLayout`
Specialized layout for dashboard pages.

```tsx
<DesktopDashboardLayout
  title="Analytics Dashboard"
  metrics={metricsCards}
  primaryContent={<MainCharts />}
  secondaryContent={<SideInfo />}
  sidebar={<QuickActions />}
/>
```

#### `DesktopMultiPanelLayout`
Three-panel layout for complex interfaces.

```tsx
<DesktopMultiPanelLayout
  leftPanel={<FileTree />}
  centerPanel={<Editor />}
  rightPanel={<Properties />}
  leftPanelWidth={300}
  rightPanelWidth={250}
/>
```

### Utility Components

#### `DesktopOnly` / `MobileOnly`
Conditional rendering based on screen size.

```tsx
<DesktopOnly fallback={<MobileAlternative />}>
  <DesktopFeature />
</DesktopOnly>
```

#### `BreakpointIndicator`
Development helper to show current breakpoint (development only).

```tsx
<BreakpointIndicator />
```

## Hooks

### `useDesktopResponsive()`
Get current responsive state and breakpoint information.

```tsx
const { 
  isDesktop, 
  isMobile, 
  breakpoint, 
  width, 
  height 
} = useDesktopResponsive();
```

### `useDesktopLayoutPreferences()`
Manage user layout preferences with persistence.

```tsx
const {
  sidebarCollapsed,
  rightPanelCollapsed,
  gridDensity,
  toggleSidebar,
  setGridDensity
} = useDesktopLayoutPreferences();
```

### `useDesktopKeyboardShortcuts()`
Register desktop keyboard shortcuts.

```tsx
const { registerShortcut } = useDesktopKeyboardShortcuts();

useEffect(() => {
  registerShortcut('ctrl+k', openCommandPalette, 'Open command palette');
  registerShortcut('ctrl+/', toggleSidebar, 'Toggle sidebar');
}, []);
```

## Breakpoints

The system uses the following breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px  
- **Desktop**: 1024px - 1279px
- **Wide**: 1280px - 1535px
- **Ultrawide**: ≥ 1536px

## Customization

### Spacing
Configure spacing using the `DESKTOP_SPACING` constants:

```tsx
import { DESKTOP_SPACING } from '@/components/layout';

// Use predefined spacing
<div className={DESKTOP_SPACING.standard.padding}>
  Content
</div>
```

### Grid Presets
Use or extend the predefined grid configurations:

```tsx
import { DESKTOP_GRID_CONFIGS } from '@/components/layout';

const customConfig = {
  ...DESKTOP_GRID_CONFIGS.dashboard,
  columns: { desktop: 4, wide: 6, ultrawide: 8 }
};
```

## Integration with Existing Code

### Gradual Migration
You can gradually migrate existing components:

1. Wrap your app with `LayoutProvider`
2. Replace layout components one by one
3. Use `DesktopOnly`/`MobileOnly` for conditional features
4. Migrate to `AdaptiveLayout` when ready

### Existing Component Compatibility
All desktop components are designed to work with existing:
- UI components (Button, Card, etc.)
- Styling system (Tailwind classes)
- State management (Zustand store)
- Navigation patterns

## Examples

See `src/components/examples/desktop-layout-integration.tsx` for complete examples including:
- Dashboard with metrics and cards
- Multi-panel interfaces
- Responsive navigation
- Conditional desktop features

## Performance Considerations

- Desktop layouts only render on desktop screens
- Animations can be disabled via user preferences
- Components use conditional rendering to avoid unnecessary DOM
- Responsive hooks are optimized with proper cleanup

## Accessibility

- Full keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Reduced motion preferences respected
- ARIA labels and roles included
