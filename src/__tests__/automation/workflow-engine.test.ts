import { WorkflowEngine, Workflow, WorkflowNode, WorkflowConnection, WorkflowExecution } from '../../lib/automation/workflow-engine';

// Mock data
const mockNodes: WorkflowNode[] = [
  {
    id: 'trigger1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: {
      triggerType: 'time',
      schedule: '20:00',
      enabled: true
    }
  },
  {
    id: 'equipment1',
    type: 'equipment',
    position: { x: 300, y: 100 },
    data: {
      equipmentId: 'mount1',
      action: 'goto',
      parameters: {
        target: 'M31',
        coordinates: { ra: 10.6847, dec: 41.2687 }
      }
    }
  },
  {
    id: 'imaging1',
    type: 'imaging',
    position: { x: 500, y: 100 },
    data: {
      exposureTime: 300,
      frameCount: 20,
      filter: 'L',
      gain: 100,
      binning: 1
    }
  },
  {
    id: 'condition1',
    type: 'condition',
    position: { x: 300, y: 300 },
    data: {
      condition: 'weather.cloudCover < 30',
      trueOutput: 'continue',
      falseOutput: 'abort'
    }
  }
];

const mockConnections: WorkflowConnection[] = [
  {
    id: 'conn1',
    source: 'trigger1',
    target: 'condition1',
    sourceHandle: 'output',
    targetHandle: 'input'
  },
  {
    id: 'conn2',
    source: 'condition1',
    target: 'equipment1',
    sourceHandle: 'true',
    targetHandle: 'input'
  },
  {
    id: 'conn3',
    source: 'equipment1',
    target: 'imaging1',
    sourceHandle: 'output',
    targetHandle: 'input'
  }
];

