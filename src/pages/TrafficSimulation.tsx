import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { TrafficScene } from "../components/simulation/TrafficScene";
import { SimulationControls } from "../components/simulation/SimulationControls";
import { MetricsDashboard } from "../components/simulation/MetricsDashboard";
import { ChaosControls } from "../components/simulation/ChaosControls";
import { SimulationProvider } from "../components/simulation/SimulationContext";
import { Card } from "@/components/ui/card";

const TrafficSimulation = () => {
  return (
    <div className="min-h-screen bg-background">
      <SimulationProvider>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <header className="border-b border-border bg-card p-4">
            <h1 className="text-2xl font-bold text-foreground">
              Smart Traffic Simulator with Chaos Layer
            </h1>
            <p className="text-muted-foreground">
              Interactive 3D traffic simulation with real-time obstruction placement
            </p>
          </header>

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* 3D Scene */}
            <div className="flex-1 relative">
              <Canvas
                camera={{ 
                  position: [0, 150, 200], 
                  fov: 60,
                  near: 1,
                  far: 2000
                }}
                shadows
              >
                <Suspense fallback={null}>
                  <TrafficScene />
                  <OrbitControls 
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    maxPolarAngle={Math.PI / 2.1}
                    minDistance={50}
                    maxDistance={500}
                  />
                </Suspense>
              </Canvas>

              {/* Overlay controls */}
              <div className="absolute top-4 left-4">
                <ChaosControls />
              </div>
            </div>

            {/* Right panel */}
            <div className="w-80 bg-card border-l border-border flex flex-col">
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
      </SimulationProvider>
    </div>
  );
};

export default TrafficSimulation;