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

// Enhanced Traffic signal state with optimization
export interface TrafficSignal {
  northSouth: "green" | "yellow" | "red";
  eastWest: "green" | "yellow" | "red";
  timeRemaining: number;
  cycle: {
    nsGreen: number;
    nsYellow: number;
    ewGreen: number;
    ewYellow: number;
    allRed: number;
  };
  isOptimized: boolean;
}

// Enhanced Simulation metrics
export interface Metrics {
  totalVehicles: number;
  activeVehicles: number;
  averageWaitTime: number;
  averageSpeed: number;
  co2Emissions: number;
  congestionLevel: number;
  throughput: number;
  queueLengths: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Baseline metrics for comparison
export interface BaselineMetrics {
  averageWaitTime: number;
  averageSpeed: number;
  throughput: number;
}

// Roundabout configuration
export interface RoundaboutConfig {
  radius: number;
  entryPoints: Vector3[];
  exitPoints: Vector3[];
  circulatoryPath: Vector3[];
}

// Enhanced Simulation context
interface EnhancedSimulationContextType {
  // State
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
  vehicles: Vehicle[];
  obstructions: Obstruction[];
  trafficSignal: TrafficSignal;
  metrics: Metrics;
  baselineMetrics: BaselineMetrics | null;
  selectedTool: ObstructionType | null;
  isPlacingObstruction: boolean;
  isRoundabout: boolean;
  roundaboutConfig: RoundaboutConfig | null;
  cameraPreset: 'orbit' | 'top-down' | 'approach' | 'judge';
  
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
  toggleRoundabout: () => void;
  setCameraPreset: (preset: 'orbit' | 'top-down' | 'approach' | 'judge') => void;
  captureBaseline: () => void;
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
  CAR: { 
    maxSpeed: 13.9, // m/s (50 km/h)
    accel: 2.5, 
    decel: 4.5,
    length: 4,
    width: 2
  },
  BUS: { 
    maxSpeed: 11.1, // m/s (40 km/h)
    accel: 1.8, 
    decel: 3.5,
    length: 12,
    width: 2.5
  },
  TRUCK: { 
    maxSpeed: 10.0, // m/s (36 km/h)
    accel: 2.0, 
    decel: 4.0,
    length: 8,
    width: 2.5
  }
};

export const EnhancedSimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [selectedTool, setSelectedTool] = useState<ObstructionType | null>(null);
  const [isRoundabout, setIsRoundabout] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<'orbit' | 'top-down' | 'approach' | 'judge'>('orbit');
  const [baselineMetrics, setBaselineMetrics] = useState<BaselineMetrics | null>(null);
  const [roundaboutConfig, setRoundaboutConfig] = useState<RoundaboutConfig | null>(null);
  
  // Enhanced Traffic signal state
  const [trafficSignal, setTrafficSignal] = useState<TrafficSignal>({
    northSouth: "green",
    eastWest: "red",
    timeRemaining: 30,
    cycle: {
      nsGreen: 30,
      nsYellow: 5,
      ewGreen: 30,
      ewYellow: 5,
      allRed: 2
    },
    isOptimized: false
  });

  // Enhanced Metrics
  const [metrics, setMetrics] = useState<Metrics>({
    totalVehicles: 0,
    activeVehicles: 0,
    averageWaitTime: 0,
    averageSpeed: 0,
    co2Emissions: 0,
    congestionLevel: 0,
    throughput: 0,
    queueLengths: { north: 0, south: 0, east: 0, west: 0 }
  });

  // Refs for animation and tracking
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const vehicleIdCounter = useRef(0);
  const obstructionIdCounter = useRef(0);
  const completedVehiclesRef = useRef(0);
  const simulationStartTime = useRef<number>(0);
  const queueSamples = useRef<Array<{ timestamp: number, queueLengths: typeof metrics.queueLengths }>>([]);

