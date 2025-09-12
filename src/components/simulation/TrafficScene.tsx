import { useRef, useMemo, useCallback } from "react";
import React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Vector3, Color, Raycaster, Vector2 } from "three";
import { useEnhancedSimulation } from "./EnhancedSimulationContext";
import { Text, Environment, ContactShadows, Plane } from "@react-three/drei";
import { RoundaboutGeometry } from "./RoundaboutGeometry";
import { EmissionParticles, SpeedEffects, CongestionHeatmap, DynamicLighting } from "./VisualEffects";

// Road intersection component
const RoadIntersection = () => {
  return (
    <group>
      {/* Main intersection roads */}
      {/* North-South road */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[20, 0.2, 1000]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
      
      {/* East-West road */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[1000, 0.2, 20]} />
        <meshLambertMaterial color="#404040" />
      </mesh>

      {/* Lane markings - North-South */}
      <mesh position={[-3.25, 0, 0]}>
        <boxGeometry args={[0.2, 0.05, 1000]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      <mesh position={[3.25, 0, 0]}>
        <boxGeometry args={[0.2, 0.05, 1000]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>

      {/* Lane markings - East-West */}
      <mesh position={[0, 0, -3.25]}>
        <boxGeometry args={[1000, 0.05, 0.2]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0, 3.25]}>
        <boxGeometry args={[1000, 0.05, 0.2]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>

      {/* Center intersection marking */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[30, 0.05, 30]} />
        <meshLambertMaterial color="#ffff00" opacity={0.3} transparent />
      </mesh>
    </group>
  );
};

// Traffic light component
interface TrafficLightProps {
  position: [number, number, number];
  signals: {
    primary: "green" | "yellow" | "red";
    secondary: "green" | "yellow" | "red";
  };
}

const TrafficLight: React.FC<TrafficLightProps> = ({ position, signals }) => {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 10]} />
        <meshLambertMaterial color="#333333" />
      </mesh>
      
      {/* Light housing */}
      <mesh position={[0, 9, 0]}>
        <boxGeometry args={[1, 3, 1]} />
        <meshLambertMaterial color="#222222" />
      </mesh>
      
      {/* Red light */}
      <mesh position={[0, 10, 0.6]}>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial 
          color={signals.primary === "red" ? "#ff0000" : "#330000"}
          emissive={signals.primary === "red" ? "#ff0000" : "#000000"}
          emissiveIntensity={signals.primary === "red" ? 0.5 : 0}
        />
      </mesh>
      
      {/* Yellow light */}
      <mesh position={[0, 9, 0.6]}>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial 
          color={signals.primary === "yellow" ? "#ffff00" : "#333300"}
          emissive={signals.primary === "yellow" ? "#ffff00" : "#000000"}
          emissiveIntensity={signals.primary === "yellow" ? 0.5 : 0}
        />
      </mesh>
      
      {/* Green light */}
      <mesh position={[0, 8, 0.6]}>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial 
          color={signals.primary === "green" ? "#00ff00" : "#003300"}
          emissive={signals.primary === "green" ? "#00ff00" : "#000000"}
          emissiveIntensity={signals.primary === "green" ? 0.5 : 0}
        />
      </mesh>
    </group>
  );
};

// Vehicle component with enhanced 3D models
const Vehicle = React.memo(({ vehicle }: { vehicle: any }) => {
  const meshRef = useRef<Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current && vehicle.position) {
      meshRef.current.position.copy(vehicle.position);
      meshRef.current.rotation.y = vehicle.rotation || 0;
    }
  });

  const getVehicleColor = (type: string) => {
    switch (type) {
      case "bus": return "#ff6b35";
      case "truck": return "#8B4513";
      default: return "#4fc3f7";
    }
  };

  const getVehicleSize = (type: string): [number, number, number] => {
    switch (type) {
      case "bus": return [2.5, 3, 12];
      case "truck": return [2.5, 3.5, 8];
      default: return [2, 1.5, 4];
    }
  };

  const size = getVehicleSize(vehicle.type);
  const color = getVehicleColor(vehicle.type);

  return (
    <group>
      {/* Main vehicle body */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
      
      {/* Windows */}
      <mesh ref={meshRef} position={[0, size[1] * 0.3, 0]}>
        <boxGeometry args={[size[0] * 0.9, size[1] * 0.4, size[2] * 0.9]} />
        <meshStandardMaterial 
          color="#87ceeb" 
          transparent 
          opacity={0.3}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Headlights */}
      <mesh position={[size[0] * 0.3, 0, size[2] * 0.5]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={vehicle.speed > 1 ? 0.3 : 0.1}
        />
      </mesh>
      <mesh position={[-size[0] * 0.3, 0, size[2] * 0.5]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={vehicle.speed > 1 ? 0.3 : 0.1}
        />
      </mesh>

      {/* Taillights */}
      <mesh position={[size[0] * 0.3, 0, -size[2] * 0.5]}>
        <sphereGeometry args={[0.15]} />
        <meshStandardMaterial 
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={vehicle.speed < 2 ? 0.5 : 0.1}
        />
      </mesh>
      <mesh position={[-size[0] * 0.3, 0, -size[2] * 0.5]}>
        <sphereGeometry args={[0.15]} />
        <meshStandardMaterial 
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={vehicle.speed < 2 ? 0.5 : 0.1}
        />
      </mesh>

      {/* Animated wheels */}
      {[-size[0] * 0.4, size[0] * 0.4].map((x, i) => 
        [-size[2] * 0.3, size[2] * 0.3].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, -size[1] * 0.4, z]}>
            <cylinderGeometry args={[0.4, 0.4, 0.2]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
        ))
      )}

      {/* Status indicator */}
      {vehicle.isWaiting && (
        <mesh position={[0, size[1] + 1, 0]}>
          <sphereGeometry args={[0.3]} />
          <meshStandardMaterial 
            color="#ff4444"
            emissive="#ff4444"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
});

