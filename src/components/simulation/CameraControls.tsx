import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Eye, Map, Gavel } from "lucide-react";

interface CameraControlsProps {
  currentPreset: 'orbit' | 'top-down' | 'approach' | 'judge';
  onPresetChange: (preset: 'orbit' | 'top-down' | 'approach' | 'judge') => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({ 
  currentPreset, 
  onPresetChange 
}) => {
  const presets = [
    { 
      id: 'orbit' as const, 
      label: 'Orbit View', 
      icon: Camera,
      description: 'Free camera movement'
    },
    { 
      id: 'top-down' as const, 
      label: 'Top Down', 
      icon: Map,
      description: 'Bird\'s eye view'
    },
    { 
      id: 'approach' as const, 
      label: 'Approach View', 
      icon: Eye,
      description: 'North approach focus'
    },
    { 
      id: 'judge' as const, 
      label: 'Judge View', 
      icon: Gavel,
      description: 'Optimal demo angle'
    }
  ];

  return (
    <Card className="w-72">
      <CardHeader>
        <CardTitle className="text-sm text-foreground">Camera Presets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const isActive = currentPreset === preset.id;
            
            return (
              <Button
                key={preset.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onPresetChange(preset.id)}
                className="flex flex-col h-auto p-2"
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-xs">{preset.label}</span>
              </Button>
            );
          })}
        </div>
        
        <div className="text-xs text-muted-foreground text-center mt-2">
          {presets.find(p => p.id === currentPreset)?.description}
        </div>
      </CardContent>
    </Card>
  );
};