  // Generate roundabout configuration
  const generateRoundaboutConfig = useCallback((): RoundaboutConfig => {
    const radius = 20;
    const entryPoints: Vector3[] = [];
    const exitPoints: Vector3[] = [];
    const circulatoryPath: Vector3[] = [];
    
    // Create circular path with 32 points
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      circulatoryPath.push(new Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    
    // Entry and exit points for each direction
    entryPoints.push(
      new Vector3(0, 0, radius + 10),   // North entry
      new Vector3(0, 0, -radius - 10),  // South entry
      new Vector3(radius + 10, 0, 0),   // East entry
      new Vector3(-radius - 10, 0, 0)   // West entry
    );
    
    exitPoints.push(
      new Vector3(0, 0, -radius - 10),  // North exit (south)
      new Vector3(0, 0, radius + 10),   // South exit (north)
      new Vector3(-radius - 10, 0, 0),  // East exit (west)
      new Vector3(radius + 10, 0, 0)    // West exit (east)
    );

    return { radius, entryPoints, exitPoints, circulatoryPath };
  }, []);

  // Enhanced vehicle path generation with smooth curves
  const generateVehiclePath = useCallback((
    direction: Vehicle["direction"], 
    targetDirection: Vehicle["targetDirection"]
  ): Vector3[] => {
    const path: Vector3[] = [];
    const roadLength = 500;
    const laneWidth = 3.25;
    
    if (isRoundabout && roundaboutConfig) {
      // Generate roundabout paths
      const config = roundaboutConfig;
      const entryIndex = direction === "north" ? 0 : direction === "south" ? 1 : 
                        direction === "east" ? 2 : 3;
      
      // Start from approach
      path.push(new Vector3(
        direction === "north" || direction === "south" ? 
          (direction === "north" ? -laneWidth : laneWidth) : 
          (direction === "east" ? roadLength / 2 : -roadLength / 2),
        0,
        direction === "east" || direction === "west" ? 
          (direction === "east" ? laneWidth : -laneWidth) : 
          (direction === "north" ? roadLength / 2 : -roadLength / 2)
      ));
      
      // Add entry point
      path.push(config.entryPoints[entryIndex]);
      
      // Add roundabout circulation based on target direction
      const startCircIndex = entryIndex * 8; // Each direction gets 8 points
      let endCircIndex = startCircIndex;
      
      if (targetDirection === "straight") {
        endCircIndex = (startCircIndex + 16) % 32; // Half circle
      } else if (targetDirection === "right") {
        endCircIndex = (startCircIndex + 8) % 32; // Quarter circle
      } else if (targetDirection === "left") {
        endCircIndex = (startCircIndex + 24) % 32; // Three quarters
      }
      
      // Add circulation path
      let currentIndex = startCircIndex;
      while (currentIndex !== endCircIndex) {
        path.push(config.circulatoryPath[currentIndex]);
        currentIndex = (currentIndex + 1) % 32;
      }
      
      // Add exit
      const exitIndex = (entryIndex + (targetDirection === "right" ? 1 : 
                         targetDirection === "straight" ? 2 : 3)) % 4;
      path.push(config.exitPoints[exitIndex]);
      
      return path;
    }
    
    // Regular intersection paths with smooth turning
    const intersectionSize = 30;
    
    switch (direction) {
      case "north":
        path.push(new Vector3(-laneWidth, 0, roadLength / 2));
        path.push(new Vector3(-laneWidth, 0, intersectionSize / 2));
        
        if (targetDirection === "straight") {
          path.push(new Vector3(-laneWidth, 0, -intersectionSize / 2));
          path.push(new Vector3(-laneWidth, 0, -roadLength / 2));
        } else if (targetDirection === "right") {
          // Smooth right turn using Bezier control points
          path.push(new Vector3(-laneWidth, 0, 0));
          path.push(new Vector3(-laneWidth - 5, 0, 0));
          path.push(new Vector3(-intersectionSize / 2 - 5, 0, laneWidth + 5));
          path.push(new Vector3(-intersectionSize / 2, 0, laneWidth));
          path.push(new Vector3(-roadLength / 2, 0, laneWidth));
        } else if (targetDirection === "left") {
          // Smooth left turn
          path.push(new Vector3(-laneWidth, 0, 0));
          path.push(new Vector3(-laneWidth + 5, 0, 0));
          path.push(new Vector3(intersectionSize / 2 + 5, 0, -laneWidth - 5));
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
          path.push(new Vector3(laneWidth + 5, 0, 0));
          path.push(new Vector3(intersectionSize / 2 + 5, 0, -laneWidth - 5));
          path.push(new Vector3(intersectionSize / 2, 0, -laneWidth));
          path.push(new Vector3(roadLength / 2, 0, -laneWidth));
        } else if (targetDirection === "left") {
          path.push(new Vector3(laneWidth, 0, 0));
          path.push(new Vector3(laneWidth - 5, 0, 0));
          path.push(new Vector3(-intersectionSize / 2 - 5, 0, laneWidth + 5));
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
          path.push(new Vector3(0, 0, laneWidth + 5));
          path.push(new Vector3(-laneWidth - 5, 0, intersectionSize / 2 + 5));
          path.push(new Vector3(-laneWidth, 0, intersectionSize / 2));
          path.push(new Vector3(-laneWidth, 0, roadLength / 2));
        } else if (targetDirection === "left") {
          path.push(new Vector3(0, 0, laneWidth));
          path.push(new Vector3(0, 0, laneWidth - 5));
          path.push(new Vector3(laneWidth + 5, 0, -intersectionSize / 2 - 5));
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
          path.push(new Vector3(0, 0, -laneWidth - 5));
          path.push(new Vector3(laneWidth + 5, 0, -intersectionSize / 2 - 5));
          path.push(new Vector3(laneWidth, 0, -intersectionSize / 2));
          path.push(new Vector3(laneWidth, 0, -roadLength / 2));
        } else if (targetDirection === "left") {
          path.push(new Vector3(0, 0, -laneWidth));
          path.push(new Vector3(0, 0, -laneWidth + 5));
          path.push(new Vector3(-laneWidth - 5, 0, intersectionSize / 2 + 5));
          path.push(new Vector3(-laneWidth, 0, intersectionSize / 2));
          path.push(new Vector3(-laneWidth, 0, roadLength / 2));
        }
        break;
    }

    return path;
  }, [isRoundabout, roundaboutConfig]);

  // Memoized vehicle spawning for better performance
  const spawnVehicle = useCallback(() => {
    const directions: Vehicle["direction"][] = ["north", "south", "east", "west"];
    
    // Pre-built weighted array for better performance with proper typing
    const weightedTargets: Vehicle["targetDirection"][] = [
      "straight", "straight", "straight", "straight", "straight",
      "left", "left", "right", "right"
    ];
    
    const direction = directions[Math.floor(Math.random() * 4)];
    const targetDirection = weightedTargets[Math.floor(Math.random() * weightedTargets.length)];
    
    // Optimized type selection
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
  }, [generateVehiclePath]);

  // Optimized vehicle physics update with better performance
  const updateVehiclePhysics = useCallback((vehicle: Vehicle, deltaTime: number): Vehicle => {
    // Use object destructuring for better performance
    const { position, speed, pathIndex, path, maxSpeed, acceleration, deceleration } = vehicle;
    
    // Pre-allocate result object
    const updatedVehicle = { ...vehicle };
    
    // Optimized obstruction checking
    let speedMultiplier = 1.0;
    let isBlocked = false;
    
    // Early exit if no obstructions
    if (obstructions.length > 0) {
      const vehPos = position;
      for (let i = 0; i < obstructions.length && !isBlocked; i++) {
        const obs = obstructions[i];
        // Use squared distance to avoid expensive sqrt
        const dx = vehPos.x - obs.position.x;
        const dz = vehPos.z - obs.position.z;
        const distSq = dx * dx + dz * dz;
        const radiusSq = obs.size.x * obs.size.x;
        
        if (distSq < radiusSq) {
          if (obs.effect.blocked) {
            isBlocked = true;
          } else {
            speedMultiplier *= (1 - obs.effect.speedReduction);
          }
        }
      }
    }
    
    // Optimized speed calculation
    const targetSpeed = isBlocked ? 0 : maxSpeed * speedMultiplier;
    updatedVehicle.targetSpeed = targetSpeed * 0.1 + vehicle.targetSpeed * 0.9; // Smoother acceleration
    
    // Update speed
    const speedDiff = updatedVehicle.targetSpeed - speed;
    if (Math.abs(speedDiff) > 0.02) {
      const accel = speedDiff > 0 ? acceleration : deceleration;
      updatedVehicle.speed = Math.max(0, Math.min(
        speed + Math.sign(speedDiff) * accel * deltaTime,
        maxSpeed
      ));
    }
    
    // Optimized position update
    if (pathIndex < path.length - 1 && updatedVehicle.speed > 0.02) {
      const target = path[pathIndex + 1];
      
      // Calculate direction more efficiently
      const dx = target.x - position.x;
      const dz = target.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist > 0.5) {
        // Normalize and move
        const moveDistance = updatedVehicle.speed * deltaTime;
        const factor = moveDistance / dist;
        
        updatedVehicle.position = position.clone();
        updatedVehicle.position.x += dx * factor;
        updatedVehicle.position.z += dz * factor;
        
        // Update velocity
        updatedVehicle.velocity.set(dx / dist * updatedVehicle.speed, 0, dz / dist * updatedVehicle.speed);
        
        // Smooth rotation update
        const targetRotation = Math.atan2(dx, dz);
        let rotDiff = targetRotation - vehicle.rotation;
        
        // Normalize angle difference
        while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
        while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
        
        updatedVehicle.rotation = vehicle.rotation + rotDiff * Math.min(deltaTime * 5, 0.3);
      } else {
        updatedVehicle.pathIndex = pathIndex + 1;
      }
    }
    
    // Simplified wait time and emissions
    if (updatedVehicle.speed < 0.1) {
      updatedVehicle.waitTime += deltaTime;
      updatedVehicle.isWaiting = updatedVehicle.waitTime > 1.0;
      updatedVehicle.co2Emitted += 0.15 * deltaTime; // Idle emissions
    } else {
      updatedVehicle.waitTime = Math.max(0, updatedVehicle.waitTime - deltaTime * 0.5);
      updatedVehicle.isWaiting = false;
      updatedVehicle.co2Emitted += 0.05 * deltaTime * updatedVehicle.speed; // Moving emissions
    }
    
    return updatedVehicle;
  }, [obstructions]);

