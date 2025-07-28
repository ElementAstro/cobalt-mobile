"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowNodeType,
  WorkflowEngine 
} from '@/lib/automation/workflow-engine';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  Square,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  Settings,
  Zap,
  Camera,
  Image,
  Filter,
  Bell,
  Clock,
  RotateCcw,
  Code,
  GitBranch,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  Grip
} from 'lucide-react';

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: Workflow) => void;
  onExecute: (workflowId: string) => void;
  className?: string;
}

interface NodeTemplate {
  type: WorkflowNodeType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  inputs: Array<{ name: string; type: string; required: boolean }>;
  outputs: Array<{ name: string; type: string }>;
  config: Record<string, any>;
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'trigger',
    name: 'Trigger',
    description: 'Start the workflow',
    icon: Zap,
    color: 'bg-green-500',
    inputs: [],
    outputs: [{ name: 'triggered', type: 'boolean' }],
    config: { triggerType: 'manual' }
  },
  {
    type: 'equipment',
    name: 'Equipment Control',
    description: 'Control telescope, camera, or other equipment',
    icon: Camera,
    color: 'bg-blue-500',
    inputs: [{ name: 'command', type: 'string', required: true }],
    outputs: [{ name: 'status', type: 'string' }, { name: 'data', type: 'object' }],
    config: { equipmentType: 'camera' }
  },
  {
    type: 'imaging',
    name: 'Capture Images',
    description: 'Take photos with specified settings',
    icon: Image,
    color: 'bg-purple-500',
    inputs: [
      { name: 'target', type: 'target', required: true },
      { name: 'exposureTime', type: 'number', required: true },
      { name: 'frameCount', type: 'number', required: true }
    ],
    outputs: [{ name: 'images', type: 'array' }, { name: 'metadata', type: 'object' }],
    config: { autoFocus: true, dithering: true }
  },
  {
    type: 'processing',
    name: 'Process Images',
    description: 'Apply processing to captured images',
    icon: Filter,
    color: 'bg-orange-500',
    inputs: [{ name: 'images', type: 'array', required: true }],
    outputs: [{ name: 'processedImages', type: 'array' }, { name: 'statistics', type: 'object' }],
    config: { calibration: true, stacking: true }
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Branch workflow based on conditions',
    icon: GitBranch,
    color: 'bg-yellow-500',
    inputs: [{ name: 'value', type: 'any', required: true }],
    outputs: [{ name: 'true', type: 'boolean' }, { name: 'false', type: 'boolean' }],
    config: { operator: 'equals', compareValue: '' }
  },
  {
    type: 'notification',
    name: 'Send Notification',
    description: 'Send alerts or notifications',
    icon: Bell,
    color: 'bg-red-500',
    inputs: [{ name: 'message', type: 'string', required: true }],
    outputs: [{ name: 'sent', type: 'boolean' }],
    config: { method: 'email', recipients: [] }
  },
  {
    type: 'delay',
    name: 'Delay',
    description: 'Wait for specified time',
    icon: Clock,
    color: 'bg-gray-500',
    inputs: [{ name: 'duration', type: 'number', required: true }],
    outputs: [{ name: 'completed', type: 'boolean' }],
    config: { unit: 'seconds' }
  },
  {
    type: 'loop',
    name: 'Loop',
    description: 'Repeat actions multiple times',
    icon: RotateCcw,
    color: 'bg-indigo-500',
    inputs: [{ name: 'iterations', type: 'number', required: true }],
    outputs: [{ name: 'current', type: 'number' }, { name: 'completed', type: 'boolean' }],
    config: { maxIterations: 10 }
  },
  {
    type: 'script',
    name: 'Custom Script',
    description: 'Execute custom JavaScript code',
    icon: Code,
    color: 'bg-pink-500',
    inputs: [{ name: 'input', type: 'any', required: false }],
    outputs: [{ name: 'output', type: 'any' }],
    config: { script: '// Your code here\nreturn { output: input };' }
  }
];

