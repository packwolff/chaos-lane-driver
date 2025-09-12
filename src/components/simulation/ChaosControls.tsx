import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSimulation, ObstructionType } from "./SimulationContext";
import { 
  Construction, 
  Shield, 
  Store, 
  Trash2, 
  Target,
  X
} from "lucide-react";
import { Vector3, Raycaster, Vector2 } from "three";
import { useThree } from "@react-three/fiber";

export const ChaosControls = () => {
  const { 
    selectedTool, 
    obstructions, 
    selectTool, 
    addObstruction, 
    removeObstruction, 
    clearAllObstructions 
  } = useSimulation();

  const [isPlacing, setIsPlacing] = useState(false);
  const { camera, scene } = useThree();
  
  const handleToolSelect = (tool: ObstructionType) => {
    if (selectedTool === tool) {
      selectTool(null);
      setIsPlacing(false);
    } else {
      selectTool(tool);
      setIsPlacing(true);
    }
  };

  const handleSceneClick = (event: any) => {
    if (!selectedTool || !isPlacing) return;

    // Raycast to find click position on road
    const raycaster = new Raycaster();
    const mouse = new Vector2();
    
    // Convert screen coordinates to normalized device coordinates
    const rect = event.target.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersection with ground plane
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      
      // Check if click is on road (within road bounds)
      const isOnRoad = (Math.abs(point.x) < 10 && Math.abs(point.z) < 500) || 
                      (Math.abs(point.z) < 10 && Math.abs(point.x) < 500);
      
      if (!isOnRoad) {
        alert("Invalid placement — must be on road.");
        return;
      }

      // Determine which lane and direction
      let lane = 1;
      let direction: "north" | "south" | "east" | "west";
      
      if (Math.abs(point.x) < 10) {
        // North-South road
        direction = point.z > 0 ? "north" : "south";
        lane = point.x < 0 ? 1 : 2;
      } else {
        // East-West road  
        direction = point.x > 0 ? "east" : "west";
        lane = point.z > 0 ? 1 : 2;
      }

      // Create obstruction based on selected tool
      const baseObstruction = {
        position: new Vector3(point.x, 0.5, point.z),
        lane,
        direction,
      };

      let obstruction;
      
      switch (selectedTool) {
        case "pothole":
          obstruction = {
            ...baseObstruction,
            type: "pothole" as const,
            size: new Vector3(20, 0.2, 5), // 20m long pothole zone
            effect: {
              speedReduction: 0.5, // 50% speed reduction
              capacityReduction: 0,
              blocked: false
            }
          };
          break;
          
        case "barricade":
          obstruction = {
            ...baseObstruction,
            type: "barricade" as const,
            size: new Vector3(2, 1.5, 0.5),
            effect: {
              speedReduction: 0,
              capacityReduction: 0,
              blocked: true // Completely blocks the lane
            }
          };
          break;
          
        case "vendor":
          obstruction = {
            ...baseObstruction,
            type: "vendor" as const,
            size: new Vector3(3, 1, 2),
            effect: {
              speedReduction: 0.3, // 30% speed reduction
              capacityReduction: 0.5, // 50% capacity reduction
              blocked: false
            }
          };
          break;
          
        default:
          return;
      }

      addObstruction(obstruction);
      setIsPlacing(false);
      selectTool(null);
    }
  };

  // Attach click handler to canvas
  useEffect(() => {
    if (isPlacing) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('click', handleSceneClick);
        canvas.style.cursor = 'crosshair';
        
        return () => {
          canvas.removeEventListener('click', handleSceneClick);
          canvas.style.cursor = 'default';
        };
      }
    }
  }, [isPlacing, selectedTool]);

  const getToolIcon = (tool: ObstructionType) => {
    switch (tool) {
      case "pothole": return Construction;
      case "barricade": return Shield;
      case "vendor": return Store;
    }
  };

  const getToolDescription = (tool: ObstructionType) => {
    switch (tool) {
      case "pothole": return "Reduces speed by 50% in 20m zone";
      case "barricade": return "Completely blocks the lane";
      case "vendor": return "Reduces speed 30%, capacity 50%";
    }
  };

  return (
    <Card className="w-72">
      <CardHeader>
        <CardTitle className="text-lg text-foreground flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Chaos Layer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tool selection */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Place Obstructions</h3>
          <div className="grid grid-cols-1 gap-2">
            {(["pothole", "barricade", "vendor"] as ObstructionType[]).map((tool) => {
              const Icon = getToolIcon(tool);
              const isSelected = selectedTool === tool;
              
              return (
                <Button
                  key={tool}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToolSelect(tool)}
                  className="justify-start h-auto p-3"
                >
                  <div className="flex items-start w-full">
                    <Icon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium capitalize">{tool}</div>
                      <div className="text-xs opacity-75">
                        {getToolDescription(tool)}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
          
          {isPlacing && (
            <div className="p-2 bg-primary/10 rounded text-xs text-primary">
              Click on a road lane to place {selectedTool}
            </div>
          )}
        </div>

        {/* Active obstructions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              Active Obstructions ({obstructions.length})
            </h3>
            {obstructions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={clearAllObstructions}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {obstructions.map((obstruction) => {
              const Icon = getToolIcon(obstruction.type);
              
              return (
                <div 
                  key={obstruction.id}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <div className="flex items-center">
                    <Icon className="w-3 h-3 mr-2 text-muted-foreground" />
                    <span className="text-xs capitalize text-foreground">
                      {obstruction.type}
                    </span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {obstruction.direction}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeObstruction(obstruction.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
          
          {obstructions.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              No obstructions placed
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
          <strong>Instructions:</strong>
          <br />• Select a tool above
          <br />• Click on road lanes to place
          <br />• Watch traffic adapt in real-time
          <br />• Check metrics for impact analysis
        </div>
      </CardContent>
    </Card>
  );
};