  // Optimized traffic signal update - renamed to avoid conflict
  const updateTrafficSignals = useCallback((deltaTime: number) => {
    setTrafficSignal(prev => {
      const newSignal = { ...prev };
      newSignal.timeRemaining -= deltaTime;
      
      if (newSignal.timeRemaining <= 0) {
        // Cycle through signal phases
        if (newSignal.northSouth === "green") {
          newSignal.northSouth = "yellow";
          newSignal.eastWest = "red";
          newSignal.timeRemaining = newSignal.cycle.nsYellow;
        } else if (newSignal.northSouth === "yellow") {
          newSignal.northSouth = "red";
          newSignal.eastWest = "red";
          newSignal.timeRemaining = newSignal.cycle.allRed;
        } else if (newSignal.eastWest === "red" && newSignal.northSouth === "red") {
          newSignal.northSouth = "red";
          newSignal.eastWest = "green";
          newSignal.timeRemaining = newSignal.cycle.ewGreen;
        } else if (newSignal.eastWest === "green") {
          newSignal.northSouth = "red";
          newSignal.eastWest = "yellow";
          newSignal.timeRemaining = newSignal.cycle.ewYellow;
        } else if (newSignal.eastWest === "yellow") {
          newSignal.northSouth = "green";
          newSignal.eastWest = "red";
          newSignal.timeRemaining = newSignal.cycle.nsGreen;
        }
      }
      
      return newSignal;
    });
  }, []);

