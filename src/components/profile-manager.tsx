"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Save,
  Upload,
  Download,
  Trash2,
  Edit,
  Camera,
  Compass,
  Filter,
  Focus,
  Settings,
} from "lucide-react";

interface EquipmentProfile {
  id: string;
  name: string;
  description: string;
  camera: {
    model: string;
    pixelSize: number;
    gain: number;
    offset: number;
    coolingTarget: number;
  };
  mount: {
    model: string;
    trackingRate: string;
    guidingSettings: Record<string, unknown>;
  };
  filterWheel: {
    model: string;
    filters: Array<{ position: number; name: string; type: string }>;
  };
  focuser: {
    model: string;
    stepSize: number;
    backlash: number;
  };
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
  };
  createdAt: Date;
  lastUsed: Date;
}

export default function ProfileManager() {
  const [profiles, setProfiles] = useState<EquipmentProfile[]>([
    {
      id: "1",
      name: "Home Observatory",
      description: "Main setup with cooled camera and EQ mount",
      camera: {
        model: "ZWO ASI2600MC Pro",
        pixelSize: 3.76,
        gain: 100,
        offset: 10,
        coolingTarget: -10,
      },
      mount: {
        model: "Sky-Watcher EQ6-R Pro",
        trackingRate: "Sidereal",
        guidingSettings: {},
      },
      filterWheel: {
        model: 'ZWO EFW 8x1.25"',
        filters: [
          { position: 1, name: "Luminance", type: "L" },
          { position: 2, name: "Red", type: "R" },
          { position: 3, name: "Green", type: "G" },
          { position: 4, name: "Blue", type: "B" },
          { position: 5, name: "Ha", type: "Ha" },
          { position: 6, name: "OIII", type: "OIII" },
          { position: 7, name: "SII", type: "SII" },
        ],
      },
      focuser: {
        model: "ZWO EAF",
        stepSize: 10,
        backlash: 50,
      },
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        elevation: 10,
        timezone: "America/New_York",
      },
      createdAt: new Date("2024-01-15"),
      lastUsed: new Date(),
    },
    {
      id: "2",
      name: "Portable Setup",
      description: "Lightweight travel configuration",
      camera: {
        model: "ZWO ASI533MC Pro",
        pixelSize: 3.76,
        gain: 100,
        offset: 8,
        coolingTarget: -5,
      },
      mount: {
        model: "Sky-Watcher Star Adventurer 2i",
        trackingRate: "Sidereal",
        guidingSettings: {},
      },
      filterWheel: {
        model: "Manual",
        filters: [
          { position: 1, name: "Clear", type: "Clear" },
          { position: 2, name: "Light Pollution", type: "LP" },
        ],
      },
      focuser: {
        model: "Manual",
        stepSize: 1,
        backlash: 0,
      },
      location: {
        latitude: 35.6762,
        longitude: 139.6503,
        elevation: 40,
        timezone: "Asia/Tokyo",
      },
      createdAt: new Date("2024-02-01"),
      lastUsed: new Date("2024-02-15"),
    },
  ]);

  const [activeProfile, setActiveProfile] = useState<EquipmentProfile>(
    profiles[0]
  );
  const [editingProfile, setEditingProfile] = useState<EquipmentProfile | null>(
    null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleSaveProfile = () => {
    if (editingProfile) {
      if (isCreatingNew) {
        const newProfile = {
          ...editingProfile,
          id: Date.now().toString(),
          createdAt: new Date(),
          lastUsed: new Date(),
        };
        setProfiles([...profiles, newProfile]);
        setActiveProfile(newProfile);
      } else {
        setProfiles(
          profiles.map((p) => (p.id === editingProfile.id ? editingProfile : p))
        );
        if (activeProfile.id === editingProfile.id) {
          setActiveProfile(editingProfile);
        }
      }
      setEditingProfile(null);
      setIsCreatingNew(false);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfiles(profiles.filter((p) => p.id !== profileId));
    if (activeProfile.id === profileId && profiles.length > 1) {
      setActiveProfile(profiles.find((p) => p.id !== profileId)!);
    }
  };

  const handleLoadProfile = (profile: EquipmentProfile) => {
    setActiveProfile(profile);
    setProfiles(
      profiles.map((p) =>
        p.id === profile.id ? { ...p, lastUsed: new Date() } : p
      )
    );
  };

  const handleCreateNew = () => {
    const newProfile: EquipmentProfile = {
      id: "",
      name: "New Profile",
      description: "",
      camera: {
        model: "",
        pixelSize: 3.76,
        gain: 100,
        offset: 10,
        coolingTarget: -10,
      },
      mount: {
        model: "",
        trackingRate: "Sidereal",
        guidingSettings: {},
      },
      filterWheel: {
        model: "",
        filters: [],
      },
      focuser: {
        model: "",
        stepSize: 10,
        backlash: 0,
      },
      location: {
        latitude: 0,
        longitude: 0,
        elevation: 0,
        timezone: "UTC",
      },
      createdAt: new Date(),
      lastUsed: new Date(),
    };
    setEditingProfile(newProfile);
    setIsCreatingNew(true);
  };

  return (
    <div className="space-y-4">
      {/* Active Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Active Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{activeProfile.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {activeProfile.description}
                </p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span className="font-medium">Camera:</span>
                  <span className="text-sm">{activeProfile.camera.model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  <span className="font-medium">Mount:</span>
                  <span className="text-sm">{activeProfile.mount.model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">Filter Wheel:</span>
                  <span className="text-sm">
                    {activeProfile.filterWheel.model}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Focus className="h-4 w-4" />
                  <span className="font-medium">Focuser:</span>
                  <span className="text-sm">{activeProfile.focuser.model}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Location:</span>
                  <div className="text-sm text-muted-foreground">
                    {activeProfile.location.latitude.toFixed(4)}°,{" "}
                    {activeProfile.location.longitude.toFixed(4)}°
                  </div>
                </div>
                <div>
                  <span className="font-medium">Elevation:</span>
                  <span className="text-sm ml-2">
                    {activeProfile.location.elevation}m
                  </span>
                </div>
                <div>
                  <span className="font-medium">Timezone:</span>
                  <span className="text-sm ml-2">
                    {activeProfile.location.timezone}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Last Used:</span>
                  <span className="text-sm ml-2">
                    {activeProfile.lastUsed.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setEditingProfile(activeProfile)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Profile Library
            </span>
            <div className="flex gap-2">
              <Button onClick={handleCreateNew} size="sm" variant="outline">
                <User className="h-4 w-4 mr-2" />
                New Profile
              </Button>
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`p-4 rounded-lg border ${
                  activeProfile.id === profile.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{profile.name}</h4>
                      {activeProfile.id === profile.id && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {profile.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        Created: {profile.createdAt.toLocaleDateString()}
                      </span>
                      <span>
                        Last used: {profile.lastUsed.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLoadProfile(profile)}
                      disabled={activeProfile.id === profile.id}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingProfile(profile)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProfile(profile.id)}
                      disabled={profiles.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profile Editor */}
      {editingProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {isCreatingNew ? "Create New Profile" : "Edit Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Basic Information</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Profile Name</Label>
                  <Input
                    id="profile-name"
                    value={editingProfile.name}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-description">Description</Label>
                  <Input
                    id="profile-description"
                    value={editingProfile.description}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Camera Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Camera Settings
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Camera Model</Label>
                  <Input
                    value={editingProfile.camera.model}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        camera: {
                          ...editingProfile.camera,
                          model: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pixel Size (μm)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProfile.camera.pixelSize}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        camera: {
                          ...editingProfile.camera,
                          pixelSize: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Gain</Label>
                  <Input
                    type="number"
                    value={editingProfile.camera.gain}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        camera: {
                          ...editingProfile.camera,
                          gain: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Location Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Location Settings</h4>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={editingProfile.location.latitude}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        location: {
                          ...editingProfile.location,
                          latitude: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={editingProfile.location.longitude}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        location: {
                          ...editingProfile.location,
                          longitude: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Elevation (m)</Label>
                  <Input
                    type="number"
                    value={editingProfile.location.elevation}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        location: {
                          ...editingProfile.location,
                          elevation: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={editingProfile.location.timezone}
                    onValueChange={(value) =>
                      setEditingProfile({
                        ...editingProfile,
                        location: {
                          ...editingProfile.location,
                          timezone: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                      <SelectItem value="Europe/London">GMT</SelectItem>
                      <SelectItem value="Europe/Paris">CET</SelectItem>
                      <SelectItem value="Asia/Tokyo">JST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveProfile}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isCreatingNew ? "Create Profile" : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingProfile(null);
                  setIsCreatingNew(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
