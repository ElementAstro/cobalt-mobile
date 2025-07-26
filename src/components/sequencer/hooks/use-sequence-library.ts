import { useState, useMemo, useCallback } from 'react';
import { useSequencerStore } from '../store/sequencer.store';
import {
  Sequence,
  SequenceTemplate,
  SequenceLibrary,
  SequenceStatistics,
  SerializationResult
} from '../types/sequencer.types';
import { 
  searchSequences, 
  filterSequencesByCategory, 
  sortSequences 
} from '../utils/sequencer.utils';

export interface UseSequenceLibraryReturn {
  // Library state
  library: SequenceLibrary;
  statistics: SequenceStatistics;
  
  // Filtered and sorted data
  sequences: Sequence[];
  templates: SequenceTemplate[];
  categories: string[];
  tags: string[];
  
  // Search and filter state
  searchQuery: string;
  selectedCategory: string;
  sortBy: 'name' | 'created' | 'modified' | 'duration';
  sortOrder: 'asc' | 'desc';
  
  // Search and filter actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSortBy: (sortBy: 'name' | 'created' | 'modified' | 'duration') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  clearFilters: () => void;
  
  // Sequence management
  createSequence: (name: string, description?: string) => Sequence;
  updateSequence: (sequenceId: string, updates: Partial<Sequence>) => void;
  deleteSequence: (sequenceId: string) => void;
  duplicateSequence: (sequenceId: string, newName?: string) => Sequence;
  
  // Template management
  createTemplate: (sequence: Sequence, name: string, description: string) => SequenceTemplate;
  deleteTemplate: (templateId: string) => void;
  applyTemplate: (templateId: string, sequenceId: string) => void;
  getBuiltInTemplates: () => SequenceTemplate[];
  
  // Import/Export
  exportSequences: (sequenceIds: string[]) => Promise<SerializationResult>;
  importSequences: (data: string) => Promise<void>;
  exportLibrary: () => Promise<SerializationResult>;
  
  // Statistics and analytics
  getSequencesByCategory: () => Record<string, number>;
  getRecentSequences: (limit?: number) => Sequence[];
  getMostUsedTemplates: (limit?: number) => SequenceTemplate[];
  
  // Utility functions
  findSequenceById: (id: string) => Sequence | undefined;
  findTemplateById: (id: string) => SequenceTemplate | undefined;
  getSequencesByTag: (tag: string) => Sequence[];
}

