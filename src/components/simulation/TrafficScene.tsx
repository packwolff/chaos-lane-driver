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

// Enhanced realistic vehicle component with detailed 3D models
const Vehicle = ({ vehicle }: { vehicle: any }) => {
  const groupRef = useRef<any>(null);
  const wheelRefs = [useRef<Mesh>(null), useRef<Mesh>(null), useRef<Mesh>(null), useRef<Mesh>(null)];
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.copy(vehicle.position);
      groupRef.current.rotation.y = vehicle.rotation;
      
      // Animate wheels based on speed
      const wheelRotation = vehicle.speed * delta * 2;
      wheelRefs.forEach(wheelRef => {
        if (wheelRef.current) {
          wheelRef.current.rotation.x += wheelRotation;
        }
      });
    }
  });

  const VehicleBody = () => {
    switch (vehicle.type) {
      case "car":
        return (
          <group>
            {/* Main body */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[1.8, 0.8, 4.2]} />
              <meshPhysicalMaterial 
                color="#2E86AB" 
                metalness={0.8} 
                roughness={0.2}
                clearcoat={1}
                clearcoatRoughness={0.1}
              />
            </mesh>
            
            {/* Hood */}
            <mesh position={[0, 0.6, 1.8]} castShadow>
              <boxGeometry args={[1.6, 0.4, 1]} />
              <meshPhysicalMaterial 
                color="#2E86AB" 
                metalness={0.8} 
                roughness={0.2}
                clearcoat={1}
              />
            </mesh>
            
            {/* Windshield */}
            <mesh position={[0, 1.1, 0.5]} castShadow>
              <boxGeometry args={[1.6, 0.8, 2]} />
              <meshPhysicalMaterial 
                color="#87CEEB" 
                transmission={0.9}
                opacity={0.3}
                transparent
                roughness={0}
                metalness={0}
              />
            </mesh>
            
            {/* Headlights */}
            <mesh position={[0.6, 0.4, 2.2]}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[-0.6, 0.4, 2.2]}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
            
            {/* Taillights */}
            <mesh position={[0.6, 0.4, -2.2]}>
              <sphereGeometry args={[0.15]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[-0.6, 0.4, -2.2]}>
              <sphereGeometry args={[0.15]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
        
      case "bus":
        return (
          <group>
            {/* Main body */}
            <mesh position={[0, 1.2, 0]} castShadow>
              <boxGeometry args={[2.4, 2, 12]} />
              <meshPhysicalMaterial 
                color="#F5A623" 
                metalness={0.6} 
                roughness={0.3}
              />
            </mesh>
            
            {/* Windows */}
            <mesh position={[0, 1.8, 2]} castShadow>
              <boxGeometry args={[2.2, 0.8, 8]} />
              <meshPhysicalMaterial 
                color="#87CEEB" 
                transmission={0.8}
                opacity={0.4}
                transparent
              />
            </mesh>
            
            {/* Front */}
            <mesh position={[0, 1, 6.2]} castShadow>
              <boxGeometry args={[2.2, 1.5, 0.4]} />
              <meshPhysicalMaterial color="#F5A623" metalness={0.6} roughness={0.3} />
            </mesh>
            
            {/* Headlights */}
            <mesh position={[0.8, 0.8, 6.4]}>
              <cylinderGeometry args={[0.3, 0.3, 0.2]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-0.8, 0.8, 6.4]}>
              <cylinderGeometry args={[0.3, 0.3, 0.2]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
            </mesh>
          </group>
        );
        
      case "truck":
        return (
          <group>
            {/* Cab */}
            <mesh position={[0, 1.2, 2.5]} castShadow>
              <boxGeometry args={[2.4, 2, 3]} />
              <meshPhysicalMaterial 
                color="#D0021B" 
                metalness={0.7} 
                roughness={0.2}
              />
            </mesh>
            
            {/* Trailer */}
            <mesh position={[0, 1.5, -2]} castShadow>
              <boxGeometry args={[2.4, 2.5, 8]} />
              <meshPhysicalMaterial 
                color="#34495E" 
                metalness={0.4} 
                roughness={0.6}
              />
            </mesh>
            
            {/* Cab windshield */}
            <mesh position={[0, 1.8, 3.8]} castShadow>
              <boxGeometry args={[2.2, 1, 0.2]} />
              <meshPhysicalMaterial 
                color="#87CEEB" 
                transmission={0.8}
                opacity={0.4}
                transparent
              />
            </mesh>
            
            {/* Headlights */}
            <mesh position={[0.8, 0.8, 4.1]}>
              <cylinderGeometry args={[0.25, 0.25, 0.2]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[-0.8, 0.8, 4.1]}>
              <cylinderGeometry args={[0.25, 0.25, 0.2]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
            </mesh>
          </group>
        );
        
      default:
        return <VehicleBody />;
    }
  };

  const wheelPositions = useMemo(() => {
    switch (vehicle.type) {
      case "car": return [
        [0.9, 0, 1.5], [-0.9, 0, 1.5],
        [0.9, 0, -1.5], [-0.9, 0, -1.5]
      ];
      case "bus": return [
        [1.2, 0, 4], [-1.2, 0, 4],
        [1.2, 0, -4], [-1.2, 0, -4]
      ];
      case "truck": return [
        [1.2, 0, 3], [-1.2, 0, 3],
        [1.2, 0, -1], [-1.2, 0, -1],
        [1.2, 0, -3], [-1.2, 0, -3]
      ];
      default: return [[0.9, 0, 1.5], [-0.9, 0, 1.5], [0.9, 0, -1.5], [-0.9, 0, -1.5]];
    }
  }, [vehicle.type]);

  const wheelSize = vehicle.type === "truck" ? 0.6 : vehicle.type === "bus" ? 0.5 : 0.4;

  return (
    <group ref={groupRef} position={vehicle.position}>
      <VehicleBody />
      
      {/* Wheels */}
      {wheelPositions.map((pos, index) => (
        <mesh 
          key={index}
          ref={wheelRefs[index] || useRef<Mesh>(null)} 
          position={pos as [number, number, number]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[wheelSize, wheelSize, 0.3]} />
          <meshPhysicalMaterial color="#1a1a1a" roughness={0.8} metalness={0.1} />
        </mesh>
      ))}
      
      {/* Rim details */}
      {wheelPositions.map((pos, index) => (
        <mesh 
          key={`rim-${index}`}
          position={pos as [number, number, number]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[wheelSize * 0.6, wheelSize * 0.6, 0.31]} />
          <meshPhysicalMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
        </mesh>
      ))}
      
      {/* Enhanced status indicator */}
      {vehicle.isWaiting && (
        <group>
          <mesh position={[0, 3, 0]}>
            <sphereGeometry args={[0.4]} />
            <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, 3.8, 0]}>
            <coneGeometry args={[0.2, 0.6]} />
            <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}
      
      {/* Speed indicator particles for fast vehicles */}
      {vehicle.speed > 0.5 && (
        <group>
          <mesh position={[-2, 0.5, 0]}>
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
          </mesh>
          <mesh position={[-2.5, 0.3, 0]}>
            <sphereGeometry args={[0.08]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
          </mesh>
        </group>
      )}
    </group>
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