import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { Vector3 } from "three";

// Enhanced Vehicle types
export type VehicleType = "car" | "bus" | "truck";

// Enhanced Vehicle interface with better physics
export interface Vehicle {
  id: string;
  type: VehicleType;
  position: Vector3;
  velocity: Vector3;
  rotation: number;
  targetRotation: number;
  speed: number;
  targetSpeed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  lane: number;
  targetLane: number;
  direction: "north" | "south" | "east" | "west";
  targetDirection: "straight" | "left" | "right";
  path: Vector3[];
  pathIndex: number;
  isWaiting: boolean;
  waitTime: number;
  co2Emitted: number;
  laneChangeTimer: number;
  isChangingLanes: boolean;
  safetyDistance: number;
  isApproachingIntersection: boolean;
}

// Obstruction types
export type ObstructionType = "pothole" | "barricade" | "vendor";

export interface Obstruction {
  id: string;
  type: ObstructionType;
  position: Vector3;
  size: Vector3;
  lane: number;
  direction: "north" | "south" | "east" | "west";
  effect: {
    speedReduction: number;
    capacityReduction: number;
    blocked: boolean;
  };
}

// Traffic signal state
export interface TrafficSignalState {
  northSouth: "green" | "yellow" | "red";
  eastWest: "green" | "yellow" | "red";
  timeRemaining: number;
  cycle: number;
}

// Simulation metrics
export interface SimulationMetrics {
  totalVehicles: number;
  activeVehicles: number;
  averageWaitTime: number;
  averageSpeed: number;
  co2Emissions: number;
  congestionLevel: number;
  throughput: number;
}

// Camera presets
export type CameraPreset = 'orbit' | 'top-down' | 'approach' | 'judge';

// Context interface with demo mode
export interface EnhancedSimulationContextType {
  // Vehicle management
  vehicles: Vehicle[];
  obstructions: Obstruction[];
  metrics: SimulationMetrics;
  trafficSignal: TrafficSignalState;
  
  // Controls
  isRunning: boolean;
  selectedTool: ObstructionType | null;
  isPlacingObstruction: boolean;
  cameraPreset: CameraPreset;
  
  // Demo mode
  isDemoMode: boolean;
  currentScenario: string | null;
  
  // Actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  selectTool: (tool: ObstructionType | null) => void;
  placeObstruction: (position: Vector3, type: ObstructionType) => void;
  removeObstruction: (id: string) => void;
  clearAllObstructions: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  exportMetrics: () => void;
  baselineMetrics: SimulationMetrics;
  
  // Demo actions
  startDemo: (scenario: string) => void;
  stopDemo: () => void;
}

const EnhancedSimulationContext = createContext<EnhancedSimulationContextType | null>(null);

export const useEnhancedSimulation = () => {
  const context = useContext(EnhancedSimulationContext);
  if (!context) {
    throw new Error("useEnhancedSimulation must be used within EnhancedSimulationProvider");
  }
  return context;
};

// Vehicle physics constants
const PHYSICS_CONFIG = {
  CAR: { maxSpeed: 13.9, accel: 2.5, decel: 4.5, length: 4, width: 2 },
  BUS: { maxSpeed: 11.1, accel: 1.8, decel: 3.5, length: 12, width: 2.5 },
  TRUCK: { maxSpeed: 10.0, accel: 2.0, decel: 4.0, length: 8, width: 2.5 }
};