export function useSequenceLibrary(): UseSequenceLibraryReturn {
  const {
    library,
    statistics,
    createSequence: storeCreateSequence,
    updateSequence: storeUpdateSequence,
    deleteSequence: storeDeleteSequence,
    duplicateSequence: storeDuplicateSequence,
    createTemplate: storeCreateTemplate,
    deleteTemplate: storeDeleteTemplate,
    applyTemplate: storeApplyTemplate,
    exportSequences: storeExportSequences,
    importSequences: storeImportSequences,
    updateStatistics,
  } = useSequencerStore();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'modified' | 'duration'>('modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtered and sorted sequences
  const sequences = useMemo(() => {
    let filtered = library.sequences;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchSequences(filtered, searchQuery);
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filterSequencesByCategory(filtered, selectedCategory);
    }
    
    // Apply sorting
    const sorted = sortSequences(filtered, sortBy);
    
    // Apply sort order
    return sortOrder === 'desc' ? sorted : sorted.reverse();
  }, [library.sequences, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Filtered templates
  const templates = useMemo(() => {
    let filtered = library.templates;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }, [library.templates, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Filter actions
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('modified');
    setSortOrder('desc');
  }, []);

  // Sequence management
  const createSequence = useCallback((name: string, description?: string) => {
    const sequence = storeCreateSequence(name, description);
    updateStatistics();
    return sequence;
  }, [storeCreateSequence, updateStatistics]);

  const updateSequence = useCallback((sequenceId: string, updates: Partial<Sequence>) => {
    storeUpdateSequence(sequenceId, updates);
    updateStatistics();
  }, [storeUpdateSequence, updateStatistics]);

  const deleteSequence = useCallback((sequenceId: string) => {
    storeDeleteSequence(sequenceId);
    updateStatistics();
  }, [storeDeleteSequence, updateStatistics]);

  const duplicateSequence = useCallback((sequenceId: string, newName?: string) => {
    const sequence = storeDuplicateSequence(sequenceId, newName);
    updateStatistics();
    return sequence;
  }, [storeDuplicateSequence, updateStatistics]);

  // Template management
  const createTemplate = useCallback((sequence: Sequence, name: string, description: string) => {
    return storeCreateTemplate(sequence, name, description);
  }, [storeCreateTemplate]);

  const deleteTemplate = useCallback((templateId: string) => {
    storeDeleteTemplate(templateId);
  }, [storeDeleteTemplate]);

  const applyTemplate = useCallback((templateId: string, sequenceId: string) => {
    storeApplyTemplate(templateId, sequenceId);
  }, [storeApplyTemplate]);

  const getBuiltInTemplates = useCallback((): SequenceTemplate[] => {
    return library.templates.filter(template => template.isBuiltIn);
  }, [library.templates]);

  // Import/Export
  const exportSequences = useCallback((sequenceIds: string[]) => {
    return storeExportSequences(sequenceIds);
  }, [storeExportSequences]);

  const importSequences = useCallback(async (data: string) => {
    await storeImportSequences(data);
    updateStatistics();
  }, [storeImportSequences, updateStatistics]);

  const exportLibrary = useCallback(() => {
    const allSequenceIds = library.sequences.map(s => s.id);
    return storeExportSequences(allSequenceIds);
  }, [library.sequences, storeExportSequences]);

  // Statistics and analytics
  const getSequencesByCategory = useCallback((): Record<string, number> => {
    return library.sequences.reduce((counts, sequence) => {
      const category = sequence.metadata.category || 'Uncategorized';
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, [library.sequences]);

  const getRecentSequences = useCallback((limit: number = 5): Sequence[] => {
    return [...library.sequences]
      .sort((a, b) => b.modified.getTime() - a.modified.getTime())
      .slice(0, limit);
  }, [library.sequences]);

  const getMostUsedTemplates = useCallback((limit: number = 5): SequenceTemplate[] => {
    // This would require tracking template usage in the store
    // For now, return templates sorted by name
    return [...library.templates]
      .filter(template => !template.isBuiltIn)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);
  }, [library.templates]);

  // Utility functions
  const findSequenceById = useCallback((id: string): Sequence | undefined => {
    return library.sequences.find(sequence => sequence.id === id);
  }, [library.sequences]);

  const findTemplateById = useCallback((id: string): SequenceTemplate | undefined => {
    return library.templates.find(template => template.id === id);
  }, [library.templates]);

  const getSequencesByTag = useCallback((tag: string): Sequence[] => {
    return library.sequences.filter(sequence =>
      sequence.metadata.tags.includes(tag)
    );
  }, [library.sequences]);

  return {
    // Library state
    library,
    statistics,
    
    // Filtered and sorted data
    sequences,
    templates,
    categories: library.categories,
    tags: library.tags,
    
    // Search and filter state
    searchQuery,
    selectedCategory,
    sortBy,
    sortOrder,
    
    // Search and filter actions
    setSearchQuery,
    setSelectedCategory,
    setSortBy,
    setSortOrder,
    clearFilters,
    
    // Sequence management
    createSequence,
    updateSequence,
    deleteSequence,
    duplicateSequence,
    
    // Template management
    createTemplate,
    deleteTemplate,
    applyTemplate,
    getBuiltInTemplates,
    
    // Import/Export
    exportSequences,
    importSequences,
    exportLibrary,
    
    // Statistics and analytics
    getSequencesByCategory,
    getRecentSequences,
    getMostUsedTemplates,
    
    // Utility functions
    findSequenceById,
    findTemplateById,
    getSequencesByTag,
  };
}
