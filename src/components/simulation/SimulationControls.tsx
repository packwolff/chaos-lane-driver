import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnhancedSimulation } from "./EnhancedSimulationContext";
import { Play, Pause, RotateCcw, Download, Camera, Zap } from "lucide-react";
import { CameraControls } from "./CameraControls";

export const SimulationControls = () => {
  const {
    isRunning,
    cameraPreset,
    simulationMode,
    baselineWaitTime,
    improvedWaitTime,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    exportMetrics,
    setCameraPreset,
    runBaselineSimulation,
    runSolutionSimulation
  } = useEnhancedSimulation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Simulation Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* A/B Testing Controls */}
        <div className="space-y-2">
          <Button
            variant={simulationMode === 'baseline' ? "default" : "outline"}
            size="sm"
            onClick={runBaselineSimulation}
            className="w-full"
            disabled={isRunning}
          >
            <Play className="w-4 h-4 mr-2" />
            Run Baseline Simulation
          </Button>
          
          <Button
            variant={simulationMode === 'solution' ? "default" : "outline"}
            size="sm"
            onClick={runSolutionSimulation}
            className="w-full"
            disabled={isRunning || !baselineWaitTime}
          >
            <Zap className="w-4 h-4 mr-2" />
            Apply 'Smart Signal' & Rerun
          </Button>
        </div>

        {/* Pause/Reset controls */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={pauseSimulation}
            disabled={!isRunning}
            className="flex-1"
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

        {/* A/B Test Results */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="text-sm font-medium text-foreground">
            Performance Comparison
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-xs text-muted-foreground">Baseline Avg. Wait Time:</span>
              <span className="text-sm font-mono font-medium">
                {baselineWaitTime ? `${baselineWaitTime.toFixed(1)}s` : '--s'}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-2 rounded bg-muted/50">
              <span className="text-xs text-muted-foreground">Improved Avg. Wait Time:</span>
              <span className="text-sm font-mono font-medium text-green-600">
                {improvedWaitTime ? `${improvedWaitTime.toFixed(1)}s` : '--s'}
              </span>
            </div>
            
            {baselineWaitTime && improvedWaitTime && (
              <div className="flex justify-between items-center p-2 rounded bg-green-50 dark:bg-green-900/20">
                <span className="text-xs text-green-700 dark:text-green-300">Improvement:</span>
                <span className="text-sm font-mono font-bold text-green-600">
                  {((baselineWaitTime - improvedWaitTime) / baselineWaitTime * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="p-2 rounded bg-muted">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="text-sm font-medium">
            {isRunning ? `Running ${simulationMode === 'baseline' ? 'Baseline' : 'Solution'}` : "Ready"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};