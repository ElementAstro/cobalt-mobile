import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Search result types
export interface SearchResult {
  id: string;
  type: 'equipment' | 'sequence' | 'target' | 'log' | 'setting' | 'profile' | 'notification';
  title: string;
  description: string;
  category: string;
  url?: string;
  metadata?: Record<string, any>;
  relevanceScore: number;
  lastAccessed?: Date;
}

export interface SearchFilter {
  types: string[];
  categories: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  relevanceThreshold: number;
}

export interface SearchSuggestion {
  id: string;
  query: string;
  type: 'recent' | 'popular' | 'suggested';
  count?: number;
  lastUsed?: Date;
}

export interface SearchStoreState {
  // Search state
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  hasSearched: boolean;
  
  // Filters
  filters: SearchFilter;
  
  // History and suggestions
  searchHistory: string[];
  suggestions: SearchSuggestion[];
  
  // Performance
  searchIndex: Map<string, SearchResult[]>;
  lastIndexUpdate: Date | null;
  
  // Actions
  setQuery: (query: string) => void;
  search: (query: string, filters?: Partial<SearchFilter>) => Promise<SearchResult[]>;
  clearSearch: () => void;
  updateFilters: (filters: Partial<SearchFilter>) => void;
  
  // History management
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
  
  // Index management
  buildSearchIndex: () => Promise<void>;
  addToIndex: (items: SearchResult[]) => void;
  removeFromIndex: (ids: string[]) => void;
  
  // Suggestions
  getSuggestions: (partial: string) => SearchSuggestion[];
  updateSuggestions: () => void;
  
  // Utility
  getRecentSearches: () => string[];
  getPopularSearches: () => string[];
  trackResultClick: (resultId: string) => void;
}

// Default filters
const defaultFilters: SearchFilter = {
  types: [],
  categories: [],
  relevanceThreshold: 0.3,
};

// Search utilities
const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
};

const calculateRelevance = (item: SearchResult, query: string): number => {
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(item.title);
  const normalizedDescription = normalizeText(item.description);
  
  let score = 0;
  
  // Exact title match
  if (normalizedTitle === normalizedQuery) {
    score += 1.0;
  }
  // Title starts with query
  else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 0.8;
  }
  // Title contains query
  else if (normalizedTitle.includes(normalizedQuery)) {
    score += 0.6;
  }
  
  // Description contains query
  if (normalizedDescription.includes(normalizedQuery)) {
    score += 0.4;
  }
  
  // Boost for recent access
  if (item.lastAccessed) {
    const daysSinceAccess = (Date.now() - item.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAccess < 7) {
      score += 0.2 * (7 - daysSinceAccess) / 7;
    }
  }
  
  // Word matching
  const queryWords = normalizedQuery.split(' ');
  const titleWords = normalizedTitle.split(' ');
  const descWords = normalizedDescription.split(' ');
  
  queryWords.forEach(queryWord => {
    if (queryWord.length > 2) {
      titleWords.forEach(titleWord => {
        if (titleWord.includes(queryWord)) {
          score += 0.3;
        }
      });
      descWords.forEach(descWord => {
        if (descWord.includes(queryWord)) {
          score += 0.1;
        }
      });
    }
  });
  
  return Math.min(score, 1.0);
};

// Mock data generators (replace with real data sources)
const generateMockEquipment = (): SearchResult[] => [
  {
    id: 'eq-1',
    type: 'equipment',
    title: 'Main Camera',
    description: 'Primary imaging camera for astrophotography',
    category: 'Camera',
    relevanceScore: 0,
    metadata: { status: 'connected', model: 'Canon EOS Ra' },
  },
  {
    id: 'eq-2',
    type: 'equipment',
    title: 'Mount Controller',
    description: 'Telescope mount control system',
    category: 'Mount',
    relevanceScore: 0,
    metadata: { status: 'connected', model: 'Celestron CGX' },
  },
  {
    id: 'eq-3',
    type: 'equipment',
    title: 'Filter Wheel',
    description: 'Automated filter wheel for multi-band imaging',
    category: 'Filters',
    relevanceScore: 0,
    metadata: { status: 'connected', filters: ['L', 'R', 'G', 'B', 'Ha', 'OIII'] },
  },
];

