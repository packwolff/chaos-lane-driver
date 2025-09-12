import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, Vector3, Color, Raycaster, Vector2 } from "three";
import { useEnhancedSimulation } from "./EnhancedSimulationContext";
import { Text, Environment, ContactShadows, Plane } from "@react-three/drei";
import { RoundaboutGeometry } from "./RoundaboutGeometry";

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

      {/* Sidewalks */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1000, 0.1, 1000]} />
        <meshLambertMaterial color="#606060" />
      </mesh>
    </group>
  );
};

// Traffic light component
const TrafficLight = ({ position, signals }: { 
  position: [number, number, number], 
  signals: { primary: string, secondary: string } 
}) => {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 10]} />
        <meshLambertMaterial color="#333333" />
      </mesh>
      
      {/* Signal box */}
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[1.5, 3, 1]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Primary signal lights */}
      <mesh position={[0, 9, 0.6]}>
        <sphereGeometry args={[0.3]} />
        <meshLambertMaterial 
          color={signals.primary === "red" ? "#ff0000" : "#330000"}
          emissive={signals.primary === "red" ? new Color("#ff0000").multiplyScalar(0.5) : new Color("#000000")}
        />
      </mesh>
      <mesh position={[0, 8, 0.6]}>
        <sphereGeometry args={[0.3]} />
        <meshLambertMaterial 
          color={signals.primary === "yellow" ? "#ffff00" : "#333300"}
          emissive={signals.primary === "yellow" ? new Color("#ffff00").multiplyScalar(0.5) : new Color("#000000")}
        />
      </mesh>
      <mesh position={[0, 7, 0.6]}>
        <sphereGeometry args={[0.3]} />
        <meshLambertMaterial 
          color={signals.primary === "green" ? "#00ff00" : "#003300"}
          emissive={signals.primary === "green" ? new Color("#00ff00").multiplyScalar(0.5) : new Color("#000000")}
        />
      </mesh>
    </group>
  );
};

// Vehicle component
const Vehicle = ({ vehicle }: { vehicle: any }) => {
  const meshRef = useRef<Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(vehicle.position);
      meshRef.current.rotation.y = vehicle.rotation;
    }
  });

  const vehicleColor = useMemo(() => {
    switch (vehicle.type) {
      case "car": return "#4a90e2";
      case "bus": return "#f5a623";
      case "truck": return "#d0021b";
      default: return "#4a90e2";
    }
  }, [vehicle.type]);

  const vehicleSize: [number, number, number] = useMemo(() => {
    switch (vehicle.type) {
      case "car": return [2, 1, 4];
      case "bus": return [2.5, 2, 12];
      case "truck": return [2.5, 2.5, 8];
      default: return [2, 1, 4];
    }
  }, [vehicle.type]);

  return (
    <mesh ref={meshRef} position={vehicle.position}>
      <boxGeometry args={vehicleSize} />
      <meshLambertMaterial color={vehicleColor} />
      
      {/* Vehicle status indicator */}
      {vehicle.isWaiting && (
        <mesh position={[0, vehicleSize[1] + 0.5, 0]}>
          <sphereGeometry args={[0.3]} />
          <meshLambertMaterial color="#ff0000" emissive="#330000" />
        </mesh>
      )}
    </mesh>
  );
};

// Obstruction component
const Obstruction = ({ obstruction }: { obstruction: any }) => {
  const color = useMemo(() => {
    switch (obstruction.type) {
      case "pothole": return "#8B4513";
      case "barricade": return "#ff6600";
      case "vendor": return "#9966cc";
      default: return "#666666";
    }
  }, [obstruction.type]);

  const geometry: [number, number, number] = useMemo(() => {
    switch (obstruction.type) {
      case "pothole": return [obstruction.size.x, 0.1, obstruction.size.z];
      case "barricade": return [2, 1.5, 0.5];
      case "vendor": return [3, 1, 2];
      default: return [1, 1, 1];
    }
  }, [obstruction.type, obstruction.size]);

  return (
    <group position={obstruction.position}>
      <mesh>
        <boxGeometry args={geometry} />
        <meshLambertMaterial color={color} />
      </mesh>
      
      {/* Label */}
      <Text
        position={[0, geometry[1] + 1, 0]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {obstruction.type.toUpperCase()}
      </Text>
    </group>
  );
};

export const TrafficScene = () => {
  const { 
    vehicles, 
    obstructions, 
    trafficSignal, 
    selectedTool, 
    placeObstructionAtPosition,
    isRoundabout
  } = useEnhancedSimulation();
  const { camera, scene, gl } = useThree();

  // Handle click events for obstruction placement
  const handleClick = (event: any) => {
    if (!selectedTool) return;

    // Get mouse coordinates
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to find intersection point
    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersection with ground plane
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      placeObstructionAtPosition(point.x, point.z);
    }
  };

  return (
    <group onClick={handleClick}>
      {/* Enhanced Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[100, 100, 50]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={1000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
        shadow-bias={-0.0001}
      />
      
      {/* Additional soft lighting */}
      <directionalLight 
        position={[-50, 80, -50]} 
        intensity={0.3} 
        color="#e6f3ff"
      />
      
      {/* Environment and atmosphere */}
      <Environment preset="city" />
      <fog attach="fog" args={["#87CEEB", 400, 1200]} />
      
      {/* Enhanced ground with contact shadows */}
      <Plane 
        args={[2000, 2000]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.2, 0]} 
        receiveShadow
      >
        <meshStandardMaterial 
          color="#2d5a2d" 
          roughness={0.8}
          metalness={0.1}
        />
      </Plane>
      
      <ContactShadows 
        position={[0, -0.1, 0]} 
        opacity={0.4} 
        scale={500} 
        blur={1.5} 
        far={100} 
      />
      
      {/* Road intersection or roundabout */}
      {isRoundabout ? <RoundaboutGeometry radius={20} /> : <RoadIntersection />}
      
      {/* Enhanced Traffic lights - only for non-roundabout */}
      {!isRoundabout && (
        <>
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
              primary: trafficSignal.northSouth,
              secondary: trafficSignal.eastWest
            }}
          />
          <TrafficLight 
            position={[-15, 0, 15]} 
            signals={{
              primary: trafficSignal.eastWest,
              secondary: trafficSignal.northSouth
            }}
          />
          <TrafficLight 
            position={[15, 0, -15]} 
            signals={{
              primary: trafficSignal.eastWest,
              secondary: trafficSignal.northSouth
            }}
          />
        </>
      )}
      
      {/* Vehicles */}
      {vehicles.map(vehicle => (
        <Vehicle key={vehicle.id} vehicle={vehicle} />
      ))}
      
      {/* Obstructions */}
      {obstructions.map(obstruction => (
        <Obstruction key={obstruction.id} obstruction={obstruction} />
      ))}
      
      {/* Signal timer display - only for non-roundabout */}
      {!isRoundabout && (
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
      )}
      
      {/* Enhanced placement indicator */}
      {selectedTool && (
        <group>
          <Text
            position={[0, -20, 0]}
            fontSize={2}
            color="#00ff00"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#003300"
          >
            Click on road to place {selectedTool.toUpperCase()}
          </Text>
          
          {/* Animated placement cursor */}
          <mesh position={[0, -18, 0]}>
            <ringGeometry args={[2, 2.5, 8]} />
            <meshBasicMaterial color="#00ff00" transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
};