"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  // Trash2, // Unused for now
  Download,
  Filter,
} from "lucide-react";

import { SequenceError, SequenceWarning, SequenceLogEntry } from "../types/sequencer.types";
import { formatTime } from "../utils/sequencer.utils";

interface ExecutionLogsProps {
  logs: SequenceLogEntry[];
  errors: SequenceError[];
  warnings: SequenceWarning[];
}

export function ExecutionLogs({ logs, errors, warnings }: ExecutionLogsProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [showOnlyRecent, setShowOnlyRecent] = useState(true);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredLogs = showOnlyRecent ? logs.slice(-50) : logs;
  const filteredErrors = showOnlyRecent ? errors.slice(-20) : errors;
  const filteredWarnings = showOnlyRecent ? warnings.slice(-20) : warnings;

  const allEntries = [
    ...filteredLogs.map(log => ({ ...log, type: 'log' as const })),
    ...filteredErrors.map(error => ({ ...error, type: 'error' as const, level: error.level })),
    ...filteredWarnings.map(warning => ({ ...warning, type: 'warning' as const, level: 'warn' as const })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const exportLogs = () => {
    const data = {
      logs: filteredLogs,
      errors: filteredErrors,
      warnings: filteredWarnings,
      exportDate: new Date(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequencer-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Execution Logs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowOnlyRecent(!showOnlyRecent)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showOnlyRecent ? 'Show All' : 'Recent Only'}
            </Button>
            <Button size="sm" variant="outline" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="outline" className="text-xs">
                {allEntries.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-2">
              Errors
              <Badge variant="destructive" className="text-xs">
                {filteredErrors.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="warnings" className="flex items-center gap-2">
              Warnings
              <Badge variant="secondary" className="text-xs">
                {filteredWarnings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              Info
              <Badge variant="outline" className="text-xs">
                {filteredLogs.filter(log => log.level === 'info').length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {allEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No log entries yet.
                  </div>
                ) : (
                  allEntries.map((entry, index) => (
                    <div
                      key={`${entry.type}-${entry.id}-${index}`}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      {getLogIcon(entry.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {formatTime(entry.timestamp)}
                          </span>
                          <Badge variant={getLogBadgeVariant(entry.level)} className="text-xs">
                            {entry.level}
                          </Badge>
                          {entry.type === 'error' && (entry as SequenceError).recoverable && (
                            <Badge variant="outline" className="text-xs">
                              Recoverable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{entry.message}</p>
                        {('details' in entry) && entry.details && (
                          <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>
                        )}
                        {('data' in entry) && entry.data && (
                          <pre className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(entry.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="errors" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredErrors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No errors recorded.
                  </div>
                ) : (
                  filteredErrors.map((error) => (
                    <div
                      key={error.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                    >
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {formatTime(error.timestamp)}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {error.level}
                          </Badge>
                          {error.recoverable && (
                            <Badge variant="outline" className="text-xs">
                              Recoverable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
                        {error.details && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error.details}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="warnings" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredWarnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No warnings recorded.
                  </div>
                ) : (
                  filteredWarnings.map((warning) => (
                    <div
                      key={warning.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
                    >
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {formatTime(warning.timestamp)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Warning
                          </Badge>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{warning.message}</p>
                        {warning.details && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{warning.details}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredLogs.filter(log => log.level === 'info').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No info logs recorded.
                  </div>
                ) : (
                  filteredLogs
                    .filter(log => log.level === 'info')
                    .map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                      >
                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {formatTime(log.timestamp)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Info
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground">{log.message}</p>
                          {log.data && (
                            <pre className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
