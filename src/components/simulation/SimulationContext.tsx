import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { Vector3 } from "three";

// Vehicle types
export type VehicleType = "car" | "bus" | "truck";

// Vehicle interface
export interface Vehicle {
  id: string;
  type: VehicleType;
  position: Vector3;
  rotation: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  lane: number;
  direction: "north" | "south" | "east" | "west";
  targetDirection: "straight" | "left" | "right";
  path: Vector3[];
  pathIndex: number;
  isWaiting: boolean;
  waitTime: number;
  co2Emitted: number;
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
export interface TrafficSignal {
  northSouth: "green" | "yellow" | "red";
  eastWest: "green" | "yellow" | "red";
  timeRemaining: number;
}

// Simulation metrics
export interface Metrics {
  totalVehicles: number;
  activeVehicles: number;
  averageWaitTime: number;
  averageSpeed: number;
  co2Emissions: number;
  congestionLevel: number;
}

// Simulation context
interface SimulationContextType {
  // State
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
  vehicles: Vehicle[];
  obstructions: Obstruction[];
  trafficSignal: TrafficSignal;
  metrics: Metrics;
  selectedTool: ObstructionType | null;
  isPlacingObstruction: boolean;
  
  // Actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  selectTool: (tool: ObstructionType | null) => void;
  addObstruction: (obstruction: Omit<Obstruction, "id">) => void;
  removeObstruction: (id: string) => void;
  clearAllObstructions: () => void;
  optimizeSignals: () => void;
  exportMetrics: () => void;
  resetToBaseline: () => void;
  placeObstructionAtPosition: (x: number, z: number) => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within SimulationProvider");
  }
  return context;
};

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [selectedTool, setSelectedTool] = useState<ObstructionType | null>(null);
  
  // Traffic signal state
  const [trafficSignal, setTrafficSignal] = useState<TrafficSignal>({
    northSouth: "green",
    eastWest: "red",
    timeRemaining: 30
  });

  // Metrics
  const [metrics, setMetrics] = useState<Metrics>({
    totalVehicles: 0,
    activeVehicles: 0,
    averageWaitTime: 0,
    averageSpeed: 0,
    co2Emissions: 0,
    congestionLevel: 0
  });

  // Refs for animation
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const vehicleIdCounter = useRef(0);
  const obstructionIdCounter = useRef(0);

  // Vehicle spawning configuration
  const spawnRate = 1; // vehicles per second
  const lastSpawnTime = useRef(0);

  // Generate vehicle paths based on direction and target
  const generateVehiclePath = useCallback((
    direction: Vehicle["direction"], 
    targetDirection: Vehicle["targetDirection"]
  ): Vector3[] => {
    const path: Vector3[] = [];
    const roadLength = 500;
    const laneWidth = 3.25;
    
    // Starting positions (500m from center)
    const startPositions = {
      north: new Vector3(0, 0, roadLength / 2),
      south: new Vector3(0, 0, -roadLength / 2),
      east: new Vector3(roadLength / 2, 0, 0),
      west: new Vector3(-roadLength / 2, 0, 0)
    };

    // Center intersection bounds
    const intersectionSize = 30;

    switch (direction) {
      case "north":
        // Coming from north (positive Z)
        path.push(new Vector3(-laneWidth, 0, roadLength / 2)); // Start position
        path.push(new Vector3(-laneWidth, 0, intersectionSize / 2)); // Approach intersection
        
        if (targetDirection === "straight") {
          path.push(new Vector3(-laneWidth, 0, -intersectionSize / 2)); // Cross intersection
          path.push(new Vector3(-laneWidth, 0, -roadLength / 2)); // End
        } else if (targetDirection === "right") {
          // Turn right (to west)
          path.push(new Vector3(-laneWidth, 0, 0));
          path.push(new Vector3(-laneWidth - 10, 0, 0));
          path.push(new Vector3(-intersectionSize / 2, 0, laneWidth));
          path.push(new Vector3(-roadLength / 2, 0, laneWidth));
        } else if (targetDirection === "left") {
          // Turn left (to east)
          path.push(new Vector3(-laneWidth, 0, 0));
          path.push(new Vector3(-laneWidth + 10, 0, 0));
          path.push(new Vector3(intersectionSize / 2, 0, -laneWidth));
          path.push(new Vector3(roadLength / 2, 0, -laneWidth));
        }
        break;

      case "south":
        // Coming from south (negative Z)
        path.push(new Vector3(laneWidth, 0, -roadLength / 2));
        path.push(new Vector3(laneWidth, 0, -intersectionSize / 2));
        
        if (targetDirection === "straight") {
          path.push(new Vector3(laneWidth, 0, intersectionSize / 2));
          path.push(new Vector3(laneWidth, 0, roadLength / 2));
        } else if (targetDirection === "right") {
          // Turn right (to east)
          path.push(new Vector3(laneWidth, 0, 0));
          path.push(new Vector3(laneWidth + 10, 0, 0));
          path.push(new Vector3(intersectionSize / 2, 0, -laneWidth));
          path.push(new Vector3(roadLength / 2, 0, -laneWidth));
        } else if (targetDirection === "left") {
          // Turn left (to west)
          path.push(new Vector3(laneWidth, 0, 0));
          path.push(new Vector3(laneWidth - 10, 0, 0));
          path.push(new Vector3(-intersectionSize / 2, 0, laneWidth));
          path.push(new Vector3(-roadLength / 2, 0, laneWidth));
        }
        break;

      case "east":
        // Coming from east (positive X)
        path.push(new Vector3(roadLength / 2, 0, laneWidth));
        path.push(new Vector3(intersectionSize / 2, 0, laneWidth));
        
        if (targetDirection === "straight") {
          path.push(new Vector3(-intersectionSize / 2, 0, laneWidth));
          path.push(new Vector3(-roadLength / 2, 0, laneWidth));
        } else if (targetDirection === "right") {
          // Turn right (to north)
          path.push(new Vector3(0, 0, laneWidth));
          path.push(new Vector3(0, 0, laneWidth + 10));
          path.push(new Vector3(-laneWidth, 0, intersectionSize / 2));
          path.push(new Vector3(-laneWidth, 0, roadLength / 2));
        } else if (targetDirection === "left") {
          // Turn left (to south)
          path.push(new Vector3(0, 0, laneWidth));
          path.push(new Vector3(0, 0, laneWidth - 10));
          path.push(new Vector3(laneWidth, 0, -intersectionSize / 2));
          path.push(new Vector3(laneWidth, 0, -roadLength / 2));
        }
        break;

      case "west":
        // Coming from west (negative X)
        path.push(new Vector3(-roadLength / 2, 0, -laneWidth));
        path.push(new Vector3(-intersectionSize / 2, 0, -laneWidth));
        
        if (targetDirection === "straight") {
          path.push(new Vector3(intersectionSize / 2, 0, -laneWidth));
          path.push(new Vector3(roadLength / 2, 0, -laneWidth));
        } else if (targetDirection === "right") {
          // Turn right (to south)
          path.push(new Vector3(0, 0, -laneWidth));
          path.push(new Vector3(0, 0, -laneWidth - 10));
          path.push(new Vector3(laneWidth, 0, -intersectionSize / 2));
          path.push(new Vector3(laneWidth, 0, -roadLength / 2));
        } else if (targetDirection === "left") {
          // Turn left (to north)
          path.push(new Vector3(0, 0, -laneWidth));
          path.push(new Vector3(0, 0, -laneWidth + 10));
          path.push(new Vector3(-laneWidth, 0, intersectionSize / 2));
          path.push(new Vector3(-laneWidth, 0, roadLength / 2));
        }
        break;
    }

    return path;
  }, []);

  // Spawn new vehicle
  const spawnVehicle = useCallback(() => {
    const directions: Vehicle["direction"][] = ["north", "south", "east", "west"];
    const targetDirections: Vehicle["targetDirection"][] = ["straight", "left", "right"];
    const vehicleTypes: VehicleType[] = ["car", "car", "car", "car", "bus", "truck"]; // 80% cars, 12% bus, 8% truck weighted

    const direction = directions[Math.floor(Math.random() * directions.length)];
    const targetDirection = targetDirections[Math.floor(Math.random() * targetDirections.length)];
    const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];

    const path = generateVehiclePath(direction, targetDirection);
    
    if (path.length === 0) return;

    const vehicle: Vehicle = {
      id: `vehicle-${vehicleIdCounter.current++}`,
      type,
      position: path[0].clone(),
      rotation: direction === "north" ? Math.PI : direction === "south" ? 0 : direction === "east" ? -Math.PI / 2 : Math.PI / 2,
      speed: 0,
      maxSpeed: type === "car" ? 15 : type === "bus" ? 12 : 10, // m/s
      acceleration: type === "car" ? 2.5 : type === "bus" ? 1.8 : 2.0,
      deceleration: type === "car" ? 4.5 : type === "bus" ? 3.5 : 4.0,
      lane: 1,
      direction,
      targetDirection,
      path,
      pathIndex: 0,
      isWaiting: false,
      waitTime: 0,
      co2Emitted: 0
    };

    setVehicles(prev => [...prev, vehicle]);
  }, [generateVehiclePath]);

  // Update vehicle physics and behavior
  const updateVehicles = useCallback((deltaTime: number) => {
    setVehicles(prev => prev.map(vehicle => {
      const newVehicle = { ...vehicle };
      
      // Check if vehicle should stop for traffic signal
      const isApproachingIntersection = vehicle.pathIndex < vehicle.path.length - 1 &&
        Math.abs(vehicle.position.x) < 50 && Math.abs(vehicle.position.z) < 50;
      
      let shouldStop = false;
      if (isApproachingIntersection) {
        const signal = trafficSignal;
        if ((vehicle.direction === "north" || vehicle.direction === "south") && 
            (signal.northSouth === "red" || signal.northSouth === "yellow")) {
          shouldStop = true;
        } else if ((vehicle.direction === "east" || vehicle.direction === "west") && 
                   (signal.eastWest === "red" || signal.eastWest === "yellow")) {
          shouldStop = true;
        }
      }

      // Check for obstructions
      const nearbyObstruction = obstructions.find(obs => 
        vehicle.position.distanceTo(obs.position) < obs.size.x + 5
      );

      if (nearbyObstruction) {
        if (nearbyObstruction.effect.blocked) {
          shouldStop = true;
        } else {
          newVehicle.maxSpeed *= (1 - nearbyObstruction.effect.speedReduction);
        }
      }

      // Update waiting status
      if (shouldStop) {
        newVehicle.isWaiting = true;
        newVehicle.waitTime += deltaTime;
        newVehicle.speed = Math.max(0, newVehicle.speed - newVehicle.deceleration * deltaTime);
        
        // CO2 emissions while idling (0.2g per second per vehicle)
        newVehicle.co2Emitted += 0.0002 * deltaTime; // Convert to kg
      } else {
        newVehicle.isWaiting = false;
        
        // Accelerate toward max speed
        if (newVehicle.speed < newVehicle.maxSpeed) {
          newVehicle.speed = Math.min(newVehicle.maxSpeed, 
            newVehicle.speed + newVehicle.acceleration * deltaTime);
        }
      }

      // Move vehicle along path
      if (newVehicle.speed > 0 && newVehicle.pathIndex < newVehicle.path.length - 1) {
        const currentTarget = newVehicle.path[newVehicle.pathIndex + 1];
        const direction = currentTarget.clone().sub(newVehicle.position).normalize();
        const distance = newVehicle.speed * deltaTime;
        
        newVehicle.position.add(direction.multiplyScalar(distance));
        
        // Update rotation to face movement direction
        newVehicle.rotation = Math.atan2(direction.x, direction.z);
        
        // Check if reached waypoint
        if (newVehicle.position.distanceTo(currentTarget) < 2) {
          newVehicle.pathIndex++;
        }
      }

      return newVehicle;
    }).filter(vehicle => 
      // Remove vehicles that completed their path
      vehicle.pathIndex < vehicle.path.length - 1 ||
      vehicle.position.distanceTo(vehicle.path[vehicle.path.length - 1]) > 5
    ));
  }, [trafficSignal, obstructions]);

  // Update traffic signals
  const updateTrafficSignals = useCallback((deltaTime: number) => {
    setTrafficSignal(prev => {
      const newSignal = { ...prev };
      newSignal.timeRemaining -= deltaTime;
      
      if (newSignal.timeRemaining <= 0) {
        // Signal timing: N-S green (30s) → yellow (5s) → all-red (2s) → E-W green (30s) → yellow (5s) → all-red (2s)
        if (newSignal.northSouth === "green" && newSignal.eastWest === "red") {
          newSignal.northSouth = "yellow";
          newSignal.timeRemaining = 5;
        } else if (newSignal.northSouth === "yellow" && newSignal.eastWest === "red") {
          newSignal.northSouth = "red";
          newSignal.eastWest = "red";
          newSignal.timeRemaining = 2;
        } else if (newSignal.northSouth === "red" && newSignal.eastWest === "red") {
          newSignal.northSouth = "red";
          newSignal.eastWest = "green";
          newSignal.timeRemaining = 30;
        } else if (newSignal.northSouth === "red" && newSignal.eastWest === "green") {
          newSignal.northSouth = "red";
          newSignal.eastWest = "yellow";
          newSignal.timeRemaining = 5;
        } else if (newSignal.northSouth === "red" && newSignal.eastWest === "yellow") {
          newSignal.northSouth = "green";
          newSignal.eastWest = "red";
          newSignal.timeRemaining = 30;
        }
      }
      
      return newSignal;
    });
  }, []);

  // Calculate metrics
  const updateMetrics = useCallback(() => {
    const waitingVehicles = vehicles.filter(v => v.isWaiting);
    const avgWaitTime = waitingVehicles.length > 0 
      ? waitingVehicles.reduce((sum, v) => sum + v.waitTime, 0) / waitingVehicles.length 
      : 0;
    
    const avgSpeed = vehicles.length > 0
      ? vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicles.length
      : 0;
    
    const totalCO2 = vehicles.reduce((sum, v) => sum + v.co2Emitted, 0);
    
    const congestionLevel = Math.min(100, waitingVehicles.length / Math.max(1, vehicles.length) * 100);
    
    setMetrics({
      totalVehicles: vehicleIdCounter.current,
      activeVehicles: vehicles.length,
      averageWaitTime: avgWaitTime,
      averageSpeed: avgSpeed,
      co2Emissions: totalCO2,
      congestionLevel
    });
  }, [vehicles]);

  // Main animation loop
  const animate = useCallback((currentTime: number) => {
    if (!isRunning || isPaused) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const deltaTime = (currentTime - lastTimeRef.current) / 1000 * speed;
    lastTimeRef.current = currentTime;

    // Spawn vehicles (1 vehicle per second network-wide)
    if (currentTime - lastSpawnTime.current > (1000 / spawnRate) / speed) {
      spawnVehicle();
      lastSpawnTime.current = currentTime;
    }

    // Update simulation
    updateVehicles(deltaTime);
    updateTrafficSignals(deltaTime);
    updateMetrics();

    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, isPaused, speed, spawnVehicle, updateVehicles, updateTrafficSignals, updateMetrics]);

  // Start animation loop
  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, animate]);

  // Actions
  const startSimulation = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pauseSimulation = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const setSimulationSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  const selectTool = useCallback((tool: ObstructionType | null) => {
    setSelectedTool(tool);
  }, []);

  const addObstruction = useCallback((obstruction: Omit<Obstruction, "id">) => {
    const newObstruction: Obstruction = {
      ...obstruction,
      id: `obstruction-${obstructionIdCounter.current++}`
    };
    setObstructions(prev => [...prev, newObstruction]);
  }, []);

  const placeObstructionAtPosition = useCallback((x: number, z: number) => {
    if (!selectedTool) return;

    // Check if click is on road (within road bounds)
    const isOnRoad = (Math.abs(x) < 10 && Math.abs(z) < 500) || 
                    (Math.abs(z) < 10 && Math.abs(x) < 500);
    
    if (!isOnRoad) {
      alert("Invalid placement — must be on road.");
      return;
    }

    // Determine which lane and direction
    let lane = 1;
    let direction: "north" | "south" | "east" | "west";
    
    if (Math.abs(x) < 10) {
      // North-South road
      direction = z > 0 ? "north" : "south";
      lane = x < 0 ? 1 : 2;
    } else {
      // East-West road  
      direction = x > 0 ? "east" : "west";
      lane = z > 0 ? 1 : 2;
    }

    // Create obstruction based on selected tool
    const baseObstruction = {
      position: new Vector3(x, 0.5, z),
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
    setSelectedTool(null); // Clear selection after placement
  }, [selectedTool, addObstruction]);

  const removeObstruction = useCallback((id: string) => {
    setObstructions(prev => prev.filter(obs => obs.id !== id));
  }, []);

  const clearAllObstructions = useCallback(() => {
    setObstructions([]);
  }, []);

  const optimizeSignals = useCallback(() => {
    // Simple optimization: adjust signal timing based on current traffic density
    // This is a placeholder for more sophisticated optimization algorithms
    console.log("Optimizing traffic signals based on current conditions...");
  }, []);

  const exportMetrics = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      vehicles: vehicles.length,
      obstructions: obstructions.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traffic-simulation-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metrics, vehicles, obstructions]);

  const resetToBaseline = useCallback(() => {
    setVehicles([]);
    setObstructions([]);
    setTrafficSignal({
      northSouth: "green",
      eastWest: "red",
      timeRemaining: 30
    });
    vehicleIdCounter.current = 0;
    obstructionIdCounter.current = 0;
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const contextValue: SimulationContextType = {
    isRunning,
    isPaused,
    speed,
    vehicles,
    obstructions,
    trafficSignal,
    metrics,
    selectedTool,
    isPlacingObstruction: selectedTool !== null,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    setSimulationSpeed,
    selectTool,
    addObstruction,
    removeObstruction,
    clearAllObstructions,
    optimizeSignals,
    exportMetrics,
    resetToBaseline,
    placeObstructionAtPosition
  };

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  );
};