const mockWorkflow: Workflow = {
  id: 'workflow1',
  name: 'Test Workflow',
  description: 'A test workflow for unit testing',
  nodes: mockNodes,
  connections: mockConnections,
  variables: {
    targetName: 'M31',
    exposureTime: 300
  },
  settings: {
    timeout: 3600,
    retryAttempts: 3,
    errorHandling: 'continue'
  },
  created: new Date('2024-03-01T10:00:00Z'),
  modified: new Date('2024-03-01T10:00:00Z'),
  version: 1,
  enabled: true
};

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
    // Add the mock workflow to the engine
    engine.addWorkflow(mockWorkflow);
  });

  describe('Workflow Validation', () => {
    it('should validate a correct workflow', () => {
      const result = engine.validateWorkflow(mockWorkflow);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing trigger nodes', () => {
      const workflowWithoutTrigger = {
        ...mockWorkflow,
        nodes: mockNodes.filter(n => n.type !== 'trigger')
      };

      const result = engine.validateWorkflow(workflowWithoutTrigger);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Workflow must have at least one trigger node');
    });

    it('should detect circular dependencies', () => {
      const circularConnections = [
        ...mockConnections,
        {
          id: 'circular',
          source: 'imaging1',
          target: 'trigger1',
          sourceHandle: 'output',
          targetHandle: 'input'
        }
      ];

      const circularWorkflow = {
        ...mockWorkflow,
        connections: circularConnections
      };

      const result = engine.validateWorkflow(circularWorkflow);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('circular'))).toBe(true);
    });

    it('should detect orphaned nodes', () => {
      const orphanedNode: WorkflowNode = {
        id: 'orphan1',
        type: 'equipment',
        position: { x: 700, y: 100 },
        data: {
          equipmentId: 'camera1',
          action: 'cool',
          parameters: { temperature: -10 }
        }
      };

      const workflowWithOrphan = {
        ...mockWorkflow,
        nodes: [...mockNodes, orphanedNode]
      };

      const result = engine.validateWorkflow(workflowWithOrphan);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Node orphan1 is not connected to any other nodes');
    });

    it('should detect invalid connections', () => {
      const invalidConnection: WorkflowConnection = {
        id: 'invalid',
        source: 'nonexistent',
        target: 'equipment1',
        sourceHandle: 'output',
        targetHandle: 'input'
      };

      const workflowWithInvalidConnection = {
        ...mockWorkflow,
        connections: [...mockConnections, invalidConnection]
      };

      const result = engine.validateWorkflow(workflowWithInvalidConnection);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('nonexistent'))).toBe(true);
    });

    it('should validate node data requirements', () => {
      const nodeWithMissingData: WorkflowNode = {
        id: 'invalid_equipment',
        type: 'equipment',
        position: { x: 100, y: 100 },
        data: {} // Missing required fields
      };

      const workflowWithInvalidNode = {
        ...mockWorkflow,
        nodes: [mockNodes[0], nodeWithMissingData] // Keep trigger + invalid node
      };

      const result = engine.validateWorkflow(workflowWithInvalidNode);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('equipmentId'))).toBe(true);
    });
  });

  describe('Workflow Execution', () => {
    it('should execute a simple workflow successfully', async () => {
      const execution = await engine.executeWorkflow('workflow1');

      expect(execution.id).toBeDefined();
      expect(execution.workflowId).toBe('workflow1');
      expect(execution.status).toBe('completed');
      expect(execution.startTime).toBeDefined();
      expect(execution.endTime).toBeDefined();
      expect(execution.nodeExecutions.length).toBeGreaterThan(0);
    });

    it('should handle node execution errors gracefully', async () => {
      const failingNode: WorkflowNode = {
        id: 'failing',
        type: 'equipment',
        position: { x: 300, y: 100 },
        data: {
          equipmentId: 'nonexistent_equipment',
          action: 'invalid_action',
          parameters: {}
        }
      };

      const failingWorkflow = {
        ...mockWorkflow,
        nodes: [mockNodes[0], failingNode], // Trigger + failing node
        connections: [{
          id: 'fail_conn',
          source: 'trigger1',
          target: 'failing',
          sourceHandle: 'output',
          targetHandle: 'input'
        }]
      };

      const execution = await engine.executeWorkflow(failingWorkflow);

      expect(execution.status).toBe('failed');
      expect(execution.error).toBeDefined();
      expect(execution.steps.some(s => s.status === 'failed')).toBe(true);
    });

    it('should respect workflow timeout settings', async () => {
      const timeoutWorkflow = {
        ...mockWorkflow,
        settings: {
          ...mockWorkflow.settings,
          timeout: 1 // 1 second timeout
        }
      };

      // Mock a long-running node
      const longRunningNode: WorkflowNode = {
        id: 'long_running',
        type: 'delay',
        position: { x: 300, y: 100 },
        data: {
          duration: 5000 // 5 seconds
        }
      };

      const workflowWithDelay = {
        ...timeoutWorkflow,
        nodes: [mockNodes[0], longRunningNode],
        connections: [{
          id: 'delay_conn',
          source: 'trigger1',
          target: 'long_running',
          sourceHandle: 'output',
          targetHandle: 'input'
        }]
      };

      const startTime = Date.now();
      const execution = await engine.executeWorkflow(workflowWithDelay);
      const endTime = Date.now();

      expect(execution.status).toBe('timeout');
      expect(endTime - startTime).toBeLessThan(2000); // Should timeout quickly
    });

    it('should handle conditional branching correctly', async () => {
      // Mock weather conditions that satisfy the condition
      const mockWeatherData = {
        cloudCover: 20 // Less than 30, should take true branch
      };

      // Inject mock weather data
      engine.setContextData('weather', mockWeatherData);

      const execution = await engine.executeWorkflow(mockWorkflow);

      expect(execution.status).toBe('completed');
      
      // Should have executed the true branch (equipment1 -> imaging1)
      const equipmentStep = execution.steps.find(s => s.nodeId === 'equipment1');
      const imagingStep = execution.steps.find(s => s.nodeId === 'imaging1');
      
      expect(equipmentStep).toBeDefined();
      expect(imagingStep).toBeDefined();
      expect(equipmentStep?.status).toBe('completed');
      expect(imagingStep?.status).toBe('completed');
    });

    it('should handle false condition branches', async () => {
      // Mock weather conditions that fail the condition
      const mockWeatherData = {
        cloudCover: 50 // Greater than 30, should take false branch
      };

      engine.setContextData('weather', mockWeatherData);

      const execution = await engine.executeWorkflow(mockWorkflow);

      // Should abort due to false condition
      expect(execution.status).toBe('aborted');
      
      // Should not have executed equipment or imaging nodes
      const equipmentStep = execution.steps.find(s => s.nodeId === 'equipment1');
      const imagingStep = execution.steps.find(s => s.nodeId === 'imaging1');
      
      expect(equipmentStep).toBeUndefined();
      expect(imagingStep).toBeUndefined();
    });
  });

  describe('Node Handlers', () => {
    it('should execute trigger nodes correctly', async () => {
      const triggerNode = mockNodes.find(n => n.type === 'trigger')!;
      const result = await engine.executeNode(triggerNode, {});

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    it('should execute equipment nodes correctly', async () => {
      const equipmentNode = mockNodes.find(n => n.type === 'equipment')!;
      const result = await engine.executeNode(equipmentNode, {});

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('equipmentId');
      expect(result.output).toHaveProperty('action');
    });

    it('should execute imaging nodes correctly', async () => {
      const imagingNode = mockNodes.find(n => n.type === 'imaging')!;
      const result = await engine.executeNode(imagingNode, {});

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('exposureTime');
      expect(result.output).toHaveProperty('frameCount');
    });

    it('should execute condition nodes correctly', async () => {
      const conditionNode = mockNodes.find(n => n.type === 'condition')!;
      
      // Set up context for condition evaluation
      engine.setContextData('weather', { cloudCover: 20 });
      
      const result = await engine.executeNode(conditionNode, {});

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('conditionResult');
      expect(result.output.conditionResult).toBe(true);
    });

    it('should handle invalid node types', async () => {
      const invalidNode: WorkflowNode = {
        id: 'invalid',
        type: 'unknown_type' as any,
        position: { x: 0, y: 0 },
        data: {}
      };

      const result = await engine.executeNode(invalidNode, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown node type');
    });
  });

  describe('Variable Substitution', () => {
    it('should substitute workflow variables in node data', () => {
      const nodeWithVariables: WorkflowNode = {
        id: 'var_test',
        type: 'equipment',
        position: { x: 0, y: 0 },
        data: {
          equipmentId: 'mount1',
          action: 'goto',
          parameters: {
            target: '${targetName}',
            exposureTime: '${exposureTime}'
          }
        }
      };

      const substituted = engine.substituteVariables(nodeWithVariables, mockWorkflow.variables);

      expect(substituted.data.parameters.target).toBe('M31');
      expect(substituted.data.parameters.exposureTime).toBe(300);
    });

    it('should handle missing variables gracefully', () => {
      const nodeWithMissingVar: WorkflowNode = {
        id: 'missing_var',
        type: 'equipment',
        position: { x: 0, y: 0 },
        data: {
          equipmentId: '${missingVariable}',
          action: 'goto',
          parameters: {}
        }
      };

      const substituted = engine.substituteVariables(nodeWithMissingVar, mockWorkflow.variables);

      expect(substituted.data.equipmentId).toBe('${missingVariable}'); // Should remain unchanged
    });

    it('should handle nested variable substitution', () => {
      const complexVariables = {
        ...mockWorkflow.variables,
        coordinates: {
          ra: 10.6847,
          dec: 41.2687
        }
      };

      const nodeWithNestedVars: WorkflowNode = {
        id: 'nested_test',
        type: 'equipment',
        position: { x: 0, y: 0 },
        data: {
          equipmentId: 'mount1',
          action: 'goto',
          parameters: {
            ra: '${coordinates.ra}',
            dec: '${coordinates.dec}'
          }
        }
      };

      const substituted = engine.substituteVariables(nodeWithNestedVars, complexVariables);

      expect(substituted.data.parameters.ra).toBe(10.6847);
      expect(substituted.data.parameters.dec).toBe(41.2687);
    });
  });

  describe('Execution Order Calculation', () => {
    it('should calculate correct execution order for linear workflow', () => {
      const order = engine.calculateExecutionOrder(mockWorkflow);

      expect(order).toHaveLength(4);
      expect(order[0]).toBe('trigger1'); // Should start with trigger
      expect(order.indexOf('condition1')).toBeLessThan(order.indexOf('equipment1'));
      expect(order.indexOf('equipment1')).toBeLessThan(order.indexOf('imaging1'));
    });

    it('should handle parallel branches correctly', () => {
      const parallelConnections = [
        {
          id: 'parallel1',
          source: 'trigger1',
          target: 'equipment1',
          sourceHandle: 'output',
          targetHandle: 'input'
        },
        {
          id: 'parallel2',
          source: 'trigger1',
          target: 'imaging1',
          sourceHandle: 'output',
          targetHandle: 'input'
        }
      ];

      const parallelWorkflow = {
        ...mockWorkflow,
        connections: parallelConnections
      };

      const order = engine.calculateExecutionOrder(parallelWorkflow);

      expect(order[0]).toBe('trigger1');
      // equipment1 and imaging1 should be at the same level (can execute in parallel)
      expect(order.indexOf('equipment1')).toBeGreaterThan(0);
      expect(order.indexOf('imaging1')).toBeGreaterThan(0);
    });

    it('should detect and handle cycles in execution order', () => {
      const cyclicConnections = [
        ...mockConnections,
        {
          id: 'cycle',
          source: 'imaging1',
          target: 'equipment1',
          sourceHandle: 'output',
          targetHandle: 'input'
        }
      ];

      const cyclicWorkflow = {
        ...mockWorkflow,
        connections: cyclicConnections
      };

      expect(() => {
        engine.calculateExecutionOrder(cyclicWorkflow);
      }).toThrow('Circular dependency detected');
    });
  });

  describe('Event System', () => {
    it('should emit events during workflow execution', async () => {
      const events: string[] = [];
      
      engine.on('workflow.started', () => events.push('started'));
      engine.on('workflow.completed', () => events.push('completed'));
      engine.on('node.executed', () => events.push('node_executed'));

      await engine.executeWorkflow(mockWorkflow);

      expect(events).toContain('started');
      expect(events).toContain('completed');
      expect(events).toContain('node_executed');
    });

    it('should emit error events on failure', async () => {
      const errorEvents: any[] = [];
      
      engine.on('workflow.failed', (error) => errorEvents.push(error));
      engine.on('node.failed', (error) => errorEvents.push(error));

      const failingWorkflow = {
        ...mockWorkflow,
        nodes: [{
          id: 'failing',
          type: 'equipment',
          position: { x: 0, y: 0 },
          data: {
            equipmentId: 'invalid',
            action: 'invalid',
            parameters: {}
          }
        }]
      };

      await engine.executeWorkflow(failingWorkflow);

      expect(errorEvents.length).toBeGreaterThan(0);
    });

    it('should allow event listeners to be removed', () => {
      const handler = jest.fn();
      
      engine.on('workflow.started', handler);
      engine.off('workflow.started', handler);

      engine.executeWorkflow(mockWorkflow);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Context Management', () => {
    it('should maintain execution context across nodes', async () => {
      const contextWorkflow = {
        ...mockWorkflow,
        nodes: [
          {
            id: 'context_setter',
            type: 'script',
            position: { x: 100, y: 100 },
            data: {
              script: 'context.testValue = 42; return { success: true };'
            }
          },
          {
            id: 'context_reader',
            type: 'script',
            position: { x: 300, y: 100 },
            data: {
              script: 'return { success: true, value: context.testValue };'
            }
          }
        ],
        connections: [{
          id: 'context_conn',
          source: 'context_setter',
          target: 'context_reader',
          sourceHandle: 'output',
          targetHandle: 'input'
        }]
      };

      const execution = await engine.executeWorkflow(contextWorkflow);

      expect(execution.status).toBe('completed');
      
      const readerStep = execution.steps.find(s => s.nodeId === 'context_reader');
      expect(readerStep?.output.value).toBe(42);
    });

    it('should isolate context between different workflow executions', async () => {
      // First execution sets context
      engine.setContextData('testKey', 'firstValue');
      await engine.executeWorkflow(mockWorkflow);

      // Second execution should have clean context
      const secondExecution = await engine.executeWorkflow(mockWorkflow);
      
      expect(engine.getContextData('testKey')).toBeUndefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should retry failed nodes according to settings', async () => {
      const retryWorkflow = {
        ...mockWorkflow,
        settings: {
          ...mockWorkflow.settings,
          retryAttempts: 2
        },
        nodes: [{
          id: 'flaky',
          type: 'equipment',
          position: { x: 100, y: 100 },
          data: {
            equipmentId: 'flaky_equipment',
            action: 'unreliable_action',
            parameters: {}
          }
        }]
      };

      // Mock the node to fail twice then succeed
      let attempts = 0;
      const originalExecuteNode = engine.executeNode;
      engine.executeNode = jest.fn().mockImplementation(async (node, context) => {
        if (node.id === 'flaky') {
          attempts++;
          if (attempts <= 2) {
            return { success: false, error: 'Temporary failure' };
          }
          return { success: true, output: {} };
        }
        return originalExecuteNode.call(engine, node, context);
      });

      const execution = await engine.executeWorkflow(retryWorkflow);

      expect(execution.status).toBe('completed');
      expect(attempts).toBe(3); // Initial attempt + 2 retries
    });

    it('should handle different error handling strategies', async () => {
      const continueOnErrorWorkflow = {
        ...mockWorkflow,
        settings: {
          ...mockWorkflow.settings,
          errorHandling: 'continue' as const
        }
      };

      const execution = await engine.executeWorkflow(continueOnErrorWorkflow);

      // Should continue execution even if some nodes fail
      expect(execution.status).toBe('completed');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large workflows efficiently', async () => {
      // Create a workflow with many nodes
      const largeNodes: WorkflowNode[] = Array.from({ length: 50 }, (_, i) => ({
        id: `node${i}`,
        type: 'script',
        position: { x: i * 10, y: 100 },
        data: {
          script: `return { success: true, nodeId: '${i}' };`
        }
      }));

      const largeConnections: WorkflowConnection[] = Array.from({ length: 49 }, (_, i) => ({
        id: `conn${i}`,
        source: `node${i}`,
        target: `node${i + 1}`,
        sourceHandle: 'output',
        targetHandle: 'input'
      }));

      const largeWorkflow = {
        ...mockWorkflow,
        nodes: largeNodes,
        connections: largeConnections
      };

      const startTime = Date.now();
      const execution = await engine.executeWorkflow(largeWorkflow);
      const endTime = Date.now();

      expect(execution.status).toBe('completed');
      expect(execution.steps).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent workflow executions', async () => {
      const promises = Array.from({ length: 5 }, () =>
        engine.executeWorkflow(mockWorkflow)
      );

      const executions = await Promise.all(promises);

      executions.forEach(execution => {
        expect(execution.status).toBe('completed');
        expect(execution.id).toBeDefined();
      });

      // All executions should have unique IDs
      const ids = executions.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });
  });
});
