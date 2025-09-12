import React from "react";
import { Vector3 } from "three";

interface RoundaboutGeometryProps {
  radius: number;
  position?: [number, number, number];
}

export const RoundaboutGeometry: React.FC<RoundaboutGeometryProps> = ({ 
  radius = 20, 
  position = [0, 0, 0] 
}) => {
  return (
    <group position={position}>
      {/* Central island */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[radius - 3, radius - 3, 0.1, 32]} />
        <meshLambertMaterial color="#4a5d4a" />
      </mesh>
      
      {/* Roundabout road surface */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[radius + 3, radius + 3, 0.2, 32]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
      
      {/* Inner edge marking */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[radius - 2.8, radius - 2.8, 0.05, 32]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      
      {/* Outer edge marking */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[radius + 2.8, radius + 2.8, 0.05, 32]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      
      {/* Lane divider (middle of roundabout road) */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[radius, radius, 0.05, 32]} />
        <meshLambertMaterial color="#ffff00" opacity={0.8} transparent />
      </mesh>
      
      {/* Entry/exit arrows - North */}
      <mesh position={[0, 0.02, radius + 8]}>
        <coneGeometry args={[1, 2, 3]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      
      {/* Entry/exit arrows - South */}
      <mesh position={[0, 0.02, -radius - 8]} rotation={[0, Math.PI, 0]}>
        <coneGeometry args={[1, 2, 3]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      
      {/* Entry/exit arrows - East */}
      <mesh position={[radius + 8, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
        <coneGeometry args={[1, 2, 3]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      
      {/* Entry/exit arrows - West */}
      <mesh position={[-radius - 8, 0.02, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <coneGeometry args={[1, 2, 3]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};