export const EnhancedSimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core state
  const [isRunning, setIsRunning] = useState(true);
  const [selectedTool, setSelectedTool] = useState<ObstructionType | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('orbit');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  
  // Simulation state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  
  const [trafficSignal, setTrafficSignal] = useState<TrafficSignalState>({
    northSouth: "green",
    eastWest: "red",
    timeRemaining: 30,
    cycle: 0
  });

  const [metrics, setMetrics] = useState<SimulationMetrics>({
    totalVehicles: 0,
    activeVehicles: 0,
    averageSpeed: 15,
    averageWaitTime: 8,
    congestionLevel: 20,
    co2Emissions: 0.5,
    throughput: 100
  });

  const [baselineMetrics] = useState<SimulationMetrics>({
    totalVehicles: 0,
    activeVehicles: 0,
    averageSpeed: 15,
    averageWaitTime: 8,
    congestionLevel: 20,
    co2Emissions: 0.5,
    throughput: 100
  });

  // Refs for tracking
  const vehicleIdCounter = useRef(0);
  const obstructionIdCounter = useRef(0);
  const lastSpawnTime = useRef(0);
  const lastUpdateTime = useRef(0);

  // Generate vehicle path
  const generateVehiclePath = useCallback((
    direction: Vehicle["direction"], 
    targetDirection: Vehicle["targetDirection"]
  ): Vector3[] => {
    const path: Vector3[] = [];
    const roadLength = 500;
    const laneWidth = 3.25;
    const intersectionSize = 30;
    
    switch (direction) {
      case "north":
        path.push(new Vector3(-laneWidth, 0, roadLength / 2));
        path.push(new Vector3(-laneWidth, 0, intersectionSize / 2));
        
        if (targetDirection === "straight") {
          path.push(new Vector3(-laneWidth, 0, -intersectionSize / 2));
          path.push(new Vector3(-laneWidth, 0, -roadLength / 2));
        } else if (targetDirection === "right") {
          path.push(new Vector3(-laneWidth, 0, 0));
          path.push(new Vector3(-intersectionSize / 2, 0, laneWidth));
          path.push(new Vector3(-roadLength / 2, 0, laneWidth));
        } else if (targetDirection === "left") {
          path.push(new Vector3(-laneWidth, 0, 0));
          path.push(new Vector3(intersectionSize / 2, 0, -laneWidth));
          path.push(new Vector3(roadLength / 2, 0, -laneWidth));
        }
        break;

      case "south":
        path.push(new Vector3(laneWidth, 0, -roadLength / 2));  
        path.push(new Vector3(laneWidth, 0, -intersectionSize / 2));
        
        if (targetDirection === "straight") {
          path.push(new Vector3(laneWidth, 0, intersectionSize / 2));
          path.push(new Vector3(laneWidth, 0, roadLength / 2));
        } else if (targetDirection === "right") {
          path.push(new Vector3(laneWidth, 0, 0));
          path.push(new Vector3(intersectionSize / 2, 0, -laneWidth));
          path.push(new Vector3(roadLength / 2, 0, -laneWidth));
        } else if (targetDirection === "left") {
          path.push(new Vector3(laneWidth, 0, 0));
          path.push(new Vector3(-intersectionSize / 2, 0, laneWidth));
          path.push(new Vector3(-roadLength / 2, 0, laneWidth));
        }
        break;

      case "east":
        path.push(new Vector3(roadLength / 2, 0, laneWidth));
        path.push(new Vector3(intersectionSize / 2, 0, laneWidth));
        
        if (targetDirection === "straight") {
          path.push(new Vector3(-intersectionSize / 2, 0, laneWidth));
          path.push(new Vector3(-roadLength / 2, 0, laneWidth));
        } else if (targetDirection === "right") {
          path.push(new Vector3(0, 0, laneWidth));
          path.push(new Vector3(-laneWidth, 0, intersectionSize / 2));
          path.push(new Vector3(-laneWidth, 0, roadLength / 2));
        } else if (targetDirection === "left") {
          path.push(new Vector3(0, 0, laneWidth));
          path.push(new Vector3(laneWidth, 0, -intersectionSize / 2));
          path.push(new Vector3(laneWidth, 0, -roadLength / 2));
        }
        break;

      case "west":
        path.push(new Vector3(-roadLength / 2, 0, -laneWidth));
        path.push(new Vector3(-intersectionSize / 2, 0, -laneWidth));
        
        if (targetDirection === "straight") {
          path.push(new Vector3(intersectionSize / 2, 0, -laneWidth));
          path.push(new Vector3(roadLength / 2, 0, -laneWidth));
        } else if (targetDirection === "right") {
          path.push(new Vector3(0, 0, -laneWidth));
          path.push(new Vector3(laneWidth, 0, -intersectionSize / 2));
          path.push(new Vector3(laneWidth, 0, -roadLength / 2));
        } else if (targetDirection === "left") {
          path.push(new Vector3(0, 0, -laneWidth));
          path.push(new Vector3(-laneWidth, 0, intersectionSize / 2));
          path.push(new Vector3(-laneWidth, 0, roadLength / 2));
        }
        break;
    }

    return path;
  }, []);

  // Spawn vehicle
  const spawnVehicle = useCallback(() => {
    const directions: Vehicle["direction"][] = ["north", "south", "east", "west"];
    const targetDirections: Vehicle["targetDirection"][] = ["straight", "straight", "straight", "left", "right"];
    
    const direction = directions[Math.floor(Math.random() * 4)];
    const targetDirection = targetDirections[Math.floor(Math.random() * targetDirections.length)];
    
    const rand = Math.random();
    const type: VehicleType = rand < 0.8 ? "car" : rand < 0.92 ? "bus" : "truck";
    
    const path = generateVehiclePath(direction, targetDirection);
    if (path.length === 0) return;

    const config = PHYSICS_CONFIG[type.toUpperCase() as keyof typeof PHYSICS_CONFIG];
    
    const vehicle: Vehicle = {
      id: `vehicle-${vehicleIdCounter.current++}`,
      type,
      position: path[0].clone(),
      velocity: new Vector3(0, 0, 0),
      rotation: direction === "north" ? Math.PI : direction === "south" ? 0 : 
                direction === "east" ? -Math.PI / 2 : Math.PI / 2,
      targetRotation: 0,
      speed: 0,
      targetSpeed: config.maxSpeed,
      maxSpeed: config.maxSpeed,
      acceleration: config.accel,
      deceleration: config.decel,
      lane: 1,
      targetLane: 1,
      direction,
      targetDirection,
      path,
      pathIndex: 0,
      isWaiting: false,
      waitTime: 0,
      co2Emitted: 0,
      laneChangeTimer: 0,
      isChangingLanes: false,
      safetyDistance: Math.max(2.0, config.length * 0.8),
      isApproachingIntersection: false
    };

    setVehicles(prev => [...prev, vehicle]);
    setMetrics(prev => ({ ...prev, totalVehicles: prev.totalVehicles + 1 }));
  }, [generateVehiclePath]);

  // Update vehicle physics
  const updateVehicle = useCallback((vehicle: Vehicle, deltaTime: number): Vehicle => {
    const { position, speed, pathIndex, path, maxSpeed } = vehicle;
    
    if (pathIndex >= path.length - 1) return vehicle;

    const target = path[pathIndex + 1];
    const direction = target.clone().sub(position).normalize();
    const distance = position.distanceTo(target);

    // Apply obstruction effects
    let speedMultiplier = 1.0;
    let isBlocked = false;
    
    obstructions.forEach(obs => {
      const dist = position.distanceTo(obs.position);
      if (dist < obs.size.x) {
        if (obs.effect.blocked) {
          isBlocked = true;
        } else {
          speedMultiplier *= (1 - obs.effect.speedReduction);
        }
      }
    });

    const targetSpeed = isBlocked ? 0 : maxSpeed * speedMultiplier;
    const newSpeed = speed + (targetSpeed - speed) * deltaTime * 2;
    
    const movement = direction.multiplyScalar(newSpeed * deltaTime);
    const newPosition = position.clone().add(movement);

    let newPathIndex = pathIndex;
    if (distance < 5) {
      newPathIndex = Math.min(pathIndex + 1, path.length - 1);
    }

    return {
      ...vehicle,
      position: newPosition,
      speed: newSpeed,
      pathIndex: newPathIndex,
      waitTime: isBlocked ? vehicle.waitTime + deltaTime : 0,
      co2Emitted: vehicle.co2Emitted + newSpeed * deltaTime * 0.001
    };
  }, [obstructions]);

  // Main simulation loop
  const updateSimulation = useCallback(() => {
    if (!isRunning) return;

    const now = Date.now();
    const deltaTime = (now - lastUpdateTime.current) / 1000;
    lastUpdateTime.current = now;

    // Spawn vehicles
    if (now - lastSpawnTime.current > (isDemoMode ? 1000 : 3000)) {
      spawnVehicle();
      lastSpawnTime.current = now;
    }

    // Update vehicles
    setVehicles(prev => {
      const updated = prev.map(vehicle => updateVehicle(vehicle, deltaTime));
      // Remove vehicles that completed their path
      return updated.filter(vehicle => vehicle.pathIndex < vehicle.path.length - 1);
    });

    // Update traffic signals
    setTrafficSignal(prev => {
      if (prev.timeRemaining <= 0) {
        const newCycle = (prev.cycle + 1) % 4;
        return {
          northSouth: newCycle < 2 ? "green" : "red",
          eastWest: newCycle >= 2 ? "green" : "red",
          timeRemaining: 30,
          cycle: newCycle
        };
      }
      return { ...prev, timeRemaining: prev.timeRemaining - deltaTime };
    });

    // Update metrics
    setMetrics(prev => {
      const activeVehicles = vehicles.length;
      const avgSpeed = activeVehicles > 0 ? 
        vehicles.reduce((sum, v) => sum + v.speed, 0) / activeVehicles : 0;
      const avgWaitTime = activeVehicles > 0 ?
        vehicles.reduce((sum, v) => sum + v.waitTime, 0) / activeVehicles : 0;
      const congestion = Math.min(100, (activeVehicles / 20) * 100);

      return {
        ...prev,
        activeVehicles,
        averageSpeed: avgSpeed,
        averageWaitTime: avgWaitTime,
        congestionLevel: congestion,
        co2Emissions: vehicles.reduce((sum, v) => sum + v.co2Emitted, 0)
      };
    });
  }, [isRunning, isDemoMode, spawnVehicle, updateVehicle, vehicles]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      updateSimulation();
      requestAnimationFrame(animate);
    };
    animate();
  }, [updateSimulation]);

  // Actions
  const startSimulation = useCallback(() => setIsRunning(true), []);
  const pauseSimulation = useCallback(() => setIsRunning(false), []);

  const resetSimulation = useCallback(() => {
    setVehicles([]);
    setObstructions([]);
    setIsDemoMode(false);
    setCurrentScenario(null);
    setMetrics({
      totalVehicles: 0,
      activeVehicles: 0,
      averageSpeed: 15,
      averageWaitTime: 8,
      congestionLevel: 20,
      co2Emissions: 0.5,
      throughput: 100
    });
    setTrafficSignal({
      northSouth: "green",
      eastWest: "red",
      timeRemaining: 30,
      cycle: 0
    });
  }, []);

  const selectTool = useCallback((tool: ObstructionType | null) => {
    setSelectedTool(tool);
  }, []);

  const placeObstruction = useCallback((position: Vector3, type: ObstructionType) => {
    const obstruction: Obstruction = {
      id: `obstruction-${obstructionIdCounter.current++}`,
      type,
      position: position.clone(),
      size: new Vector3(10, 2, 10),
      lane: 1,
      direction: "north", // Simplified
      effect: {
        speedReduction: type === "pothole" ? 0.5 : type === "vendor" ? 0.3 : 0,
        capacityReduction: type === "vendor" ? 0.5 : 0,
        blocked: type === "barricade"
      }
    };

    setObstructions(prev => [...prev, obstruction]);
    setSelectedTool(null);
  }, []);

  const removeObstruction = useCallback((id: string) => {
    setObstructions(prev => prev.filter(obs => obs.id !== id));
  }, []);

  const clearAllObstructions = useCallback(() => {
    setObstructions([]);
  }, []);

  const exportMetrics = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      vehicles: vehicles.length,
      obstructions: obstructions.length,
      baseline: baselineMetrics
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-simulation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, vehicles, obstructions, baselineMetrics]);

  // Demo functions
  const startDemo = useCallback((scenario: string) => {
    setIsDemoMode(true);
    setCurrentScenario(scenario);
    resetSimulation();
    
    setTimeout(() => {
      switch (scenario) {
        case "rush_hour":
          // Spawn multiple vehicles quickly
          for (let i = 0; i < 10; i++) {
            setTimeout(() => spawnVehicle(), i * 500);
          }
          break;
        case "emergency_response":
          // Add emergency scenario
          break;
        case "smart_optimization":
          // Optimize signals
          setTrafficSignal(prev => ({ ...prev, timeRemaining: 15 }));
          break;
      }
    }, 100);
  }, [resetSimulation, spawnVehicle]);

  const stopDemo = useCallback(() => {
    setIsDemoMode(false);
    setCurrentScenario(null);
  }, []);

  return (
    <EnhancedSimulationContext.Provider
      value={{
        // State
        vehicles,
        obstructions,
        metrics,
        trafficSignal,
        isRunning,
        selectedTool,
        isPlacingObstruction: selectedTool !== null,
        cameraPreset,
        baselineMetrics,
        isDemoMode,
        currentScenario,
        
        // Actions
        startSimulation,
        pauseSimulation,
        resetSimulation,
        selectTool,
        placeObstruction,
        removeObstruction,
        clearAllObstructions,
        setCameraPreset,
        exportMetrics,
        startDemo,
        stopDemo
      }}
    >
      {children}
    </EnhancedSimulationContext.Provider>
  );
};