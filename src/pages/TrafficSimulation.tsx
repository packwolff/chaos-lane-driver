import { Suspense } from "react";
import React from 'react';
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

// Traffic simulation components
import { TrafficScene } from "../components/simulation/TrafficScene";
import { SimulationControls } from "../components/simulation/SimulationControls";
import { MetricsDashboard } from "../components/simulation/MetricsDashboard";
import { ChaosControls } from "../components/simulation/ChaosControls";
import { DemoModeControls } from "../components/simulation/DemoModeControls";
import { EnhancedSimulationProvider } from "../components/simulation/EnhancedSimulationContext";
import { Card } from "@/components/ui/card";

const TrafficSimulation = () => {

  return (
    <div className="min-h-screen bg-background">
      <EnhancedSimulationProvider>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <header className="border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Smart Traffic Simulator with Chaos Layer
                </h1>
                <p className="text-muted-foreground">
                  Interactive 3D traffic simulation with real-time obstruction placement
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Production Demo v1.0
              </div>
            </div>
          </header>

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* 3D Scene */}
            <div className="flex-1 relative bg-gradient-to-b from-sky-100 to-green-50 dark:from-gray-800 dark:to-gray-900">
              <Canvas 
                shadows 
                camera={{ 
                  position: [100, 80, 100], 
                  fov: 45,
                  near: 0.1,
                  far: 2000
                }}
                className="w-full h-full"
              >
                <Suspense fallback={null}>
                  <OrbitControls 
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    maxDistance={300}
                    minDistance={20}
                    maxPolarAngle={Math.PI * 0.45}
                  />
                  <TrafficScene />
                </Suspense>
              </Canvas>

              {/* Overlay controls */}
              <div className="absolute top-4 left-4 z-10 space-y-4">
                <DemoModeControls />
                <ChaosControls />
              </div>

              {/* Loading overlay */}
              <div className="absolute bottom-4 right-4 z-10">
                <Card className="p-2 bg-background/80 backdrop-blur-sm border border-border/50">
                  <div className="text-xs text-muted-foreground">
                    Use mouse to orbit • Scroll to zoom
                  </div>
                </Card>
              </div>
            </div>

            {/* Right panel */}
            <div className="w-80 bg-card border-l border-border flex flex-col shadow-lg">
              {/* Simulation controls */}
              <div className="p-4 border-b border-border">
                <SimulationControls />
              </div>

              {/* Metrics dashboard */}
              <div className="flex-1 overflow-auto">
                <MetricsDashboard />
              </div>
            </div>
          </div>
        </div>
      </EnhancedSimulationProvider>
    </div>
  );
};

export default TrafficSimulation;