  // Enhanced metrics calculation
  const updateMetrics = useCallback(() => {
    const activeVehicles = vehicles.length;
    const totalWaitTime = vehicles.reduce((sum, v) => sum + v.waitTime, 0);
    const totalSpeed = vehicles.reduce((sum, v) => sum + v.speed, 0);
    const totalCO2 = vehicles.reduce((sum, v) => sum + v.co2Emitted, 0);
    const waitingVehicles = vehicles.filter(v => v.isWaiting).length;
    
    // Calculate queue lengths by direction
    const queueLengths = {
      north: vehicles.filter(v => v.direction === "north" && v.isWaiting).length,
      south: vehicles.filter(v => v.direction === "south" && v.isWaiting).length,
      east: vehicles.filter(v => v.direction === "east" && v.isWaiting).length,
      west: vehicles.filter(v => v.direction === "west" && v.isWaiting).length
    };
    
    // Calculate throughput (vehicles per minute)
    const elapsedMinutes = (performance.now() - simulationStartTime.current) / 60000;
    const throughput = elapsedMinutes > 0 ? completedVehiclesRef.current / elapsedMinutes : 0;
    
    setMetrics({
      totalVehicles: vehicleIdCounter.current,
      activeVehicles,
      averageWaitTime: activeVehicles > 0 ? totalWaitTime / activeVehicles : 0,
      averageSpeed: activeVehicles > 0 ? totalSpeed / activeVehicles : 0,
      co2Emissions: totalCO2,
      congestionLevel: activeVehicles > 0 ? (waitingVehicles / activeVehicles) * 100 : 0,
      throughput,
      queueLengths
    });
  }, [vehicles]);

