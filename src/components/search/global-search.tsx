"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore, type SearchResult } from '@/lib/stores/search-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';
import {
  Search,
  X,
  Filter,
  Clock,
  TrendingUp,
  Camera,
  Target,
  Settings,
  FileText,
  Star,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface GlobalSearchProps {
  className?: string;
  onClose?: () => void;
  onResultSelect?: (result: SearchResult) => void;
}

const getResultIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'equipment':
      return Camera;
    case 'sequence':
      return Target;
    case 'target':
      return Star;
    case 'setting':
      return Settings;
    case 'log':
      return FileText;
    default:
      return Search;
  }
};

const getResultColor = (type: SearchResult['type']) => {
  switch (type) {
    case 'equipment':
      return 'text-purple-500';
    case 'sequence':
      return 'text-blue-500';
    case 'target':
      return 'text-yellow-500';
    case 'setting':
      return 'text-gray-500';
    case 'log':
      return 'text-green-500';
    default:
      return 'text-muted-foreground';
  }
};

function SearchResult({ result, onSelect }: {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
}) {
  const Icon = getResultIcon(result.type);
  const iconColor = getResultColor(result.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      className="p-3 rounded-lg cursor-pointer transition-colors"
      onClick={() => onSelect(result)}
    >
      <div className="flex items-start space-x-3">
        <div className={cn("flex-shrink-0 mt-0.5", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium truncate">
              {result.title}
            </h4>
            <div className="flex items-center gap-2 ml-2">
              <Badge variant="outline" className="text-xs">
                {result.type}
              </Badge>
              {result.relevanceScore > 0.8 && (
                <Badge variant="secondary" className="text-xs">
                  Best Match
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {result.description}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {result.category}
            </Badge>
            {result.lastAccessed && (
              <span className="text-xs text-muted-foreground">
                Last accessed {new Date(result.lastAccessed).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    </motion.div>
  );
}

export function GlobalSearch({ className, onClose, onResultSelect }: GlobalSearchProps) {
  const {
    query,
    results,
    isSearching,
    hasSearched,
    filters,
    searchHistory,
    setQuery,
    search,
    clearSearch,
    updateFilters,
    getSuggestions,
    getRecentSearches,
    getPopularSearches,
    trackResultClick,
  } = useSearchStore();

  const { announce } = useAccessibility();
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle search with debouncing
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length === 0) {
      clearSearch();
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await search(searchQuery);
      announce(`Found ${results.length} results for "${searchQuery}"`);
    }, 300);
  }, [search, clearSearch, announce]);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    
    if (value.trim().length > 0) {
      const newSuggestions = getSuggestions(value);
      setSuggestions(newSuggestions);
      handleSearch(value);
    } else {
      setSuggestions([]);
      clearSearch();
    }
  }, [setQuery, getSuggestions, handleSearch, clearSearch]);

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    trackResultClick(result.id);
    onResultSelect?.(result);
    announce(`Selected ${result.title}`);
  }, [trackResultClick, onResultSelect, announce]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
    setSuggestions([]);
    inputRef.current?.focus();
  }, [setQuery, handleSearch]);

  // Handle filter updates
  const handleFilterUpdate = useCallback((filterUpdates: any) => {
    updateFilters(filterUpdates);
    if (query.trim().length > 0) {
      handleSearch(query);
    }
  }, [updateFilters, query, handleSearch]);

  // Clear search
  const handleClear = useCallback(() => {
    setQuery('');
    clearSearch();
    setSuggestions([]);
    inputRef.current?.focus();
    announce('Search cleared');
  }, [setQuery, clearSearch, announce]);

  const recentSearches = getRecentSearches();
  const popularSearches = getPopularSearches();
  const showSuggestions = query.length > 0 && suggestions.length > 0 && !hasSearched;
  const showEmptyState = !isSearching && !hasSearched && query.length === 0;
  const showNoResults = !isSearching && hasSearched && results.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("w-full max-w-2xl mx-auto", className)}
    >
      <Card>
        <CardContent className="p-0">
          {/* Search Header */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search equipment, sequences, targets..."
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="pl-10 pr-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleClear();
                    }
                  }}
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="absolute right-0 top-0 h-full px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2",
                  showFilters && "bg-muted"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                {(filters.types.length > 0 || filters.categories.length > 0) && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.types.length + filters.categories.length}
                  </Badge>
                )}
              </Button>
              
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  <div>
                    <label className="text-sm font-medium mb-2 block">Types</label>
                    <div className="flex flex-wrap gap-2">
                      {['equipment', 'sequence', 'target', 'log', 'setting'].map((type) => (
                        <Button
                          key={type}
                          variant={filters.types.includes(type) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newTypes = filters.types.includes(type)
                              ? filters.types.filter(t => t !== type)
                              : [...filters.types, type];
                            handleFilterUpdate({ types: newTypes });
                          }}
                          className="text-xs capitalize"
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {['Camera', 'Mount', 'Filters', 'Deep Sky', 'Nebula', 'Galaxy'].map((category) => (
                        <Button
                          key={category}
                          variant={filters.categories.includes(category) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newCategories = filters.categories.includes(category)
                              ? filters.categories.filter(c => c !== category)
                              : [...filters.categories, category];
                            handleFilterUpdate({ categories: newCategories });
                          }}
                          className="text-xs"
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Content */}
          <div className="max-h-96 overflow-hidden">
            {/* Loading State */}
            {isSearching && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </div>
              </div>
            )}

            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4"
                >
                  <h4 className="text-sm font-medium mb-3">Suggestions</h4>
                  <div className="space-y-1">
                    {suggestions.slice(0, 5).map((suggestion) => (
                      <Button
                        key={suggestion.id}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-2"
                        onClick={() => handleSuggestionSelect(suggestion.query)}
                      >
                        <div className="flex items-center gap-2">
                          {suggestion.type === 'recent' ? (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-sm">{suggestion.query}</span>
                          {suggestion.type === 'popular' && suggestion.count && (
                            <Badge variant="outline" className="text-xs ml-auto">
                              {suggestion.count}
                            </Badge>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search Results */}
            {!isSearching && hasSearched && results.length > 0 && (
              <ScrollArea className="h-96">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">
                      Results ({results.length})
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <AnimatePresence>
                      {results.map((result) => (
                        <SearchResult
                          key={result.id}
                          result={result}
                          onSelect={handleResultSelect}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </ScrollArea>
            )}

            {/* No Results */}
            {showNoResults && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={handleClear}>
                  Clear Search
                </Button>
              </div>
            )}

            {/* Empty State */}
            {showEmptyState && (
              <div className="p-4 space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Searches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.slice(0, 5).map((search, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionSelect(search)}
                          className="text-xs"
                        >
                          {search}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Popular Searches
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((search, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionSelect(search)}
                        className="text-xs"
                      >
                        {search}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
