import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { TrafficScene } from "../components/simulation/TrafficScene";
import { SimulationControls } from "../components/simulation/SimulationControls";
import { MetricsDashboard } from "../components/simulation/MetricsDashboard";
import { ChaosControls } from "../components/simulation/ChaosControls";
import { DemoModeControls } from "../components/simulation/DemoModeControls";
import { EnhancedSimulationProvider, useEnhancedSimulation } from "../components/simulation/EnhancedSimulationContext";
import { Card } from "@/components/ui/card";
import React from 'react';

// Enhanced camera component with smooth transitions
const EnhancedCamera = () => {
  const { cameraPreset } = useEnhancedSimulation();
  const cameraRef = useRef();
  const controlsRef = useRef();
  
  // Camera preset positions with proper typing
  const cameraPositions = {
    orbit: { position: [0, 150, 200] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
    'top-down': { position: [0, 300, 0] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
    approach: { position: [0, 50, 250] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
    judge: { position: [-100, 80, 150] as [number, number, number], target: [0, 0, 0] as [number, number, number] }
  };
  
  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={cameraPositions[cameraPreset].position}
        fov={60}
        near={1}
        far={2000}
      />
      <OrbitControls
        ref={controlsRef}
        target={cameraPositions[cameraPreset].target}
        enablePan={true}
        enableZoom={true}
        enableRotate={cameraPreset === 'orbit'}
        maxPolarAngle={cameraPreset === 'top-down' ? 0 : Math.PI / 2.1}
        minDistance={30}
        maxDistance={500}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
};

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
              <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
                <Suspense fallback={null}>
                  <TrafficScene />
                  <EnhancedCamera />
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
