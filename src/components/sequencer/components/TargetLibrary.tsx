import React, { useState, useMemo } from 'react';
import { Target, TargetSearchOptions } from '../types/sequencer.types';
import { useSequencerStore } from '../store/sequencer.store';
import { TargetService } from '../services/target.service';

interface TargetLibraryProps {
  onTargetSelect?: (target: Target) => void;
  showCreateButton?: boolean;
  showImportButton?: boolean;
  allowMultiSelect?: boolean;
}

export const TargetLibrary: React.FC<TargetLibraryProps> = ({
  onTargetSelect,
  showCreateButton = true,
  showImportButton = true,
  allowMultiSelect = false,
}) => {
  const {
    targetLibrary,
    createTarget,
    updateTarget,
    deleteTarget,
    importTargets,
  } = useSequencerStore();

  const [searchOptions, setSearchOptions] = useState<TargetSearchOptions>({});
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'magnitude' | 'constellation' | 'ra' | 'dec'>('name');
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort targets
  const filteredTargets = useMemo(() => {
    let filtered = TargetService.searchTargets(targetLibrary.targets, searchOptions);
    return TargetService.sortTargets(filtered, sortBy);
  }, [targetLibrary.targets, searchOptions, sortBy]);

  // Target statistics
  const statistics = useMemo(() => {
    return TargetService.getTargetStatistics(filteredTargets);
  }, [filteredTargets]);

  const handleTargetSelect = (target: Target) => {
    if (allowMultiSelect) {
      const newSelected = new Set(selectedTargets);
      if (newSelected.has(target.id)) {
        newSelected.delete(target.id);
      } else {
        newSelected.add(target.id);
      }
      setSelectedTargets(newSelected);
    } else {
      onTargetSelect?.(target);
    }
  };

  const handleCreateTarget = (targetData: any) => {
    const newTarget = createTarget(targetData);
    setShowCreateDialog(false);
    onTargetSelect?.(newTarget);
  };

  const handleImportTargets = (targets: Target[]) => {
    importTargets(targets);
    setShowImportDialog(false);
  };

  const handleExportTargets = () => {
    const targetsToExport = selectedTargets.size > 0 
      ? filteredTargets.filter(t => selectedTargets.has(t.id))
      : filteredTargets;
    
    const csv = TargetService.exportTargetsToCSV(targetsToExport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'targets.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="target-library p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Target Library</h2>
          <p className="text-gray-600">
            {statistics.totalTargets} targets • {Object.keys(statistics.byType).length} types
          </p>
        </div>
        <div className="flex gap-2">
          {showCreateButton && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Target
            </button>
          )}
          {showImportButton && (
            <button
              onClick={() => setShowImportDialog(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Import
            </button>
          )}
          <button
            onClick={handleExportTargets}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search targets..."
            value={searchOptions.query || ''}
            onChange={(e) => setSearchOptions({ ...searchOptions, query: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={searchOptions.type || ''}
            onChange={(e) => setSearchOptions({ ...searchOptions, type: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="dso">Deep Sky Objects</option>
            <option value="planet">Planets</option>
            <option value="star">Stars</option>
            <option value="moon">Moon</option>
            <option value="sun">Sun</option>
            <option value="custom">Custom</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="magnitude">Sort by Magnitude</option>
            <option value="constellation">Sort by Constellation</option>
            <option value="ra">Sort by RA</option>
            <option value="dec">Sort by Dec</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Magnitude:</label>
              <input
                type="number"
                placeholder="Min"
                step="0.1"
                value={searchOptions.magnitude?.min || ''}
                onChange={(e) => setSearchOptions({
                  ...searchOptions,
                  magnitude: {
                    ...searchOptions.magnitude,
                    min: e.target.value ? parseFloat(e.target.value) : undefined,
                  }
                })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                step="0.1"
                value={searchOptions.magnitude?.max || ''}
                onChange={(e) => setSearchOptions({
                  ...searchOptions,
                  magnitude: {
                    ...searchOptions.magnitude,
                    max: e.target.value ? parseFloat(e.target.value) : undefined,
                  }
                })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Total Targets</div>
          <div className="text-xl font-semibold">{statistics.totalTargets}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">DSO Count</div>
          <div className="text-xl font-semibold">{statistics.byType.dso || 0}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Avg Magnitude</div>
          <div className="text-xl font-semibold">
            {statistics.averageMagnitude.toFixed(1)}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Constellations</div>
          <div className="text-xl font-semibold">
            {Object.keys(statistics.byConstellation).length}
          </div>
        </div>
      </div>

      {/* Target List */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTargets.map((target) => (
            <TargetCard
              key={target.id}
              target={target}
              isSelected={selectedTargets.has(target.id)}
              onSelect={() => handleTargetSelect(target)}
              onEdit={(updates) => updateTarget(target.id, updates)}
              onDelete={() => deleteTarget(target.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTargets.map((target) => (
            <TargetListItem
              key={target.id}
              target={target}
              isSelected={selectedTargets.has(target.id)}
              onSelect={() => handleTargetSelect(target)}
              onEdit={(updates) => updateTarget(target.id, updates)}
              onDelete={() => deleteTarget(target.id)}
            />
          ))}
        </div>
      )}

      {filteredTargets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No targets found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateTargetDialog
          onCreate={handleCreateTarget}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}

      {showImportDialog && (
        <ImportTargetsDialog
          onImport={handleImportTargets}
          onCancel={() => setShowImportDialog(false)}
        />
      )}
    </div>
  );
};

// Helper components
const TargetCard: React.FC<{
  target: Target;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (updates: Partial<Target>) => void;
  onDelete: () => void;
}> = ({ target, isSelected, onSelect, onEdit, onDelete }) => {
  const coordinates = TargetService.formatCoordinates(target.coordinates);
  
  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 truncate">{target.name}</h3>
        <div className="flex gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Open edit dialog
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Edit target"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Delete target"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="capitalize">{target.type}</span>
        </div>
        <div className="flex justify-between">
          <span>RA:</span>
          <span className="font-mono">{coordinates.ra}</span>
        </div>
        <div className="flex justify-between">
          <span>Dec:</span>
          <span className="font-mono">{coordinates.dec}</span>
        </div>
        {target.metadata.magnitude !== undefined && (
          <div className="flex justify-between">
            <span>Magnitude:</span>
            <span>{target.metadata.magnitude.toFixed(1)}</span>
          </div>
        )}
        {target.metadata.constellation && (
          <div className="flex justify-between">
            <span>Constellation:</span>
            <span>{target.metadata.constellation}</span>
          </div>
        )}
      </div>

      {target.metadata.commonNames && target.metadata.commonNames.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {target.metadata.commonNames.slice(0, 2).map((name) => (
            <span
              key={name}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {name}
            </span>
          ))}
          {target.metadata.commonNames.length > 2 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              +{target.metadata.commonNames.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const TargetListItem: React.FC<{
  target: Target;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (updates: Partial<Target>) => void;
  onDelete: () => void;
}> = ({ target, isSelected, onSelect, onEdit, onDelete }) => {
  const coordinates = TargetService.formatCoordinates(target.coordinates);
  
  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{target.name}</h3>
          <div className="text-sm text-gray-600">
            {target.metadata.constellation && (
              <span>{target.metadata.constellation} • </span>
            )}
            <span className="capitalize">{target.type}</span>
            {target.metadata.magnitude !== undefined && (
              <span> • Mag {target.metadata.magnitude.toFixed(1)}</span>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600 font-mono">
          <div>{coordinates.ra}</div>
          <div>{coordinates.dec}</div>
        </div>
      </div>
      
      <div className="flex gap-1 ml-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Open edit dialog
          }}
          className="p-1 text-gray-400 hover:text-gray-600"
          title="Edit target"
        >
          ✏️
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-400 hover:text-red-600"
          title="Delete target"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

// Placeholder dialogs - these would be implemented separately
const CreateTargetDialog: React.FC<{
  onCreate: (data: any) => void;
  onCancel: () => void;
}> = ({ onCreate, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create Target</h3>
        <p className="text-gray-600 mb-4">Target creation dialog would go here</p>
        <div className="flex gap-3">
          <button
            onClick={() => onCreate({})}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const ImportTargetsDialog: React.FC<{
  onImport: (targets: Target[]) => void;
  onCancel: () => void;
}> = ({ onImport, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Import Targets</h3>
        <p className="text-gray-600 mb-4">Target import dialog would go here</p>
        <div className="flex gap-3">
          <button
            onClick={() => onImport([])}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Import
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
