"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Copy,
  // Play, // Unused for now
  Clock,
  Target,
} from "lucide-react";

import { useSequenceLibrary } from "../hooks/use-sequence-library";
import { formatDuration, formatDateTime, getStepTypeIcon, getStepTypeColor } from "../utils/sequencer.utils";

interface SequenceLibraryProps {
  activeSequenceId?: string;
  onSelectSequence: (sequenceId: string | null) => void;
}

export function SequenceLibrary({
  activeSequenceId,
  onSelectSequence,
}: SequenceLibraryProps) {
  const [newSequenceName, setNewSequenceName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    sequences,
    templates,
    categories,
    searchQuery,
    selectedCategory,
    sortBy,
    setSearchQuery,
    setSelectedCategory,
    setSortBy,
    clearFilters,
    createSequence,
    deleteSequence,
    duplicateSequence,
    exportSequences,
    importSequences,
    applyTemplate,
  } = useSequenceLibrary();

  const handleCreateSequence = () => {
    if (newSequenceName.trim()) {
      const sequence = createSequence(newSequenceName.trim());
      onSelectSequence(sequence.id);
      setNewSequenceName("");
      setShowCreateForm(false);
    }
  };

  const handleDeleteSequence = (sequenceId: string) => {
    if (confirm('Are you sure you want to delete this sequence?')) {
      deleteSequence(sequenceId);
      if (activeSequenceId === sequenceId) {
        onSelectSequence(null);
      }
    }
  };

  const handleDuplicateSequence = (sequenceId: string) => {
    const sequence = sequences.find(s => s.id === sequenceId);
    if (sequence) {
      const duplicated = duplicateSequence(sequenceId, `${sequence.name} (Copy)`);
      onSelectSequence(duplicated.id);
    }
  };

  const handleExportSequence = async (sequenceId: string) => {
    try {
      const result = await exportSequences([sequenceId]);
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sequence-${sequenceId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        console.error('Export failed:', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleImportSequence = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result as string;
          await importSequences(data);
        } catch {
          alert('Failed to import sequence. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    if (activeSequenceId) {
      applyTemplate(templateId, activeSequenceId);
    } else {
      // Create new sequence from template
      const template = templates.find(t => t.id === templateId);
      if (template) {
        const newSequence = createSequence(template.name, template.description);
        applyTemplate(templateId, newSequence.id);
        onSelectSequence(newSequence.id);
      }
    }
  };

  return (
    <Tabs defaultValue="sequences" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sequences">My Sequences</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
      </TabsList>

      <TabsContent value="sequences" className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Sequence Library
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSequence}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create New Sequence Form */}
          {showCreateForm && (
            <div className="p-4 border rounded-lg space-y-3">
              <Input
                placeholder="Sequence name"
                value={newSequenceName}
                onChange={(e) => setNewSequenceName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateSequence()}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateSequence} disabled={!newSequenceName.trim()}>
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sequences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modified">Modified</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || selectedCategory !== 'all') && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sequence List */}
      <div className="space-y-2">
        {sequences.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'No sequences match your filters.' 
                  : 'No sequences in your library yet.'}
              </p>
              {!searchQuery && selectedCategory === 'all' && (
                <Button onClick={() => setShowCreateForm(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Sequence
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sequences.map((sequence) => (
            <Card
              key={sequence.id}
              className={`cursor-pointer transition-colors ${
                activeSequenceId === sequence.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => onSelectSequence(sequence.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{sequence.name}</h3>
                      <Badge variant={sequence.status === 'completed' ? 'default' : 'outline'}>
                        {sequence.status}
                      </Badge>
                    </div>
                    
                    {sequence.description && (
                      <p className="text-sm text-muted-foreground mb-2 truncate">
                        {sequence.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {sequence.steps.length} steps
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(sequence.estimatedDuration)}
                      </div>
                      <div>
                        Modified {formatDateTime(sequence.modified)}
                      </div>
                    </div>
                    
                    {sequence.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sequence.metadata.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {sequence.metadata.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{sequence.metadata.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateSequence(sequence.id);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSequence(sequence.id);
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSequence(sequence.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </TabsContent>

      <TabsContent value="templates" className="space-y-4">
        {/* Template Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Sequence Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Choose from pre-built sequence templates to get started quickly.
            </p>

            <div className="space-y-2">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{template.name}</h3>
                          <Badge variant={template.isBuiltIn ? 'default' : 'outline'}>
                            {template.isBuiltIn ? 'Built-in' : 'Custom'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2 truncate">
                          {template.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {template.steps.length} steps
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(template.steps.reduce((total, step) => total + step.duration, 0))}
                          </div>
                        </div>

                        {/* Step Preview */}
                        <div className="flex items-center gap-1 mt-2">
                          {template.steps.slice(0, 5).map((step, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-center w-6 h-6 rounded text-white text-xs ${getStepTypeColor(step.type)}`}
                            >
                              {getStepTypeIcon(step.type)}
                            </div>
                          ))}
                          {template.steps.length > 5 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              +{template.steps.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApplyTemplate(template.id)}
                        >
                          {activeSequenceId ? 'Apply' : 'Use Template'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
