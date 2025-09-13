import { Suspense, useRef, useEffect } from "react";
import React from 'react';

// CesiumJS Imports
import { Viewer, SceneMode, createWorldTerrainAsync, Cartesian3, Math as CesiumMath } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Your existing UI and State Management Imports
import { TrafficScene } from "../components/simulation/TrafficScene"; // Note: This is no longer rendered but kept if other logic depends on it.
import { SimulationControls } from "../components/simulation/SimulationControls";
import { MetricsDashboard } from "../components/simulation/MetricsDashboard";
import { ChaosControls } from "../components/simulation/ChaosControls";
import { DemoModeControls } from "../components/simulation/DemoModeControls";
import { EnhancedSimulationProvider } from "../components/simulation/EnhancedSimulationContext";
import { Card } from "@/components/ui/card";

const TrafficSimulation = () => {
  // Create a React ref to attach to the div that will hold the Cesium map
  const cesiumContainer = useRef<HTMLDivElement>(null);

  // useEffect hook runs once after the component's div is rendered to initialize the map
  useEffect(() => {
    const initializeMap = async () => {
      if (cesiumContainer.current) {
        const viewer = new Viewer(cesiumContainer.current, {
          sceneMode: SceneMode.COLUMBUS_VIEW,
          terrainProvider: await createWorldTerrainAsync(),
          // Hide unnecessary UI elements for a cleaner look
          animation: false,
          timeline: false,
          geocoder: false,
          homeButton: false,
          navigationHelpButton: false,
        });

        // Fly the camera to a position overlooking India
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(78.96, 20.59, 1500000), // Lon, Lat, Height
          orientation: {
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(-90.0),
            roll: 0.0,
          },
        });
      }
    };

    initializeMap();
  }, []); // Empty dependency array ensures this runs only once

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
              
              {/* This div is now the container for the CesiumJS Map */}
              <div
                ref={cesiumContainer}
                className="absolute top-0 left-0 w-full h-full"
              />

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
