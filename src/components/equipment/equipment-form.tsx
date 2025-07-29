"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AsyncState } from "@/components/ui/loading-states";
import {
  X,
  Save,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useEquipmentStore, Equipment } from "@/lib/stores/equipment-store";
import { cn } from "@/lib/utils";

interface EquipmentFormProps {
  equipment?: Equipment | null;
  onClose: () => void;
  onSave?: (equipment: Equipment) => void;
}

export function EquipmentForm({ equipment, onClose, onSave }: EquipmentFormProps) {
  const {
    isAddingEquipment,
    isEditingEquipment,
    formErrors,
    addEquipment,
    updateEquipment,
    cancelEquipmentForm,
    setFormError,
    clearFormErrors,
  } = useEquipmentStore();

  const isEditing = !!equipment;
  const isLoading = isAddingEquipment || isEditingEquipment;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'camera' as Equipment['type'],
    brand: '',
    model: '',
    connectionType: 'usb' as Equipment['connectionType'],
    capabilities: [] as string[],
    settings: {} as Record<string, any>,
    firmware: '',
    serialNumber: '',
  });

  const [newCapability, setNewCapability] = useState('');
  const [newSettingKey, setNewSettingKey] = useState('');
  const [newSettingValue, setNewSettingValue] = useState('');

  // Initialize form data when equipment changes
  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        type: equipment.type,
        brand: equipment.brand,
        model: equipment.model,
        connectionType: equipment.connectionType,
        capabilities: [...equipment.capabilities],
        settings: { ...equipment.settings },
        firmware: equipment.firmware || '',
        serialNumber: equipment.serialNumber || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'camera',
        brand: '',
        model: '',
        connectionType: 'usb',
        capabilities: [],
        settings: {},
        firmware: '',
        serialNumber: '',
      });
    }
    clearFormErrors();
  }, [equipment, clearFormErrors]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormError(field, '');
    }
  };

  const addCapability = () => {
    if (newCapability.trim() && !formData.capabilities.includes(newCapability.trim())) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability.trim()]
      }));
      setNewCapability('');
    }
  };

  const removeCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(c => c !== capability)
    }));
  };

  const addSetting = () => {
    if (newSettingKey.trim() && newSettingValue.trim()) {
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [newSettingKey.trim()]: newSettingValue.trim()
        }
      }));
      setNewSettingKey('');
      setNewSettingValue('');
    }
  };

  const removeSetting = (key: string) => {
    setFormData(prev => {
      const newSettings = { ...prev.settings };
      delete newSettings[key];
      return { ...prev, settings: newSettings };
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Equipment name is required';
    }

    if (!formData.brand.trim()) {
      errors.brand = 'Brand is required';
    }

    if (!formData.model.trim()) {
      errors.model = 'Model is required';
    }

    // Set all errors at once
    Object.entries(errors).forEach(([field, error]) => {
      setFormError(field, error);
    });

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && equipment) {
        await updateEquipment(equipment.id, formData);
        onSave?.(equipment);
      } else {
        const newEquipment = await addEquipment(formData);
        onSave?.(newEquipment as Equipment);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save equipment:', error);
    }
  };

  const handleCancel = () => {
    cancelEquipmentForm();
    onClose();
  };

  const equipmentTypes = [
    { value: 'camera', label: 'Camera' },
    { value: 'mount', label: 'Mount' },
    { value: 'filter_wheel', label: 'Filter Wheel' },
    { value: 'focuser', label: 'Focuser' },
    { value: 'guide_scope', label: 'Guide Scope' },
    { value: 'other', label: 'Other' },
  ];

  const connectionTypes = [
    { value: 'usb', label: 'USB' },
    { value: 'wifi', label: 'Wi-Fi' },
    { value: 'bluetooth', label: 'Bluetooth' },
    { value: 'serial', label: 'Serial' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>
            {isEditing ? 'Edit Equipment' : 'Add New Equipment'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Main Camera"
                    className={cn(formErrors.name && "border-red-500")}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Equipment Type *</Label>
                  <Select value={formData.type} onValueChange={(value: Equipment['type']) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="e.g., ZWO, Celestron"
                    className={cn(formErrors.brand && "border-red-500")}
                  />
                  {formErrors.brand && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {formErrors.brand}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="e.g., ASI2600MC Pro"
                    className={cn(formErrors.model && "border-red-500")}
                  />
                  {formErrors.model && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {formErrors.model}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connectionType">Connection Type</Label>
                  <Select value={formData.connectionType} onValueChange={(value: Equipment['connectionType']) => handleInputChange('connectionType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {connectionTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firmware">Firmware Version</Label>
                <Input
                  id="firmware"
                  value={formData.firmware}
                  onChange={(e) => handleInputChange('firmware', e.target.value)}
                  placeholder="e.g., v1.2.3"
                />
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Capabilities</h3>

              <div className="space-y-2">
                <Label>Equipment Capabilities</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCapability}
                    onChange={(e) => setNewCapability(e.target.value)}
                    placeholder="e.g., Cooling, Auto-focus"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
                  />
                  <Button type="button" onClick={addCapability} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.capabilities.map((capability, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {capability}
                        <button
                          type="button"
                          onClick={() => removeCapability(capability)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Settings</h3>

              <div className="space-y-2">
                <Label>Custom Settings</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newSettingKey}
                    onChange={(e) => setNewSettingKey(e.target.value)}
                    placeholder="Setting name"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newSettingValue}
                      onChange={(e) => setNewSettingValue(e.target.value)}
                      placeholder="Setting value"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSetting())}
                    />
                    <Button type="button" onClick={addSetting} size="icon" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {Object.entries(formData.settings).length > 0 && (
                  <div className="space-y-2 mt-4">
                    {Object.entries(formData.settings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex-1">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSetting(key)}
                          className="h-6 w-6"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isEditing ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Equipment' : 'Add Equipment'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
