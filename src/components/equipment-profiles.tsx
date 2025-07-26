"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';
import {
  Camera,
  Save,
  Plus,
  Trash2,
  Copy,
  Star,
  Settings,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface EquipmentProfile {
  id: string;
  name: string;
  description: string;
  created: Date;
  lastUsed: Date;
  isDefault: boolean;
  equipment: {
    camera: {
      model: string;
      pixelSize: number;
      sensorWidth: number;
      sensorHeight: number;
      coolingCapable: boolean;
      defaultTemp: number;
      defaultGain: number;
      defaultOffset: number;
    };
    telescope: {
      model: string;
      focalLength: number;
      aperture: number;
      focalRatio: number;
      type: 'refractor' | 'reflector' | 'cassegrain' | 'schmidt-cassegrain';
    };
    mount: {
      model: string;
      type: 'alt-az' | 'equatorial' | 'fork';
      maxPayload: number;
      trackingAccuracy: number;
      gotoAccuracy: number;
    };
    filterWheel?: {
      model: string;
      positions: number;
      filters: Array<{
        position: number;
        name: string;
        type: string;
        exposureMultiplier: number;
      }>;
    };
    focuser?: {
      model: string;
      stepsPerMm: number;
      maxSteps: number;
      backlash: number;
    };
  };
  settings: {
    defaultExposure: number;
    defaultBinning: string;
    autoFocusInterval: number;
    ditherFrequency: number;
    platesolveEnabled: boolean;
    guidingEnabled: boolean;
  };
}

interface EquipmentProfilesProps {
  onProfileSelect?: (profile: EquipmentProfile) => void;
}

export function EquipmentProfiles({ onProfileSelect }: EquipmentProfilesProps) {
  const [profiles, setProfiles] = useState<EquipmentProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<EquipmentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<EquipmentProfile>>({});

  // Load profiles from localStorage
  useEffect(() => {
    const savedProfiles = localStorage.getItem('equipment-profiles');
    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      setProfiles(parsed.map((p: EquipmentProfile & { created: string; lastUsed: string }) => ({
        ...p,
        created: new Date(p.created),
        lastUsed: new Date(p.lastUsed),
      })));
    } else {
      // Create default profile
      const defaultProfile = createDefaultProfile();
      setProfiles([defaultProfile]);
      setSelectedProfile(defaultProfile);
    }
  }, []);

  // Save profiles to localStorage
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem('equipment-profiles', JSON.stringify(profiles));
    }
  }, [profiles]);

  const createDefaultProfile = (): EquipmentProfile => ({
    id: 'default',
    name: 'Default Setup',
    description: 'Default equipment configuration',
    created: new Date(),
    lastUsed: new Date(),
    isDefault: true,
    equipment: {
      camera: {
        model: 'Generic CMOS',
        pixelSize: 3.76,
        sensorWidth: 23.5,
        sensorHeight: 15.7,
        coolingCapable: true,
        defaultTemp: -10,
        defaultGain: 100,
        defaultOffset: 10,
      },
      telescope: {
        model: 'Generic Refractor',
        focalLength: 600,
        aperture: 80,
        focalRatio: 7.5,
        type: 'refractor',
      },
      mount: {
        model: 'Generic EQ Mount',
        type: 'equatorial',
        maxPayload: 10,
        trackingAccuracy: 1.0,
        gotoAccuracy: 30,
      },
      filterWheel: {
        model: 'Generic 5-position',
        positions: 5,
        filters: [
          { position: 1, name: 'Luminance', type: 'L', exposureMultiplier: 1.0 },
          { position: 2, name: 'Red', type: 'R', exposureMultiplier: 1.2 },
          { position: 3, name: 'Green', type: 'G', exposureMultiplier: 1.0 },
          { position: 4, name: 'Blue', type: 'B', exposureMultiplier: 1.5 },
          { position: 5, name: 'Ha', type: 'Ha', exposureMultiplier: 3.0 },
        ],
      },
      focuser: {
        model: 'Generic Focuser',
        stepsPerMm: 1000,
        maxSteps: 50000,
        backlash: 50,
      },
    },
    settings: {
      defaultExposure: 300,
      defaultBinning: '1x1',
      autoFocusInterval: 10,
      ditherFrequency: 5,
      platesolveEnabled: true,
      guidingEnabled: true,
    },
  });

  const handleCreateProfile = () => {
    const newProfile: EquipmentProfile = {
      ...createDefaultProfile(),
      id: `profile-${Date.now()}`,
      name: 'New Profile',
      description: 'Custom equipment setup',
      isDefault: false,
    };
    setEditingProfile(newProfile);
    setIsEditing(true);
  };

  const handleEditProfile = (profile: EquipmentProfile) => {
    setEditingProfile({ ...profile });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    if (!editingProfile.name || !editingProfile.equipment) return;

    const profileToSave = {
      ...editingProfile,
      lastUsed: new Date(),
    } as EquipmentProfile;

    if (editingProfile.id && profiles.find(p => p.id === editingProfile.id)) {
      // Update existing profile
      setProfiles(profiles.map(p => p.id === editingProfile.id ? profileToSave : p));
    } else {
      // Create new profile
      profileToSave.id = `profile-${Date.now()}`;
      profileToSave.created = new Date();
      setProfiles([...profiles, profileToSave]);
    }

    setIsEditing(false);
    setEditingProfile({});
  };

  const handleDeleteProfile = (profileId: string) => {
    if (profiles.find(p => p.id === profileId)?.isDefault) return;
    setProfiles(profiles.filter(p => p.id !== profileId));
    if (selectedProfile?.id === profileId) {
      setSelectedProfile(profiles.find(p => p.isDefault) || profiles[0]);
    }
  };

  const handleDuplicateProfile = (profile: EquipmentProfile) => {
    const duplicated: EquipmentProfile = {
      ...profile,
      id: `profile-${Date.now()}`,
      name: `${profile.name} (Copy)`,
      created: new Date(),
      lastUsed: new Date(),
      isDefault: false,
    };
    setProfiles([...profiles, duplicated]);
  };

  const handleSelectProfile = (profile: EquipmentProfile) => {
    setSelectedProfile(profile);
    const updatedProfile = { ...profile, lastUsed: new Date() };
    setProfiles(profiles.map(p => p.id === profile.id ? updatedProfile : p));
    onProfileSelect?.(updatedProfile);
  };

  const calculateImageScale = (profile: EquipmentProfile) => {
    const { camera, telescope } = profile.equipment;
    return (camera.pixelSize / telescope.focalLength) * 206.265; // arcsec/pixel
  };

  const calculateFieldOfView = (profile: EquipmentProfile) => {
    const { camera } = profile.equipment;
    const imageScale = calculateImageScale(profile);
    const fovWidth = (camera.sensorWidth / camera.pixelSize) * imageScale / 60; // arcmin
    const fovHeight = (camera.sensorHeight / camera.pixelSize) * imageScale / 60; // arcmin
    return { width: fovWidth, height: fovHeight };
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {editingProfile.id ? 'Edit Profile' : 'Create Profile'}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-name">Profile Name</Label>
                <Input
                  id="profile-name"
                  value={editingProfile.name || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  placeholder="Enter profile name"
                />
              </div>
              <div>
                <Label htmlFor="profile-description">Description</Label>
                <Input
                  id="profile-description"
                  value={editingProfile.description || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment configuration tabs would go here */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Equipment configuration editor would be implemented here with tabs for Camera, Telescope, Mount, etc.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Equipment Profiles</h2>
        <Button onClick={handleCreateProfile}>
          <Plus className="h-4 w-4 mr-2" />
          New Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Profiles</h3>
          <div className="space-y-2">
            {profiles.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all",
                  selectedProfile?.id === profile.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => handleSelectProfile(profile)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{profile.name}</h4>
                      {profile.isDefault && (
                        <Badge variant="secondary">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      {selectedProfile?.id === profile.id && (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Last used: {profile.lastUsed.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProfile(profile);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateProfile(profile);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!profile.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(profile.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Profile Details */}
        {selectedProfile && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile Details</h3>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  {selectedProfile.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Image Scale:</span>
                    <br />
                    {calculateImageScale(selectedProfile).toFixed(2)}&quot;/pixel
                  </div>
                  <div>
                    <span className="font-medium">Field of View:</span>
                    <br />
                    {calculateFieldOfView(selectedProfile).width.toFixed(1)}&apos; × {calculateFieldOfView(selectedProfile).height.toFixed(1)}&apos;
                  </div>
                  <div>
                    <span className="font-medium">Focal Ratio:</span>
                    <br />
                    f/{selectedProfile.equipment.telescope.focalRatio}
                  </div>
                  <div>
                    <span className="font-medium">Sensor:</span>
                    <br />
                    {selectedProfile.equipment.camera.sensorWidth} × {selectedProfile.equipment.camera.sensorHeight}mm
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Equipment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Camera:</span>
                      <span>{selectedProfile.equipment.camera.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Telescope:</span>
                      <span>{selectedProfile.equipment.telescope.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mount:</span>
                      <span>{selectedProfile.equipment.mount.model}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default EquipmentProfiles;
