import {
  Workspace,
  Sequence,
  SequenceTemplate,
  WorkspaceSettings,
  WorkspaceMetadata,
  WorkspaceFilter,
  WorkspaceSearchResult,
  WorkspaceStats,
  WorkspaceCollaboration,
  WorkspaceCollaborator,
  WorkspacePermissions,
  WorkspaceShareSettings,
  SerializationOptions,
  SerializationResult,
  DeserializationResult
} from '../types/sequencer.types';
import { generateId } from '../utils/sequencer.utils';
import { SerializationService } from './serialization.service';



export class WorkspaceService {
  private static readonly DEFAULT_SETTINGS: WorkspaceSettings = {
    autoSave: true,
    notifications: true,
    theme: 'auto',
    units: 'metric',
  };

  private static readonly DEFAULT_METADATA: WorkspaceMetadata = {
    tags: [],
    isShared: false,
    collaborators: [],
  };

  // Workspace creation and management
  static createWorkspace(
    name: string, 
    description?: string,
    settings?: Partial<WorkspaceSettings>,
    metadata?: Partial<WorkspaceMetadata>
  ): Workspace {
    return {
      id: generateId(),
      name,
      description,
      sequences: [],
      templates: [],
      settings: { ...this.DEFAULT_SETTINGS, ...settings },
      metadata: { ...this.DEFAULT_METADATA, ...metadata },
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
    };
  }

  static cloneWorkspace(
    workspace: Workspace,
    newName?: string,
    includeSequences: boolean = true,
    includeTemplates: boolean = true
  ): Workspace {
    return {
      ...workspace,
      id: generateId(),
      name: newName || `${workspace.name} (Copy)`,
      sequences: includeSequences ? [...workspace.sequences] : [],
      templates: includeTemplates ? [...workspace.templates] : [],
      metadata: {
        ...workspace.metadata,
        isShared: false,
        shareUrl: undefined,
        collaborators: [],
      },
      created: new Date(),
      modified: new Date(),
    };
  }

  // Workspace filtering and search
  static filterWorkspaces(
    workspaces: Workspace[],
    filter: WorkspaceFilter
  ): Workspace[] {
    return workspaces.filter(workspace => {
      // Category filter
      if (filter.category && workspace.metadata.category !== filter.category) {
        return false;
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag =>
          workspace.metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Author filter
      if (filter.author && workspace.metadata.author !== filter.author) {
        return false;
      }

      // Date range filter
      if (filter.dateRange) {
        const { start, end } = filter.dateRange;
        if (workspace.created < start || workspace.created > end) {
          return false;
        }
      }

      // Shared filter
      if (filter.isShared !== undefined && workspace.metadata.isShared !== filter.isShared) {
        return false;
      }

      return true;
    });
  }

  static searchWorkspaces(
    workspaces: Workspace[],
    query: string,
    limit: number = 20,
    offset: number = 0
  ): WorkspaceSearchResult {
    const lowercaseQuery = query.toLowerCase();
    
    const filtered = workspaces.filter(workspace =>
      workspace.name.toLowerCase().includes(lowercaseQuery) ||
      workspace.description?.toLowerCase().includes(lowercaseQuery) ||
      workspace.metadata.tags.some(tag => 
        tag.toLowerCase().includes(lowercaseQuery)
      ) ||
      workspace.metadata.author?.toLowerCase().includes(lowercaseQuery)
    );

    const paginatedResults = filtered.slice(offset, offset + limit);

    return {
      workspaces: paginatedResults,
      totalCount: filtered.length,
      hasMore: offset + limit < filtered.length,
    };
  }

  // Workspace statistics
  static calculateWorkspaceStats(
    workspace: Workspace,
    sequences: Sequence[],
    templates: SequenceTemplate[]
  ): WorkspaceStats {
    const workspaceSequences = sequences.filter(seq => 
      workspace.sequences.includes(seq.id)
    );
    const workspaceTemplates = templates.filter(tpl => 
      workspace.templates.includes(tpl.id)
    );

    const totalDuration = workspaceSequences.reduce(
      (sum, seq) => sum + seq.estimatedDuration, 
      0
    );

    const lastModified = new Date(Math.max(
      workspace.modified.getTime(),
      ...workspaceSequences.map(seq => seq.modified.getTime()),
      ...workspaceTemplates.map(tpl => tpl.metadata.modified?.getTime() || 0)
    ));

    return {
      totalSequences: workspaceSequences.length,
      totalTemplates: workspaceTemplates.length,
      totalDuration,
      lastModified,
      collaboratorCount: workspace.metadata.collaborators?.length || 0,
      isActive: workspace.sequences.length > 0 || workspace.templates.length > 0,
    };
  }

  // Workspace organization
  static organizeWorkspacesByCategory(workspaces: Workspace[]): Record<string, Workspace[]> {
    const organized: Record<string, Workspace[]> = {};
    
    workspaces.forEach(workspace => {
      const category = workspace.metadata.category || 'Uncategorized';
      if (!organized[category]) {
        organized[category] = [];
      }
      organized[category].push(workspace);
    });

    return organized;
  }

  static getWorkspaceHierarchy(workspaces: Workspace[]): any {
    const categories = this.organizeWorkspacesByCategory(workspaces);
    
    return Object.entries(categories).map(([category, workspaceList]) => ({
      category,
      count: workspaceList.length,
      workspaces: workspaceList.sort((a, b) => 
        b.modified.getTime() - a.modified.getTime()
      ),
    }));
  }

  // Workspace validation
  static validateWorkspace(workspace: Workspace): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!workspace.name.trim()) {
      errors.push('Workspace name is required');
    }

