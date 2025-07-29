"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AsyncState, LoadingCard } from "@/components/ui/loading-states";
import {
  ArrowLeft,
  Settings,
  Activity,
  Thermometer,
  Zap,
  Wifi,
  Usb,
  Bluetooth,
  Cable,
  Power,
  PowerOff,
  Edit,
  Trash2,
  TestTube,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Info,
} from "lucide-react";
import { useEquipmentStore, Equipment } from "@/lib/stores/equipment-store";
import { cn } from "@/lib/utils";

interface EquipmentDetailProps {
  equipmentId: string;
  onBack: () => void;
  onEdit: (equipment: Equipment) => void;
}

export function EquipmentDetail({ equipmentId, onBack, onEdit }: EquipmentDetailProps) {
  const {
    equipmentList,
    isLoadingEquipment,
    equipmentError,
    isConnectingEquipment,
    isDeletingEquipment,
    equipmentConnectionErrors,
    connectEquipment,
    disconnectEquipment,
    deleteEquipment,
    testEquipmentConnection,
    loadEquipmentList,
  } = useEquipmentStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const equipment = equipmentList.find(eq => eq.id === equipmentId);

  useEffect(() => {
    if (!equipment && !isLoadingEquipment) {
      loadEquipmentList();
    }
  }, [equipment, isLoadingEquipment, loadEquipmentList]);

  const handleConnect = async () => {
    if (!equipment) return;
    try {
      await connectEquipment(equipment.id);
    } catch (error) {
      console.error('Failed to connect equipment:', error);
    }
  };

  const handleDisconnect = async () => {
    if (!equipment) return;
    try {
      await disconnectEquipment(equipment.id);
    } catch (error) {
      console.error('Failed to disconnect equipment:', error);
    }
  };

  const handleDelete = async () => {
    if (!equipment) return;
    if (window.confirm(`Are you sure you want to delete ${equipment.name}?`)) {
      try {
        await deleteEquipment(equipment.id);
        onBack();
      } catch (error) {
        console.error('Failed to delete equipment:', error);
      }
    }
  };

  const handleTestConnection = async () => {
    if (!equipment) return;
    setIsTestingConnection(true);
    try {
      await testEquipmentConnection(equipment.id);
      alert('Connection test successful!');
    } catch (error) {
      alert(`Connection test failed: ${error}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusIcon = (status: Equipment['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'connecting':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getConnectionIcon = (type: Equipment['connectionType']) => {
    switch (type) {
      case 'wifi':
        return <Wifi className="h-5 w-5" />;
      case 'usb':
        return <Usb className="h-5 w-5" />;
      case 'bluetooth':
        return <Bluetooth className="h-5 w-5" />;
      case 'serial':
        return <Cable className="h-5 w-5" />;
      default:
        return <Cable className="h-5 w-5" />;
    }
  };

  if (isLoadingEquipment) {
    return <LoadingCard title="Loading Equipment Details" />;
  }

  if (!equipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AsyncState
          loading={false}
          error="Equipment not found"
          onRetry={() => loadEquipmentList()}
        >
          <div />
        </AsyncState>
      </div>
    );
  }

  const isConnecting = isConnectingEquipment[equipment.id];
  const isDeleting = isDeletingEquipment[equipment.id];
  const connectionError = equipmentConnectionErrors[equipment.id];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{equipment.name}</h1>
            <p className="text-muted-foreground">
              {equipment.brand} {equipment.model}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon(equipment.status)}
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
      </div>

      {/* Connection Error */}
      {connectionError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Connection Error</span>
            </div>
            <p className="text-red-600 mt-1">{connectionError}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {equipment.status === 'disconnected' ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center gap-2"
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
                variant="outline"
                onClick={handleDisconnect}
                className="flex items-center gap-2"
              >
                <PowerOff className="h-4 w-4" />
                Disconnect
              </Button>
            ) : null}

            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="flex items-center gap-2"
            >
              {isTestingConnection ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Test Connection
            </Button>

            <Button
              variant="outline"
              onClick={() => onEdit(equipment)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>

            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              {isDeleting ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">
                    {equipment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand</span>
                  <span className="font-medium">{equipment.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{equipment.model}</span>
                </div>
                {equipment.serialNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serial Number</span>
                    <span className="font-medium">{equipment.serialNumber}</span>
                  </div>
                )}
                {equipment.firmware && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Firmware</span>
                    <span className="font-medium">{equipment.firmware}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getConnectionIcon(equipment.connectionType)}
                  Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{equipment.connectionType.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(equipment.status)}
                    <span className="font-medium">
                      {equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
                    </span>
                  </div>
                </div>
                {equipment.lastConnected && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Connected</span>
                    <span className="font-medium">
                      {new Date(equipment.lastConnected).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Added</span>
                  <span className="font-medium">
                    {new Date(equipment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Equipment Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(equipment.settings).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(equipment.settings).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-muted rounded">
                      <span className="font-medium">{key}</span>
                      <span className="text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No custom settings configured for this equipment.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Equipment Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {equipment.capabilities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {equipment.capabilities.map((capability, index) => (
                    <Badge key={index} variant="secondary">
                      {capability}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No capabilities defined for this equipment.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Equipment Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Equipment logging functionality will be available in a future update.
                </p>
                <Button variant="outline" className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
