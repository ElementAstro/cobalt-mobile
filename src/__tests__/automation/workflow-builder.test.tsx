/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock all external dependencies first
jest.mock('reactflow', () => ({
  ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
  Controls: () => <div data-testid="flow-controls">Controls</div>,
  MiniMap: () => <div data-testid="minimap">MiniMap</div>,
  Background: () => <div data-testid="background">Background</div>,
  addEdge: jest.fn(),
  useNodesState: jest.fn(() => [[], jest.fn(), jest.fn()]),
  useEdgesState: jest.fn(() => [[], jest.fn(), jest.fn()]),
  useReactFlow: jest.fn(() => ({
    getNodes: jest.fn(() => []),
    getEdges: jest.fn(() => []),
    setNodes: jest.fn(),
    setEdges: jest.fn()
  }))
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} data-testid="input" {...props} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor} data-testid="label">{children}</label>
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea value={value} onChange={onChange} data-testid="textarea" {...props} />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>{children}</div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid="tabs-trigger" data-value={value}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid="tabs-content" data-value={value} role="tabpanel">{children}</div>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => {
  const MockIcon = () => <span data-testid="icon" />;
  return {
    Play: MockIcon,
    Pause: MockIcon,
    Square: MockIcon,
    Save: MockIcon,
    Download: MockIcon,
    Upload: MockIcon,
    Plus: MockIcon,
    Trash2: MockIcon,
    Copy: MockIcon,
    Settings: MockIcon,
    Zap: MockIcon,
    Camera: MockIcon,
    Image: MockIcon,
    Filter: MockIcon,
    Bell: MockIcon,
    Clock: MockIcon,
    RotateCcw: MockIcon,
    Code: MockIcon,
    GitBranch: MockIcon,
    Target: MockIcon,
    CheckCircle: MockIcon,
    AlertTriangle: MockIcon,
    Info: MockIcon,
    Grip: MockIcon,
  };
});

// Mock WorkflowEngine
const mockEngine = {
  validateWorkflow: jest.fn().mockReturnValue({ valid: true, errors: [], warnings: [] }),
  executeWorkflow: jest.fn().mockResolvedValue({
    id: 'exec1',
    workflowId: 'workflow1',
    status: 'completed',
    startTime: new Date(),
    endTime: new Date(),
    nodeExecutions: [],
    variables: {},
    logs: []
  }),
  calculateExecutionOrder: jest.fn().mockReturnValue(['trigger1']),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
};

jest.mock('../../lib/automation/workflow-engine', () => ({
  WorkflowEngine: jest.fn().mockImplementation(() => mockEngine),
  WorkflowNodeType: {
    TRIGGER: 'trigger',
    EQUIPMENT: 'equipment',
    CAPTURE: 'capture',
    PROCESS: 'process',
    CONDITION: 'condition',
    ACTION: 'action',
    SCRIPT: 'script'
  }
}));

// Import the component after all mocks
import { WorkflowBuilder } from '../../components/automation/workflow-builder';

describe('WorkflowBuilder', () => {
  const mockWorkflow = {
    id: 'test-workflow',
    name: 'Test Workflow',
    description: 'A test workflow',
    nodes: [{
      id: 'trigger1',
      type: 'trigger' as const,
      name: 'Test Trigger',
      position: { x: 100, y: 100 },
      inputs: [],
      outputs: [{ name: 'output', type: 'any' }],
      config: { schedule: '20:00' },
      enabled: true,
      status: 'idle' as const
    }],
    connections: [],
    variables: {},
    created: new Date(),
    modified: new Date(),
    executionCount: 0
  };

  const mockOnSave = jest.fn();
  const mockOnExecute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <WorkflowBuilder
        workflow={mockWorkflow}
        onSave={mockOnSave}
        onExecute={mockOnExecute}
      />
    );

    // Check that multiple cards are rendered (node palette, properties, etc.)
    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBeGreaterThan(0); // Just check that cards are rendered
  });

  it('should display workflow name', () => {
    render(
      <WorkflowBuilder
        workflow={mockWorkflow}
        onSave={mockOnSave}
        onExecute={mockOnExecute}
      />
    );

    expect(screen.getByDisplayValue('Test Workflow')).toBeInTheDocument();
  });

  it('should show save and execute buttons', () => {
    render(
      <WorkflowBuilder
        workflow={mockWorkflow}
        onSave={mockOnSave}
        onExecute={mockOnExecute}
      />
    );

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /execute/i })).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <WorkflowBuilder
        workflow={mockWorkflow}
        onSave={mockOnSave}
        onExecute={mockOnExecute}
      />
    );

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('should show node palette', () => {
    render(
      <WorkflowBuilder
        workflow={mockWorkflow}
        onSave={mockOnSave}
        onExecute={mockOnExecute}
      />
    );

    expect(screen.getByText('Node Palette')).toBeInTheDocument();
  });
});