    if (workspace.name.length > 100) {
      errors.push('Workspace name is too long (max 100 characters)');
    }

    if (workspace.description && workspace.description.length > 500) {
      warnings.push('Workspace description is very long');
    }

    // Sequence/template validation
    if (workspace.sequences.length === 0 && workspace.templates.length === 0) {
      warnings.push('Workspace is empty');
    }

    if (workspace.sequences.length > 100) {
      warnings.push('Workspace has many sequences, consider organizing into sub-workspaces');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Workspace sharing and collaboration
  static generateShareUrl(workspaceId: string): string {
    const baseUrl = window.location.origin;
    const shareToken = btoa(workspaceId + Date.now()).replace(/[^a-zA-Z0-9]/g, '');
    return `${baseUrl}/shared/workspace/${shareToken}`;
  }

  static createCollaborationSettings(
    workspaceId: string,
    isPublic: boolean = false
  ): WorkspaceCollaboration {
    return {
      workspaceId,
      collaborators: [],
      permissions: {
        canEdit: false,
        canDelete: false,
        canShare: false,
        canInvite: false,
        canExport: true,
      },
      shareSettings: {
        isPublic,
        allowComments: true,
        allowDownload: true,
      },
    };
  }

  // Workspace import/export
  static async exportWorkspace(
    workspace: Workspace,
    sequences: Sequence[],
    templates: SequenceTemplate[],
    options: SerializationOptions = {}
  ): Promise<SerializationResult> {
    return SerializationService.serializeWorkspace(
      workspace,
      sequences,
      templates,
      options
    );
  }

  static async importWorkspace(
    data: string | File
  ): Promise<DeserializationResult> {
    let result: DeserializationResult;
    
    if (data instanceof File) {
      result = await SerializationService.loadFromFile(data);
    } else {
      result = await SerializationService.deserialize(data);
    }

    return result;
  }

  // Workspace templates
  static createWorkspaceTemplate(workspace: Workspace): any {
    return {
      id: generateId(),
      name: `${workspace.name} Template`,
      description: `Template based on ${workspace.name}`,
      settings: { ...workspace.settings },
      metadata: {
        ...workspace.metadata,
        isShared: false,
        shareUrl: undefined,
        collaborators: [],
      },
      created: new Date(),
    };
  }

  static applyWorkspaceTemplate(template: any, name: string): Workspace {
    return {
      id: generateId(),
      name,
      description: template.description,
      sequences: [],
      templates: [],
      settings: { ...template.settings },
      metadata: { ...template.metadata },
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
    };
  }
}