  // Optimized main simulation loop with reduced update frequency
  const animate = useCallback((currentTime: number) => {
    if (!isRunning || isPaused) return;
    
    const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.016) * speed; // Cap at 60fps
    lastTimeRef.current = currentTime;
    
    // Update vehicles with batched state changes
    setVehicles(prev => {
      const updated: Vehicle[] = [];
      let completedCount = 0;
      
      // Process all vehicles in a single loop
      for (let i = 0; i < prev.length; i++) {
        const vehicle = prev[i];
        
        if (vehicle.pathIndex >= vehicle.path.length - 1) {
          completedCount++;
          continue; // Remove completed vehicle
        }
        
        const updatedVehicle = updateVehiclePhysics(vehicle, deltaTime);
        updated.push(updatedVehicle);
      }
      
      // Update completed vehicles counter
      completedVehiclesRef.current += completedCount;
      
      return updated;
    });
    
    // Controlled vehicle spawning with better performance
    const currentVehicleCount = vehicles.length;
    const maxVehicles = 35; // Reduced for better performance
    const spawnProbability = 0.2 * deltaTime; // Reduced spawn rate
    
    if (Math.random() < spawnProbability && 
        currentVehicleCount < maxVehicles && 
        vehicleIdCounter.current < 250) {
      try {
        spawnVehicle();
      } catch (error) {
        console.warn("Spawn failed:", error);
      }
    }
    
    // Update traffic signals less frequently (every ~100ms)
    if (!isRoundabout && Math.floor(currentTime / 100) !== Math.floor((currentTime - deltaTime * 1000) / 100)) {
      updateTrafficSignals(deltaTime);
    }
    
    // Update metrics even less frequently (every ~500ms)
    if (Math.floor(currentTime / 500) !== Math.floor((currentTime - deltaTime * 1000) / 500)) {
      updateMetrics();
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, isPaused, speed, vehicles.length, spawnVehicle, updateVehiclePhysics, updateTrafficSignals, updateMetrics, isRoundabout]);

