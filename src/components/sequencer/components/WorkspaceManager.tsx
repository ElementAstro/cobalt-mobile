import React, { useState, useMemo } from 'react';
import { 
  Workspace, 
  WorkspaceFilter,
  WorkspaceStats 
} from '../types/sequencer.types';
import { useSequencerStore } from '../store/sequencer.store';
import { WorkspaceService } from '../services/workspace.service';

interface WorkspaceManagerProps {
  onWorkspaceSelect?: (workspace: Workspace | null) => void;
  showCreateButton?: boolean;
  showStats?: boolean;
}

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  onWorkspaceSelect,
  showCreateButton = true,
  showStats = true,
}) => {
  const {
    workspaces,
    activeWorkspace,
    library,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setActiveWorkspace,
    exportWorkspace,
    importWorkspace,
  } = useSequencerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<WorkspaceFilter>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  // Filter and search workspaces
  const filteredWorkspaces = useMemo(() => {
    let filtered = WorkspaceService.filterWorkspaces(workspaces, filter);
    
    if (searchQuery) {
      const searchResult = WorkspaceService.searchWorkspaces(filtered, searchQuery);
      filtered = searchResult.workspaces;
    }
    
    return filtered;
  }, [workspaces, filter, searchQuery]);

  // Calculate workspace statistics
  const workspaceStats = useMemo(() => {
    const statsMap = new Map<string, WorkspaceStats>();
    
    workspaces.forEach(workspace => {
      const stats = WorkspaceService.calculateWorkspaceStats(
        workspace,
        library.sequences,
        library.templates
      );
      statsMap.set(workspace.id, stats);
    });
    
    return statsMap;
  }, [workspaces, library]);

  const handleCreateWorkspace = (name: string, description?: string) => {
    const newWorkspace = createWorkspace(name, description);
    setShowCreateDialog(false);
    onWorkspaceSelect?.(newWorkspace);
  };

  const handleSelectWorkspace = (workspace: Workspace | null) => {
    setActiveWorkspace(workspace?.id || null);
    setSelectedWorkspace(workspace);
    onWorkspaceSelect?.(workspace);
  };

  const handleExportWorkspace = async (workspace: Workspace) => {
    try {
      const result = await exportWorkspace(workspace.id, { compress: true });
      if (result.success && result.data) {
        // Download the exported workspace
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${workspace.name.replace(/[^a-z0-9]/gi, '_')}_workspace.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export workspace:', error);
    }
  };

  const handleImportWorkspace = async (file: File) => {
    try {
      const result = await importWorkspace(file);
      if (result.success) {
        setShowImportDialog(false);
        // Optionally select the imported workspace
      }
    } catch (error) {
      console.error('Failed to import workspace:', error);
    }
  };

  return (
    <div className="workspace-manager p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Workspaces</h2>
        <div className="flex gap-2">
          {showCreateButton && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Workspace
            </button>
          )}
          <button
            onClick={() => setShowImportDialog(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Import
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filter.category || ''}
            onChange={(e) => setFilter({ ...filter, category: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="Deep Sky">Deep Sky</option>
            <option value="Planetary">Planetary</option>
            <option value="Solar">Solar</option>
            <option value="Calibration">Calibration</option>
            <option value="Testing">Testing</option>
          </select>
        </div>
      </div>

      {/* Active Workspace */}
      {activeWorkspace && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Active Workspace</h3>
              <p className="text-blue-700">{activeWorkspace.name}</p>
              {activeWorkspace.description && (
                <p className="text-sm text-blue-600 mt-1">{activeWorkspace.description}</p>
              )}
            </div>
            <button
              onClick={() => handleSelectWorkspace(null)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Workspace List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkspaces.map((workspace) => {
          const stats = workspaceStats.get(workspace.id);
          const isActive = activeWorkspace?.id === workspace.id;
          
          return (
            <div
              key={workspace.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleSelectWorkspace(workspace)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 truncate">{workspace.name}</h3>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportWorkspace(workspace);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Export workspace"
                  >
                    📤
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWorkspace(workspace.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete workspace"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {workspace.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {workspace.description}
                </p>
              )}

              {showStats && stats && (
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Sequences:</span>
                    <span>{stats.totalSequences}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Templates:</span>
                    <span>{stats.totalTemplates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{Math.round(stats.totalDuration / 3600)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modified:</span>
                    <span>{stats.lastModified.toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {workspace.metadata.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {workspace.metadata.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {workspace.metadata.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{workspace.metadata.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredWorkspaces.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No workspaces found</p>
          {searchQuery && (
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          )}
        </div>
      )}

      {/* Create Workspace Dialog */}
      {showCreateDialog && (
        <CreateWorkspaceDialog
          onCreate={handleCreateWorkspace}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}

      {/* Import Workspace Dialog */}
      {showImportDialog && (
        <ImportWorkspaceDialog
          onImport={handleImportWorkspace}
          onCancel={() => setShowImportDialog(false)}
        />
      )}
    </div>
  );
};

// Helper components
const CreateWorkspaceDialog: React.FC<{
  onCreate: (name: string, description?: string) => void;
  onCancel: () => void;
}> = ({ onCreate, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim() || undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Workspace</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter workspace name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter workspace description"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ImportWorkspaceDialog: React.FC<{
  onImport: (file: File) => void;
  onCancel: () => void;
}> = ({ onImport, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onImport(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Import Workspace</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Workspace File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {selectedFile && (
            <div className="text-sm text-gray-600">
              Selected: {selectedFile.name}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!selectedFile}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              Import
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
