import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnhancedSimulation } from "./EnhancedSimulationContext";
import { Play, Pause, RotateCcw, Download, Camera } from "lucide-react";
import { CameraControls } from "./CameraControls";

export const SimulationControls = () => {
  const {
    isRunning,
    cameraPreset,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    exportMetrics,
    setCameraPreset
  } = useEnhancedSimulation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Simulation Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Playback controls */}
        <div className="flex gap-2">
          <Button
            variant={isRunning ? "secondary" : "default"}
            size="sm"
            onClick={startSimulation}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
          <Button
            variant={!isRunning ? "default" : "secondary"}
            size="sm"
            onClick={pauseSimulation}
          >
            <Pause className="w-4 h-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSimulation}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Simulation
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportMetrics}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Metrics
          </Button>
        </div>

        {/* Camera Controls */}
        <div className="pt-4 border-t border-border">
          <CameraControls 
            currentPreset={cameraPreset} 
            onPresetChange={setCameraPreset}
          />
        </div>

        {/* Status indicator */}
        <div className="p-2 rounded bg-muted">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="text-sm font-medium">
            {isRunning ? "Running" : "Paused"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};