// Obstruction component
const Obstruction = React.memo(({ obstruction }: { obstruction: any }) => {
  const getObstructionColor = (type: string) => {
    switch (type) {
      case "pothole": return "#8B4513";
      case "barricade": return "#ff6b35";
      case "vendor": return "#32cd32";
      default: return "#888888";
    }
  };

  const getObstructionGeometry = (type: string) => {
    switch (type) {
      case "pothole":
        return <cylinderGeometry args={[2, 2, 0.3]} />;
      case "barricade":
        return <boxGeometry args={[4, 2, 1]} />;
      case "vendor":
        return <boxGeometry args={[3, 2, 3]} />;
      default:
        return <boxGeometry args={[2, 2, 2]} />;
    }
  };

  return (
    <mesh position={obstruction.position} castShadow>
      {getObstructionGeometry(obstruction.type)}
      <meshStandardMaterial color={getObstructionColor(obstruction.type)} />
      
      {/* Label */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {obstruction.type.toUpperCase()}
      </Text>
    </mesh>
  );
});

export const TrafficScene = () => {
  const { vehicles, obstructions, trafficSignal, placeObstruction, selectedTool, isDemoMode } = useEnhancedSimulation();
  const { camera, raycaster, mouse, scene } = useThree();

  const handlePlaceObstruction = useCallback((event: any) => {
    if (!selectedTool) return;
    
    event.stopPropagation();
    const position = new Vector3(event.point.x, 0, event.point.z);
    placeObstruction(position, selectedTool);
  }, [selectedTool, placeObstruction]);

  // Memoize vehicles and obstructions arrays to prevent unnecessary re-renders
  const memoizedVehicles = useMemo(() => vehicles, [vehicles.length, vehicles.map(v => v.id + v.position.x + v.position.z).join()]);
  const memoizedObstructions = useMemo(() => obstructions, [obstructions.length, obstructions.map(o => o.id).join()]);

  return (
    <group>
      {/* Enhanced lighting system */}
      <Environment preset={isDemoMode ? "sunset" : "city"} />
      <ambientLight intensity={isDemoMode ? 0.3 : 0.4} />
      <DynamicLighting timeOfDay={isDemoMode ? 18 : 12} />
      
      {/* Ground plane with enhanced materials */}
      <Plane 
        args={[2000, 2000]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color="#2d5016" 
          roughness={0.8}
          metalness={0.1}
        />
      </Plane>

      {/* Roads */}
      <RoadIntersection />

      {/* Enhanced Traffic lights */}
      <TrafficLight 
        position={[-15, 0, -15]} 
        signals={{
          primary: trafficSignal.northSouth,
          secondary: trafficSignal.eastWest
        }}
      />
      <TrafficLight 
        position={[15, 0, 15]} 
        signals={{
          primary: trafficSignal.eastWest,
          secondary: trafficSignal.northSouth
        }}
      />

      {/* Vehicles */}
      {memoizedVehicles.map(vehicle => (
        <Vehicle key={vehicle.id} vehicle={vehicle} />
      ))}

      {/* Obstructions */}
      {memoizedObstructions.map(obstruction => (
        <Obstruction key={obstruction.id} obstruction={obstruction} />
      ))}
      
      {/* Signal timer display */}
      <Text
        position={[0, 25, 0]}
        fontSize={2.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        {`NS: ${trafficSignal.northSouth.toUpperCase()} | EW: ${trafficSignal.eastWest.toUpperCase()}`}
        {'\n'}
        {`Time: ${Math.ceil(trafficSignal.timeRemaining)}s`}
      </Text>

      {/* Visual effects */}
      <CongestionHeatmap vehicles={vehicles} />
      {vehicles.map(vehicle => (
        <group key={`effects-${vehicle.id}`}>
          <EmissionParticles 
            position={[vehicle.position.x, vehicle.position.y, vehicle.position.z]} 
            intensity={vehicle.speed < 5 ? 0.8 : 0.3} 
          />
          <SpeedEffects 
            position={[vehicle.position.x, vehicle.position.y, vehicle.position.z]} 
            velocity={vehicle.speed} 
          />
        </group>
      ))}
      
      {/* Contact shadows for realism */}
      <ContactShadows 
        position={[0, -0.4, 0]} 
        opacity={isDemoMode ? 0.6 : 0.4} 
        scale={100} 
        blur={1} 
        far={100} 
      />
      
      {/* Demo mode overlay */}
      {isDemoMode && (
        <Text
          position={[0, 50, -100]}
          fontSize={8}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          🚀 DEMO MODE ACTIVE
        </Text>
      )}

      {/* Invisible click plane for obstruction placement */}
      <mesh
        onClick={handlePlaceObstruction}
        visible={false}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};