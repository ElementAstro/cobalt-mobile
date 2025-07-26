# Cobalt Mobile Sequencer

A comprehensive, modular sequencer system for astrophotography automation built with React, TypeScript, and Zustand.

## 🚀 Features

### Core Functionality
- **Sequence Management**: Create, edit, duplicate, and organize imaging sequences
- **Step Types**: Support for capture, filter changes, focusing, slewing, waiting, calibration, and dithering
- **Real-time Execution**: Live progress tracking with step-by-step monitoring
- **Error Handling**: Robust error recovery with retry mechanisms
- **Validation**: Comprehensive sequence and step validation

### Advanced Features
- **Template System**: Built-in templates for common imaging scenarios (LRGB, planetary, calibration)
- **Import/Export**: Save and share sequences in JSON format
- **Notifications**: Real-time notifications with browser notification support
- **Statistics**: Track sequence performance and usage analytics
- **Search & Filter**: Advanced filtering and search capabilities

### User Interface
- **Tabbed Interface**: Organized into Status, Steps, Library, and Logs tabs
- **Step Editor**: Detailed editing for each step type with type-specific settings
- **Progress Tracking**: Visual progress bars and time estimates
- **Responsive Design**: Works on desktop and mobile devices

## 📁 Architecture

```
src/components/sequencer/
├── components/           # React components
│   ├── SequencerControl.tsx      # Main sequencer interface
│   ├── SequenceStatus.tsx        # Status display and controls
│   ├── StepList.tsx              # Step management and display
│   ├── StepEditor.tsx            # Step editing interface
│   ├── SequenceLibrary.tsx       # Library and template browser
│   ├── ExecutionLogs.tsx         # Logs and error display
│   ├── NotificationCenter.tsx    # Notification management
│   └── StepTemplateSelector.tsx  # Step type selection
├── hooks/               # Custom React hooks
│   ├── use-sequencer.ts          # Main sequencer hook
│   ├── use-sequence-execution.ts # Execution management
│   └── use-sequence-library.ts   # Library management
├── services/            # Business logic services
│   ├── execution.service.ts      # Sequence execution engine
│   ├── template.service.ts       # Template management
│   └── notification.service.ts   # Notification system
├── store/               # State management
│   └── sequencer.store.ts        # Zustand store
├── types/               # TypeScript definitions
│   └── sequencer.types.ts        # All type definitions
├── utils/               # Utility functions
│   └── sequencer.utils.ts        # Helper functions
├── __tests__/           # Test files
│   └── sequencer.test.ts         # Unit tests
└── index.ts             # Main exports
```

## 🛠 Usage

### Basic Usage

```tsx
import { SequencerControl } from '@/components/sequencer';

function App() {
  return <SequencerControl />;
}
```

### Using Hooks

```tsx
import { useSequencer } from '@/components/sequencer';

function MyComponent() {
  const {
    activeSequence,
    executionState,
    startSequence,
    pauseSequence,
    stopSequence,
  } = useSequencer();

  return (
    <div>
      <h2>{activeSequence?.name || 'No sequence selected'}</h2>
      <button onClick={() => startSequence()}>Start</button>
      <button onClick={() => pauseSequence()}>Pause</button>
      <button onClick={() => stopSequence()}>Stop</button>
    </div>
  );
}
```

### Creating Custom Step Types

```tsx
import { createStepTemplate } from '@/components/sequencer';

const customStep = createStepTemplate('capture');
customStep.name = 'Custom Capture';
customStep.settings = {
  exposure: 600,
  count: 50,
  binning: '2x2',
  frameType: 'light',
};
```

## 📋 Step Types

### Capture
- **Purpose**: Take images with the camera
- **Settings**: Exposure time, frame count, binning, gain, offset, dithering
- **Duration**: Calculated from exposure × count + overhead

### Filter
- **Purpose**: Change filter wheel position
- **Settings**: Filter position (1-8), optional name, wait time
- **Duration**: Movement time + settling time

### Focus
- **Purpose**: Perform focusing routine
- **Settings**: Auto/manual mode, position, tolerance, max attempts
- **Duration**: Variable based on focus method

### Slew
- **Purpose**: Move telescope to target coordinates
- **Settings**: RA/Dec coordinates, target name, plate solving, centering
- **Duration**: Slew time + optional plate solve time

### Wait
- **Purpose**: Pause execution for specified duration
- **Settings**: Wait duration, optional reason
- **Duration**: Specified wait time

### Calibration
- **Purpose**: Capture calibration frames (darks, flats, bias)
- **Settings**: Frame type, count, exposure, temperature
- **Duration**: Calculated from frame parameters

## 🔧 Configuration

### Store Persistence
The sequencer automatically persists:
- Sequence library
- User preferences
- Statistics
- Templates (custom only)

### Notifications
Configure browser notifications:
```tsx
import { notificationService } from '@/components/sequencer';

// Request permission
await notificationService.requestPermission();

// Enable browser notifications
notificationService.enableBrowserNotifications();
```

## 🧪 Testing

Run the test suite:
```bash
npm test src/components/sequencer
```

The tests cover:
- Utility functions
- Sequence validation
- Template service
- Notification system
- Integration workflows

## 🔌 Integration

### Equipment Integration
The sequencer integrates with the main app store for equipment status:

```tsx
// Equipment status affects step execution
const { equipmentStatus } = useAppStore();

// Sequence status syncs with main app
const { setSequenceStatus } = useAppStore();
```

### Custom Equipment Handlers
Extend the execution service for custom equipment:

```tsx
import { executionService } from '@/components/sequencer';

// Add custom step execution
executionService.addStepHandler('custom', async (step, context) => {
  // Custom execution logic
});
```

## 📊 Performance

### Optimization Features
- **Lazy Loading**: Components load on demand
- **Memoization**: Expensive calculations are cached
- **Virtual Scrolling**: Large lists are virtualized
- **Debounced Search**: Search input is debounced

### Memory Management
- **Automatic Cleanup**: Event listeners and timers are cleaned up
- **Limited History**: Logs and notifications are automatically pruned
- **Efficient Updates**: Only changed components re-render

## 🚨 Error Handling

### Validation
- Real-time validation of sequence parameters
- Step-specific validation rules
- User-friendly error messages

### Execution Errors
- Automatic retry mechanisms
- Graceful degradation
- Error recovery options

### User Feedback
- Toast notifications for immediate feedback
- Persistent error logs
- Action buttons for error resolution

## 🔄 State Management

The sequencer uses Zustand for state management with:
- **Persistence**: Automatic localStorage persistence
- **Immutability**: Immutable state updates
- **Type Safety**: Full TypeScript support
- **Devtools**: Redux DevTools integration

## 📱 Mobile Support

The sequencer is fully responsive and supports:
- Touch interactions
- Swipe gestures
- Mobile-optimized layouts
- Offline functionality

## 🎯 Future Enhancements

Planned features:
- **Conditional Logic**: If/then step execution
- **Loop Support**: Repeat step sequences
- **Weather Integration**: Automatic weather monitoring
- **Cloud Sync**: Sync sequences across devices
- **Advanced Scheduling**: Time-based sequence scheduling
- **Equipment Profiles**: Save equipment configurations
- **Sequence Sharing**: Community sequence sharing

## 📄 License

This sequencer is part of the Cobalt Mobile project and follows the same license terms.
