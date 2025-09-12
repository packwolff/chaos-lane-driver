import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Particle system for traffic emissions
export const EmissionParticles = ({ position, intensity = 1 }: { position: [number, number, number], intensity?: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = Math.floor(intensity * 50);
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position[0] + (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = position[1] + Math.random() * 5;
      positions[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [position, particleCount]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.01;
      const time = state.clock.elapsedTime;
      const positionAttribute = pointsRef.current.geometry.attributes.position;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positionAttribute.array[i3 + 1] += Math.sin(time + i) * 0.01;
      }
      positionAttribute.needsUpdate = true;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ff6b35"
        size={0.3}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};

// Speed effect particles for fast-moving vehicles
export const SpeedEffects = ({ position, velocity }: { position: [number, number, number], velocity: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  if (velocity < 5) return null; // Only show for fast vehicles
  
  const particleCount = Math.floor(velocity * 2);
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position[0] + (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = position[1] + Math.random() * 0.5;
      positions[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 2;
    }
    return positions;
  }, [position, particleCount]);

  useFrame(() => {
    if (pointsRef.current) {
      const positionAttribute = pointsRef.current.geometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positionAttribute.array[i3] -= velocity * 0.1;
        if (positionAttribute.array[i3] < position[0] - 5) {
          positionAttribute.array[i3] = position[0] + 2;
        }
      }
      positionAttribute.needsUpdate = true;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#4fc3f7"
        size={0.1}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
};

// Congestion heat visualization
export const CongestionHeatmap = ({ vehicles }: { vehicles: any[] }) => {
  const heatPoints = useMemo(() => {
    const points: { position: [number, number, number], intensity: number }[] = [];
    
    // Group vehicles by proximity to create heat zones
    const zones = new Map<string, { count: number, avgPosition: [number, number, number] }>();
    
    vehicles.forEach(vehicle => {
      const zoneKey = `${Math.floor(vehicle.position.x / 20)}_${Math.floor(vehicle.position.z / 20)}`;
      if (!zones.has(zoneKey)) {
        zones.set(zoneKey, { count: 0, avgPosition: [0, 0, 0] });
      }
      const zone = zones.get(zoneKey)!;
      zone.count++;
      zone.avgPosition[0] += vehicle.position.x;
      zone.avgPosition[2] += vehicle.position.z;
    });

    zones.forEach((zone, key) => {
      if (zone.count > 3) { // Only show congested areas
        points.push({
          position: [
            zone.avgPosition[0] / zone.count,
            1,
            zone.avgPosition[2] / zone.count
          ],
          intensity: Math.min(zone.count / 10, 1)
        });
      }
    });

    return points;
  }, [vehicles]);

  return (
    <>
      {heatPoints.map((point, index) => (
        <mesh key={index} position={point.position}>
          <sphereGeometry args={[5 * point.intensity, 16, 16]} />
          <meshBasicMaterial 
            color="#ff4444" 
            transparent 
            opacity={0.2 * point.intensity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
};

// Dynamic lighting based on time of day
export const DynamicLighting = ({ timeOfDay = 12 }: { timeOfDay?: number }) => {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame(() => {
    if (lightRef.current) {
      const intensity = Math.max(0.3, Math.sin((timeOfDay / 24) * Math.PI * 2));
      lightRef.current.intensity = intensity;
      
      // Change color based on time
      const color = new THREE.Color();
      if (timeOfDay < 6 || timeOfDay > 20) {
        color.setHSL(0.6, 0.3, 0.5); // Night - blue
      } else if (timeOfDay < 8 || timeOfDay > 18) {
        color.setHSL(0.1, 0.8, 0.7); // Dawn/dusk - orange
      } else {
        color.setHSL(0.15, 0.1, 1); // Day - white
      }
      lightRef.current.color = color;
    }
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[100, 100, 50]}
      intensity={1}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-far={500}
      shadow-camera-left={-200}
      shadow-camera-right={200}
      shadow-camera-top={200}
      shadow-camera-bottom={-200}
    />
  );
};