const generateMockSequences = (): SearchResult[] => [
  {
    id: 'seq-1',
    type: 'sequence',
    title: 'M31 Andromeda Galaxy',
    description: 'LRGB imaging sequence for Andromeda Galaxy',
    category: 'Deep Sky',
    relevanceScore: 0,
    metadata: { target: 'M31', filters: ['L', 'R', 'G', 'B'], totalTime: 240 },
  },
  {
    id: 'seq-2',
    type: 'sequence',
    title: 'Orion Nebula Mosaic',
    description: 'Multi-panel mosaic of the Orion Nebula',
    category: 'Nebula',
    relevanceScore: 0,
    metadata: { target: 'M42', panels: 4, totalTime: 480 },
  },
];

const generateMockTargets = (): SearchResult[] => [
  {
    id: 'tgt-1',
    type: 'target',
    title: 'Messier 31 (Andromeda Galaxy)',
    description: 'Large spiral galaxy in constellation Andromeda',
    category: 'Galaxy',
    relevanceScore: 0,
    metadata: { ra: '00h 42m 44s', dec: '+41° 16\' 09"', magnitude: 3.4 },
  },
  {
    id: 'tgt-2',
    type: 'target',
    title: 'Messier 42 (Orion Nebula)',
    description: 'Bright emission nebula in constellation Orion',
    category: 'Nebula',
    relevanceScore: 0,
    metadata: { ra: '05h 35m 17s', dec: '-05° 23\' 14"', magnitude: 4.0 },
  },
];

