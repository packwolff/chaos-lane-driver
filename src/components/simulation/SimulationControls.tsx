import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useEnhancedSimulation } from "./EnhancedSimulationContext";
import { Play, Pause, Square, RotateCcw, Download, Zap, RotateCw, Camera } from "lucide-react";
import { CameraControls } from "./CameraControls";

export const SimulationControls = () => {
  const {
    isRunning,
    isPaused,
    speed,
    isRoundabout,
    cameraPreset,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    setSimulationSpeed,
    resetToBaseline,
    optimizeSignals,
    exportMetrics,
    toggleRoundabout,
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
            variant={isPaused ? "default" : "secondary"}
            size="sm"
            onClick={pauseSimulation}
            disabled={!isRunning}
          >
            <Pause className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={stopSimulation}
            disabled={!isRunning}
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>

        {/* Speed control */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Speed: {speed}x
          </label>
          <Slider
            value={[speed]}
            onValueChange={(value) => setSimulationSpeed(value[0])}
            min={0.25}
            max={4}
            step={0.25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.25x</span>
            <span>1x</span>
            <span>4x</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Button
            variant={isRoundabout ? "default" : "outline"}
            size="sm"
            onClick={toggleRoundabout}
            className="w-full"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            {isRoundabout ? "Disable" : "Enable"} Roundabout
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetToBaseline}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Baseline
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={optimizeSignals}
            className="w-full"
            disabled={isRoundabout}
          >
            <Zap className="w-4 h-4 mr-2" />
            Optimize Signals
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
            {!isRunning ? "Stopped" : isPaused ? "Paused" : "Running"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};