export function WorkflowBuilder({ workflow, onSave, onExecute, className }: WorkflowBuilderProps) {
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>(
    workflow || {
      id: '',
      name: 'New Workflow',
      description: '',
      version: '1.0.0',
      author: 'User',
      created: new Date(),
      modified: new Date(),
      tags: [],
      nodes: [],
      connections: [],
      variables: [],
      triggers: [],
      enabled: true,
      executionCount: 0
    }
  );

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<NodeTemplate | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedTab, setSelectedTab] = useState('design');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const workflowEngine = useRef(new WorkflowEngine());

  const handleDragStart = (template: NodeTemplate) => {
    setDraggedNode(template);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: draggedNode.type,
      name: draggedNode.name,
      description: draggedNode.description,
      position: { x, y },
      inputs: draggedNode.inputs.map((input, index) => ({
        id: `input_${index}`,
        name: input.name,
        type: input.type as any,
        required: input.required
      })),
      outputs: draggedNode.outputs.map((output, index) => ({
        id: `output_${index}`,
        name: output.name,
        type: output.type as any
      })),
      config: { ...draggedNode.config },
      enabled: true,
      status: 'idle'
    };

    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      modified: new Date()
    }));

    setDraggedNode(null);
  };

  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node);
  };

  const handleNodeDelete = (nodeId: string) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      connections: prev.connections.filter(
        c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
      ),
      modified: new Date()
    }));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleNodeUpdate = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      modified: new Date()
    }));

    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleSave = () => {
    onSave(currentWorkflow);
  };

  const handleExecute = async () => {
    if (!currentWorkflow.id) {
      // Save first if not saved
      handleSave();
      return;
    }

    setIsExecuting(true);
    try {
      await onExecute(currentWorkflow.id);
    } finally {
      setIsExecuting(false);
    }
  };

  const validateWorkflow = () => {
    return workflowEngine.current.validateWorkflow(currentWorkflow);
  };

  const getNodeTemplate = (type: WorkflowNodeType) => {
    return nodeTemplates.find(t => t.type === type);
  };

  const NodeComponent = ({ node }: { node: WorkflowNode }) => {
    const template = getNodeTemplate(node.type);
    if (!template) return null;

    const Icon = template.icon;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div
        className={cn(
          "absolute bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg cursor-pointer transition-all",
          isSelected ? "border-primary shadow-xl" : "border-gray-200 dark:border-gray-700",
          "hover:shadow-lg"
        )}
        style={{ left: node.position.x, top: node.position.y }}
        onClick={() => handleNodeClick(node)}
      >
        <div className="flex items-center gap-2 p-3">
          <div className={cn("p-2 rounded", template.color)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{node.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {node.description || template.description}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleNodeDelete(node.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Node status indicator */}
        <div className={cn(
          "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
          node.status === 'completed' && "bg-green-500",
          node.status === 'running' && "bg-blue-500 animate-pulse",
          node.status === 'failed' && "bg-red-500",
          node.status === 'idle' && "bg-gray-400"
        )} />
      </div>
    );
  };

  const NodePalette = () => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Node Palette</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-2">
            {nodeTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.type}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-grab hover:bg-muted/50 transition-colors"
                  draggable
                  onDragStart={() => handleDragStart(template)}
                >
                  <div className={cn("p-2 rounded", template.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {template.description}
                    </div>
                  </div>
                  <Grip className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const NodeProperties = () => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedNode ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="node-name">Name</Label>
              <Input
                id="node-name"
                value={selectedNode.name}
                onChange={(e) => handleNodeUpdate(selectedNode.id, { name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="node-description">Description</Label>
              <Textarea
                id="node-description"
                value={selectedNode.description || ''}
                onChange={(e) => handleNodeUpdate(selectedNode.id, { description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="node-enabled"
                checked={selectedNode.enabled}
                onChange={(e) => handleNodeUpdate(selectedNode.id, { enabled: e.target.checked })}
              />
              <Label htmlFor="node-enabled">Enabled</Label>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Configuration</h4>
              {Object.entries(selectedNode.config).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Input
                    value={String(value)}
                    onChange={(e) => {
                      const newConfig = { ...selectedNode.config };
                      newConfig[key] = e.target.value;
                      handleNodeUpdate(selectedNode.id, { config: newConfig });
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a node to edit its properties</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const validation = validateWorkflow();

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div>
            <Input
              value={currentWorkflow.name}
              onChange={(e) => setCurrentWorkflow(prev => ({ ...prev, name: e.target.value }))}
              className="font-medium"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {currentWorkflow.nodes.length} nodes, {currentWorkflow.connections.length} connections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!validation.valid && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {validation.errors.length} errors
            </Badge>
          )}
          
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          
          <Button 
            onClick={handleExecute} 
            disabled={isExecuting || !validation.valid}
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Execute
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel - Node Palette */}
        <div className="w-80 border-r">
          <NodePalette />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 relative">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full">
            <TabsList className="absolute top-4 left-4 z-10">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="h-full m-0">
              <div
                ref={canvasRef}
                className="h-full bg-gray-50 dark:bg-gray-900 relative overflow-auto"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Grid background */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Nodes */}
                {currentWorkflow.nodes.map(node => (
                  <NodeComponent key={node.id} node={node} />
                ))}

                {/* Drop zone hint */}
                {draggedNode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-primary/10 border-2 border-dashed border-primary rounded-lg p-8">
                      <p className="text-primary font-medium">Drop here to add node</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="code" className="h-full m-0 p-4">
              <Card className="h-full">
                <CardContent className="p-4">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(currentWorkflow, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="h-full m-0 p-4">
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Execution logs will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-80 border-l">
          <NodeProperties />
        </div>
      </div>

      {/* Validation Errors */}
      {!validation.valid && (
        <div className="border-t bg-destructive/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h4 className="font-medium text-destructive">Workflow Validation Errors</h4>
              <ul className="text-sm text-destructive/80 mt-1 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