  // Start animation loop
  useEffect(() => {
    if (isRunning && !isPaused) {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, isPaused, animate]);

  const contextValue: EnhancedSimulationContextType = {
    isRunning,
    isPaused,
    speed,
    vehicles,
    obstructions,
    trafficSignal,
    metrics,
    baselineMetrics,
    selectedTool,
    isPlacingObstruction: selectedTool !== null,
    isRoundabout,
    roundaboutConfig,
    cameraPreset,
    startSimulation: () => {
      setIsRunning(true);
      setIsPaused(false);
      simulationStartTime.current = performance.now();
    },
    pauseSimulation: () => setIsPaused(!isPaused),
    stopSimulation: () => {
      setIsRunning(false);
      setIsPaused(false);
    },
    setSimulationSpeed: (newSpeed: number) => setSpeed(newSpeed),
    selectTool: (tool: ObstructionType | null) => setSelectedTool(tool),
    addObstruction: (obstruction: Omit<Obstruction, "id">) => {
      const newObstruction: Obstruction = {
        ...obstruction,
        id: `obstruction-${obstructionIdCounter.current++}`
      };
      setObstructions(prev => [...prev, newObstruction]);
    },
    removeObstruction: (id: string) => {
      setObstructions(prev => prev.filter(obs => obs.id !== id));
    },
    clearAllObstructions: () => setObstructions([]),
    optimizeSignals: () => {
      // Implement actual signal optimization based on queue lengths
      const avgQueueLength = (metrics.queueLengths.north + metrics.queueLengths.south + 
                             metrics.queueLengths.east + metrics.queueLengths.west) / 4;
      
      if (avgQueueLength > 5) {
        // Increase green times for heavily congested directions
        setTrafficSignal(prev => ({
          ...prev,
          cycle: {
            ...prev.cycle,
            nsGreen: Math.min(60, prev.cycle.nsGreen + 5),
            ewGreen: Math.min(60, prev.cycle.ewGreen + 5)
          },
          isOptimized: true
        }));
      }
    },
    exportMetrics: () => {
      const data = {
        timestamp: new Date().toISOString(),
        metrics,
        baselineMetrics,
        vehicles: vehicles.length,
        obstructions: obstructions.length,
        isRoundabout
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
    },
    resetToBaseline: () => {
      setVehicles([]);
      setObstructions([]);
      setIsRoundabout(false);
      setRoundaboutConfig(null);
      setTrafficSignal({
        northSouth: "green",
        eastWest: "red",
        timeRemaining: 30,
        cycle: {
          nsGreen: 30,
          nsYellow: 5,
          ewGreen: 30,
          ewYellow: 5,
          allRed: 2
        },
        isOptimized: false
      });
      vehicleIdCounter.current = 0;
      obstructionIdCounter.current = 0;
      completedVehiclesRef.current = 0;
      setIsRunning(false);
      setIsPaused(false);
    },
    placeObstructionAtPosition: (x: number, z: number) => {
      // Enhanced placement validation with lane detection
      const laneWidth = 3.25;
      const roadLength = 500;
      
      // Check if position is on a valid lane
      let validLane = false;
      let lane = 0;
      let direction: "north" | "south" | "east" | "west" = "north";
      
      // North-South roads
      if (Math.abs(x) < laneWidth * 1.5 && Math.abs(z) < roadLength / 2) {
        validLane = true;
        direction = z > 0 ? "north" : "south";
        lane = x < 0 ? 0 : 1;
      }
      // East-West roads
      else if (Math.abs(z) < laneWidth * 1.5 && Math.abs(x) < roadLength / 2) {
        validLane = true;
        direction = x > 0 ? "east" : "west";
        lane = z > 0 ? 0 : 1;
      }
      
      if (!validLane) {
        console.warn("Invalid placement — must be on lane");
        return;
      }
      
      if (selectedTool) {
        const obstruction: Omit<Obstruction, "id"> = {
          type: selectedTool,
          position: new Vector3(x, 0, z),
          size: new Vector3(
            selectedTool === "pothole" ? 20 : selectedTool === "barricade" ? 5 : 10,
            1,
            selectedTool === "pothole" ? 3 : selectedTool === "barricade" ? 3 : 5
          ),
          lane,
          direction,
          effect: {
            speedReduction: selectedTool === "pothole" ? 0.5 : selectedTool === "vendor" ? 0.3 : 0,
            capacityReduction: selectedTool === "vendor" ? 0.5 : 0,
            blocked: selectedTool === "barricade"
          }
        };
        
        contextValue.addObstruction(obstruction);
        setSelectedTool(null);
      }
    },
    toggleRoundabout: () => {
      if (!isRoundabout) {
        const config = generateRoundaboutConfig();
        setRoundaboutConfig(config);
      } else {
        setRoundaboutConfig(null);
      }
      setIsRoundabout(!isRoundabout);
    },
    setCameraPreset: (preset: 'orbit' | 'top-down' | 'approach' | 'judge') => {
      setCameraPreset(preset);
    },
    captureBaseline: () => {
      setBaselineMetrics({
        averageWaitTime: metrics.averageWaitTime,
        averageSpeed: metrics.averageSpeed,
        throughput: metrics.throughput
      });
    }
  };

  return (
    <EnhancedSimulationContext.Provider value={contextValue}>
      {children}
    </EnhancedSimulationContext.Provider>
  );
};
