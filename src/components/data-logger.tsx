"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Download,
  Trash2,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warning" | "error" | "success";
  category: "camera" | "mount" | "filter" | "focuser" | "sequence" | "system";
  message: string;
  details?: Record<string, unknown>;
}

export default function DataLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Simulate log generation
  useEffect(() => {
    const generateLog = () => {
      const categories = [
        "camera",
        "mount",
        "filter",
        "focuser",
        "sequence",
        "system",
      ] as const;
      const levels = ["info", "warning", "error", "success"] as const;
      const messages = {
        camera: [
          "Camera connected successfully",
          "Exposure started: 300s",
          "Image captured and saved",
          "Cooling target reached: -10°C",
          "Camera temperature warning: -5°C",
        ],
        mount: [
          "Mount tracking started",
          "Slew to target completed",
          "Guiding calibration successful",
          "Mount parked safely",
          "Tracking error detected",
        ],
        filter: [
          "Filter wheel connected",
          "Filter changed to Luminance",
          "Filter wheel movement completed",
          "Filter position error",
          "Filter wheel homed",
        ],
        focuser: [
          "Focuser connected",
          "Auto focus completed",
          "Focus position: 15420",
          "Focuser movement timeout",
          "Best focus found: HFR 2.1",
        ],
        sequence: [
          "Sequence started: M31 Deep Sky",
          "Sequence step completed",
          "Sequence paused by user",
          "Sequence completed successfully",
          "Sequence aborted due to error",
        ],
        system: [
          "Application started",
          "Profile loaded: Home Observatory",
          "Settings saved",
          "Connection lost to equipment",
          "System temperature: 45°C",
        ],
      };

      const category =
        categories[Math.floor(Math.random() * categories.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const message =
        messages[category][
          Math.floor(Math.random() * messages[category].length)
        ];

      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        level,
        category,
        message,
        details:
          level === "error"
            ? { errorCode: "E001", stack: "Error stack trace..." }
            : undefined,
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 999)]); // Keep last 1000 logs
    };

    // Generate initial logs
    for (let i = 0; i < 20; i++) {
      setTimeout(() => generateLog(), i * 100);
    }

    // Continue generating logs
    const interval = setInterval(generateLog, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter logs
  useEffect(() => {
    let filtered = logs;

    if (levelFilter !== "all") {
      filtered = filtered.filter((log) => log.level === levelFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((log) => log.category === categoryFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, levelFilter, categoryFilter]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      info: "default",
      warning: "secondary",
      error: "destructive",
      success: "default",
    } as const;

    return (
      <Badge variant={variants[level as keyof typeof variants] || "default"}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      camera: "text-purple-600",
      mount: "text-blue-600",
      filter: "text-green-600",
      focuser: "text-orange-600",
      sequence: "text-red-600",
      system: "text-gray-600",
    };
    return colors[category as keyof typeof colors] || "text-gray-600";
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logData = filteredLogs.map((log) => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      category: log.category,
      message: log.message,
      details: log.details,
    }));

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astro-logs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Log Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Log Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{logs.length}</div>
              <div className="text-sm text-muted-foreground">Total Logs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {logs.filter((l) => l.level === "error").length}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {logs.filter((l) => l.level === "warning").length}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {logs.filter((l) => l.level === "success").length}
              </div>
              <div className="text-sm text-muted-foreground">Success</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Log Viewer
            </span>
            <div className="flex gap-2">
              <Button onClick={exportLogs} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={clearLogs} size="sm" variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Level Filter</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Filter</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="camera">Camera</SelectItem>
                  <SelectItem value="mount">Mount</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                  <SelectItem value="focuser">Focuser</SelectItem>
                  <SelectItem value="sequence">Sequence</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} log entries
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <div className="space-y-1 p-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getLevelIcon(log.level)}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getCategoryColor(log.category)}`}
                    >
                      {log.category.toUpperCase()}
                    </Badge>
                    {getLevelBadge(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{log.message}</div>
                    {log.details && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No log entries match the current filters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
