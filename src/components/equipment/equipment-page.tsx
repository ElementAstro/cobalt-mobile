"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ResponsiveGrid, GridLayouts } from "@/components/ui/responsive-grid";
import { PullToRefreshContainer } from "@/components/ui/pull-to-refresh";
import { AsyncState, LoadingCard } from "@/components/ui/loading-states";
import { EquipmentStatusWidget } from "@/components/ui/status-widget";
import { HelpTooltip } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Camera,
  Compass,
  Filter,
  Focus,
  Search,
  Plus,
  Settings,
  Trash2,
  Power,
  PowerOff,
  Edit,
  Eye,
  MoreVertical,
  SortAsc,
  SortDesc,
  X,
  Wifi,
  Usb,
  Bluetooth,
  Cable,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useEquipmentStore, Equipment } from "@/lib/stores/equipment-store";
import { getMobileInteractiveClasses } from "@/lib/mobile-utils";
import { cn } from "@/lib/utils";

interface EquipmentPageProps {
  onEquipmentClick?: (equipment: Equipment) => void;
  onAddEquipment?: () => void;
  onEditEquipment?: (equipment: Equipment) => void;
}

export function EquipmentPage({
  onEquipmentClick,
  onAddEquipment,
  onEditEquipment,
}: EquipmentPageProps) {
  const {
    equipmentList,
    isLoadingEquipment,
    equipmentError,
    searchQuery,
    filterType,
    filterStatus,
    filterBrand,
    sortBy,
    sortOrder,
    isConnectingEquipment,
    isDeletingEquipment,
    equipmentConnectionErrors,
    loadEquipmentList,
    setSearchQuery,
    setFilterType,
    setFilterStatus,
    setFilterBrand,
    setSortBy,
    setSortOrder,
    clearFilters,
    connectEquipment,
    disconnectEquipment,
    deleteEquipment,
    testEquipmentConnection,
    getFilteredEquipment,
    startAddingEquipment,
    startEditingEquipment,
  } = useEquipmentStore();

  const [showFilters, setShowFilters] = useState(false);

  // Load equipment on mount
  useEffect(() => {
    loadEquipmentList();
  }, [loadEquipmentList]);

  const handleRefresh = async () => {
    await loadEquipmentList();
  };

  const handleConnect = async (equipment: Equipment) => {
    try {
      await connectEquipment(equipment.id);
    } catch (error) {
      console.error('Failed to connect equipment:', error);
    }
  };

  const handleDisconnect = async (equipment: Equipment) => {
    try {
      await disconnectEquipment(equipment.id);
    } catch (error) {
      console.error('Failed to disconnect equipment:', error);
    }
  };

  const handleDelete = async (equipment: Equipment) => {
    if (window.confirm(`Are you sure you want to delete ${equipment.name}?`)) {
      try {
        await deleteEquipment(equipment.id);
      } catch (error) {
        console.error('Failed to delete equipment:', error);
      }
    }
  };

  const handleTest = async (equipment: Equipment) => {
    try {
      await testEquipmentConnection(equipment.id);
      alert('Connection test successful!');
    } catch (error) {
      alert(`Connection test failed: ${error}`);
    }
  };

  const getStatusIcon = (status: Equipment['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'connecting':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionIcon = (type: Equipment['connectionType']) => {
    switch (type) {
      case 'wifi':
        return <Wifi className="h-4 w-4" />;
      case 'usb':
        return <Usb className="h-4 w-4" />;
      case 'bluetooth':
        return <Bluetooth className="h-4 w-4" />;
      case 'serial':
        return <Cable className="h-4 w-4" />;
      default:
        return <Cable className="h-4 w-4" />;
    }
  };

  const getEquipmentIcon = (type: Equipment['type']) => {
    switch (type) {
      case 'camera':
        return Camera;
      case 'mount':
        return Compass;
      case 'filter_wheel':
        return Filter;
      case 'focuser':
        return Focus;
      default:
        return Settings;
    }
  };

  const filteredEquipment = getFilteredEquipment();
  const uniqueTypes = [...new Set(equipmentList.map(eq => eq.type))];
  const uniqueBrands = [...new Set(equipmentList.map(eq => eq.brand))];
  const uniqueStatuses = ['connected', 'disconnected', 'error', 'connecting'];

  if (equipmentError && !equipmentList.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AsyncState
          loading={false}
          error={equipmentError}
          onRetry={handleRefresh}
          loadingComponent={<LoadingCard title="Loading Equipment" />}
        >
          <div />
        </AsyncState>
      </div>
    );
  }

  return (
    <PullToRefreshContainer onRefresh={handleRefresh} className="min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Equipment Management</h2>
            <p className="text-muted-foreground">
              Manage and monitor your astrophotography equipment
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                startAddingEquipment();
                onAddEquipment?.();
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Equipment
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment by name, brand, model, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Filters
                  {(filterType || filterStatus || filterBrand) && (
                    <Badge variant="secondary" className="ml-1">
                      Active
                    </Badge>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="lastConnected">Last Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Controls */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select value={filterType || ''} onValueChange={(value) => setFilterType(value || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        {uniqueTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={filterStatus || ''} onValueChange={(value) => setFilterStatus(value || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        {uniqueStatuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Brand</label>
                    <Select value={filterBrand || ''} onValueChange={(value) => setFilterBrand(value || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All brands</SelectItem>
                        {uniqueBrands.map(brand => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Equipment List */}
        {isLoadingEquipment && !equipmentList.length ? (
          <LoadingCard title="Loading Equipment" description="Fetching your equipment list..." />
        ) : (
          <>
            {/* Equipment Stats */}
            <ResponsiveGrid columns={{ xs: 2, sm: 4 }} gap="compact">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{equipmentList.length}</div>
                  <div className="text-sm text-muted-foreground">Total Equipment</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {equipmentList.filter(eq => eq.status === 'connected').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Connected</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-500">
                    {equipmentList.filter(eq => eq.status === 'disconnected').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Disconnected</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {equipmentList.filter(eq => eq.status === 'error').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </CardContent>
              </Card>
            </ResponsiveGrid>

            {/* Equipment Cards */}
            {filteredEquipment.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground mb-4">
                    {equipmentList.length === 0 ? (
                      <>
                        <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium mb-2">No Equipment Found</h3>
                        <p>Get started by adding your first piece of equipment.</p>
                      </>
                    ) : (
                      <>
                        <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                        <p>Try adjusting your search or filter criteria.</p>
                      </>
                    )}
                  </div>
                  {equipmentList.length === 0 && (
                    <Button
                      onClick={() => {
                        startAddingEquipment();
                        onAddEquipment?.();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Equipment
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <ResponsiveGrid {...GridLayouts.equipment}>
                {filteredEquipment.map((equipment) => {
                  const IconComponent = getEquipmentIcon(equipment.type);
                  const isConnecting = isConnectingEquipment[equipment.id];
                  const isDeleting = isDeletingEquipment[equipment.id];
                  const connectionError = equipmentConnectionErrors[equipment.id];

                  return (
                    <Card
                      key={equipment.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        getMobileInteractiveClasses({ feedback: true, focus: true }),
                        isDeleting && "opacity-50 pointer-events-none"
                      )}
                      onClick={() => onEquipmentClick?.(equipment)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                <IconComponent className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-base truncate">
                                    {equipment.name}
                                  </h3>
                                  {getStatusIcon(equipment.status)}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {equipment.brand} {equipment.model}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Status and Connection Info */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Status</span>
                              <Badge
                                variant={
                                  equipment.status === 'connected' ? 'default' :
                                  equipment.status === 'error' ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Connection</span>
                              <div className="flex items-center gap-1">
                                {getConnectionIcon(equipment.connectionType)}
                                <span className="text-sm">
                                  {equipment.connectionType.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {equipment.lastConnected && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Last Connected</span>
                                <span className="text-sm">
                                  {new Date(equipment.lastConnected).toLocaleDateString()}
                                </span>
                              </div>
                            )}

                            {equipment.firmware && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Firmware</span>
                                <span className="text-sm">{equipment.firmware}</span>
                              </div>
                            )}
                          </div>

                          {/* Connection Error */}
                          {connectionError && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              {connectionError}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2 border-t">
                            {equipment.status === 'disconnected' ? (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConnect(equipment);
                                }}
                                disabled={isConnecting}
                                className="flex-1"
                              >
                                {isConnecting ? (
                                  <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                                {isConnecting ? 'Connecting...' : 'Connect'}
                              </Button>
                            ) : equipment.status === 'connected' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDisconnect(equipment);
                                }}
                                className="flex-1"
                              >
                                <PowerOff className="h-4 w-4" />
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTest(equipment);
                                }}
                                className="flex-1"
                              >
                                <Settings className="h-4 w-4" />
                                Test
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingEquipment(equipment.id);
                                onEditEquipment?.(equipment);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(equipment);
                              }}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Clock className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </ResponsiveGrid>
            )}
          </>
        )}
      </div>
    </PullToRefreshContainer>
  );
}