// Create search store
export const useSearchStore = create<SearchStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      query: '',
      results: [],
      isSearching: false,
      hasSearched: false,
      filters: defaultFilters,
      searchHistory: [],
      suggestions: [],
      searchIndex: new Map(),
      lastIndexUpdate: null,

      // Set search query
      setQuery: (query) => {
        set((state) => ({
          ...state,
          query,
        }));
      },

      // Perform search
      search: async (query, filterUpdates) => {
        set((state) => ({
          ...state,
          isSearching: true,
          query,
          filters: filterUpdates ? { ...state.filters, ...filterUpdates } : state.filters,
        }));

        try {
          // Build search index if needed
          const { searchIndex, lastIndexUpdate } = get();
          if (searchIndex.size === 0 || !lastIndexUpdate || 
              Date.now() - lastIndexUpdate.getTime() > 5 * 60 * 1000) {
            await get().buildSearchIndex();
          }

          // Get all searchable items
          const allItems = [
            ...generateMockEquipment(),
            ...generateMockSequences(),
            ...generateMockTargets(),
          ];

          // Calculate relevance and filter
          const { filters } = get();
          const results = allItems
            .map(item => ({
              ...item,
              relevanceScore: calculateRelevance(item, query),
            }))
            .filter(item => {
              // Apply filters
              if (filters.types.length > 0 && !filters.types.includes(item.type)) {
                return false;
              }
              if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
                return false;
              }
              if (item.relevanceScore < filters.relevanceThreshold) {
                return false;
              }
              return true;
            })
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 50); // Limit results

          set((state) => ({
            ...state,
            results,
            isSearching: false,
            hasSearched: true,
          }));

          // Add to history if query is meaningful
          if (query.trim().length > 2) {
            get().addToHistory(query.trim());
          }

          return results;
        } catch (error) {
          console.error('Search failed:', error);
          set((state) => ({
            ...state,
            results: [],
            isSearching: false,
            hasSearched: true,
          }));
          return [];
        }
      },

      // Clear search
      clearSearch: () => {
        set((state) => ({
          ...state,
          query: '',
          results: [],
          hasSearched: false,
        }));
      },

      // Update filters
      updateFilters: (filterUpdates) => {
        set((state) => ({
          ...state,
          filters: { ...state.filters, ...filterUpdates }
        }));
      },

      // Add to search history
      addToHistory: (query) => {
        set((state) => {
          const normalizedQuery = query.toLowerCase().trim();

          // Remove if already exists
          const filteredHistory = state.searchHistory.filter(
            item => item.toLowerCase() !== normalizedQuery
          );

          // Add to beginning and limit to 20 items
          const newHistory = [query, ...filteredHistory].slice(0, 20);

          return {
            ...state,
            searchHistory: newHistory
          };
        });
      },

      // Clear search history
      clearHistory: () => {
        set((state) => ({
          ...state,
          searchHistory: [],
        }));
      },

      // Remove from history
      removeFromHistory: (query) => {
        set((state) => ({
          ...state,
          searchHistory: state.searchHistory.filter(item => item !== query),
        }));
      },

      // Build search index
      buildSearchIndex: async () => {
        try {
          const allItems = [
            ...generateMockEquipment(),
            ...generateMockSequences(),
            ...generateMockTargets(),
          ];

          const index = new Map<string, SearchResult[]>();
          
          // Group by type and category
          allItems.forEach(item => {
            const typeKey = `type:${item.type}`;
            const categoryKey = `category:${item.category}`;
            
            if (!index.has(typeKey)) {
              index.set(typeKey, []);
            }
            if (!index.has(categoryKey)) {
              index.set(categoryKey, []);
            }
            
            index.get(typeKey)!.push(item);
            index.get(categoryKey)!.push(item);
          });

          set((state) => ({
            ...state,
            searchIndex: index,
            lastIndexUpdate: new Date(),
          }));
        } catch (error) {
          console.error('Failed to build search index:', error);
        }
      },

      // Add to index
      addToIndex: (items) => {
        set((state) => {
          const newIndex = new Map(state.searchIndex);

          items.forEach(item => {
            const typeKey = `type:${item.type}`;
            const categoryKey = `category:${item.category}`;

            if (!newIndex.has(typeKey)) {
              newIndex.set(typeKey, []);
            }
            if (!newIndex.has(categoryKey)) {
              newIndex.set(categoryKey, []);
            }

            newIndex.get(typeKey)!.push(item);
            newIndex.get(categoryKey)!.push(item);
          });

          return {
            ...state,
            searchIndex: newIndex,
          };
        });
      },

      // Remove from index
      removeFromIndex: (ids) => {
        set((state) => {
          const newIndex = new Map();

          state.searchIndex.forEach((items, key) => {
            newIndex.set(
              key,
              items.filter(item => !ids.includes(item.id))
            );
          });

          return {
            ...state,
            searchIndex: newIndex,
          };
        });
      },

      // Get suggestions
      getSuggestions: (partial) => {
        const { searchHistory } = get();
        const normalizedPartial = partial.toLowerCase();
        
        const suggestions: SearchSuggestion[] = [];
        
        // Recent searches
        searchHistory
          .filter(query => query.toLowerCase().includes(normalizedPartial))
          .slice(0, 5)
          .forEach((query, index) => {
            suggestions.push({
              id: `recent-${index}`,
              query,
              type: 'recent',
              lastUsed: new Date(),
            });
          });
        
        // Popular/suggested searches
        const popularQueries = ['camera', 'mount', 'sequence', 'M31', 'Orion', 'filter'];
        popularQueries
          .filter(query => query.toLowerCase().includes(normalizedPartial))
          .slice(0, 3)
          .forEach((query, index) => {
            suggestions.push({
              id: `popular-${index}`,
              query,
              type: 'popular',
              count: Math.floor(Math.random() * 100) + 10,
            });
          });
        
        return suggestions;
      },

      // Update suggestions
      updateSuggestions: () => {
        // This would typically fetch from an API
        // For now, we'll use the existing logic in getSuggestions
      },

      // Get recent searches
      getRecentSearches: () => {
        return get().searchHistory.slice(0, 10);
      },

      // Get popular searches
      getPopularSearches: () => {
        // This would typically come from analytics
        return ['camera settings', 'mount alignment', 'sequence planning', 'target catalog'];
      },

      // Track result click
      trackResultClick: (resultId) => {
        // Update last accessed time for the result
        set((state) => ({
          ...state,
          results: state.results.map(result =>
            result.id === resultId
              ? { ...result, lastAccessed: new Date() }
              : result
          )
        }));
      },
    }),
    {
      name: 'search-store',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        filters: state.filters,
      }),
    }
  )
);
