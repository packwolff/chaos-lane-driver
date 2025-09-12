#!/usr/bin/env python3
"""
SUMO Chaos Controller - Interactive obstruction placement script
Implements chaos layer effects in SUMO simulation matching web demo behavior
"""

import os
import sys
import json
import time
import threading
from typing import Dict, List, Tuple

# Check SUMO installation
if 'SUMO_HOME' in os.environ:
    tools = os.path.join(os.environ['SUMO_HOME'], 'tools')
    sys.path.append(tools)
else:
    sys.exit("Please declare environment variable 'SUMO_HOME'")

import traci
import sumolib

class ChaosController:
    def __init__(self, sumo_cfg_file: str = "intersection.sumocfg"):
        self.sumo_cfg = sumo_cfg_file
        self.obstructions = {}
        self.running = False
        
        # Define obstruction effects
        self.obstruction_effects = {
            "pothole": {"speed_reduction": 0.5, "capacity_reduction": 0.0, "blocked": False},
            "barricade": {"speed_reduction": 0.0, "capacity_reduction": 0.0, "blocked": True},
            "vendor": {"speed_reduction": 0.3, "capacity_reduction": 0.5, "blocked": False}
        }
        
        # Edge mapping for coordinate system
        self.edges = {
            "north_approach": {"lanes": ["north_approach_0", "north_approach_1", "north_approach_2"]},
            "south_approach": {"lanes": ["south_approach_0", "south_approach_1", "south_approach_2"]},
            "east_approach": {"lanes": ["east_approach_0", "east_approach_1", "east_approach_2"]},
            "west_approach": {"lanes": ["west_approach_0", "west_approach_1", "west_approach_2"]}
        }

    def start_sumo(self, gui: bool = True):
        """Start SUMO simulation"""
        sumo_binary = sumolib.checkBinary('sumo-gui' if gui else 'sumo')
        sumo_cmd = [sumo_binary, "-c", self.sumo_cfg, "--start"]
        
        traci.start(sumo_cmd)
        self.running = True
        print("SUMO simulation started")
        
    def stop_sumo(self):
        """Stop SUMO simulation"""
        if self.running:
            traci.close()
            self.running = False
            print("SUMO simulation stopped")

    def get_lane_from_position(self, x: float, y: float) -> Tuple[str, str]:
        """Convert x,y coordinates to lane and edge"""
        # Map web demo coordinates to SUMO edges
        # Web demo: intersection at (0,0), 500m roads in each direction
        
        if abs(x) < 10:  # North-South road
            if y > 15:  # North approach
                lane_idx = 0 if x < -3.25 else 1 if x < 0 else 2
                return "north_approach", f"north_approach_{lane_idx}"
            elif y < -15:  # South approach  
                lane_idx = 0 if x > 3.25 else 1 if x > 0 else 2
                return "south_approach", f"south_approach_{lane_idx}"
        elif abs(y) < 10:  # East-West road
            if x > 15:  # East approach
                lane_idx = 0 if y > 3.25 else 1 if y > 0 else 2
                return "east_approach", f"east_approach_{lane_idx}"
            elif x < -15:  # West approach
                lane_idx = 0 if y < -3.25 else 1 if y < 0 else 2
                return "west_approach", f"west_approach_{lane_idx}"
                
        return None, None

    def add_obstruction(self, obs_type: str, x: float, y: float, length: float = 20.0) -> str:
        """Add obstruction at specified coordinates"""
        if not self.running:
            print("Error: SUMO not running")
            return None
            
        edge, lane = self.get_lane_from_position(x, y)
        if not edge or not lane:
            print(f"Error: Position ({x}, {y}) is not on a valid road lane")
            return None
            
        obs_id = f"{obs_type}_{len(self.obstructions)}"
        effects = self.obstruction_effects.get(obs_type, {})
        
        obstruction = {
            "id": obs_id,
            "type": obs_type,
            "edge": edge,
            "lane": lane,
            "position": (x, y),
            "length": length,
            "effects": effects,
            "active": True
        }
        
        # Apply effects based on obstruction type
        if obs_type == "pothole":
            # Reduce max speed on affected lane
            current_speed = traci.lane.getMaxSpeed(lane)
            new_speed = current_speed * (1 - effects["speed_reduction"])
            traci.lane.setMaxSpeed(lane, new_speed)
            print(f"Pothole placed on {lane}: Speed reduced to {new_speed:.1f} m/s")
            
        elif obs_type == "barricade":
            # Block the lane completely
            traci.lane.setAllowed(lane, [])  # No vehicles allowed
            print(f"Barricade placed on {lane}: Lane blocked")
            
        elif obs_type == "vendor":
            # Reduce speed and capacity
            current_speed = traci.lane.getMaxSpeed(lane)
            new_speed = current_speed * (1 - effects["speed_reduction"])
            traci.lane.setMaxSpeed(lane, new_speed)
            # Note: Capacity reduction in SUMO would require more complex implementation
            print(f"Vendor zone placed on {lane}: Speed reduced to {new_speed:.1f} m/s")
        
        self.obstructions[obs_id] = obstruction
        return obs_id

    def remove_obstruction(self, obs_id: str):
        """Remove obstruction by ID"""
        if obs_id not in self.obstructions:
            print(f"Error: Obstruction {obs_id} not found")
            return False
            
        obstruction = self.obstructions[obs_id]
        lane = obstruction["lane"]
        
        # Restore lane to normal state
        if obstruction["type"] == "pothole" or obstruction["type"] == "vendor":
            # Restore original speed (assuming 15 m/s default)
            traci.lane.setMaxSpeed(lane, 15.0)
        elif obstruction["type"] == "barricade":
            # Re-allow all vehicle types
            traci.lane.setAllowed(lane, ["passenger", "bus", "truck"])
            
        del self.obstructions[obs_id]
        print(f"Removed obstruction {obs_id} from {lane}")
        return True

    def clear_all_obstructions(self):
        """Remove all obstructions"""
        obs_ids = list(self.obstructions.keys())
        for obs_id in obs_ids:
            self.remove_obstruction(obs_id)
        print("All obstructions cleared")

    def get_simulation_metrics(self) -> Dict:
        """Get current simulation metrics"""
        if not self.running:
            return {}
            
        vehicle_ids = traci.vehicle.getIDList()
        total_vehicles = len(vehicle_ids)
        
        if total_vehicles == 0:
            return {
                "total_vehicles": 0,
                "active_vehicles": 0,
                "average_speed": 0,
                "average_wait_time": 0,
                "co2_emissions": 0
            }
        
        speeds = [traci.vehicle.getSpeed(vid) for vid in vehicle_ids]
        wait_times = [traci.vehicle.getAccumulatedWaitingTime(vid) for vid in vehicle_ids]
        co2_emissions = [traci.vehicle.getCO2Emission(vid) for vid in vehicle_ids]
        
        return {
            "total_vehicles": total_vehicles,
            "active_vehicles": total_vehicles,
            "average_speed": sum(speeds) / len(speeds) if speeds else 0,
            "average_wait_time": sum(wait_times) / len(wait_times) if wait_times else 0,
            "co2_emissions": sum(co2_emissions) / 1000  # Convert to kg
        }

    def interactive_mode(self):
        """Interactive command-line interface"""
        print("\n=== SUMO Traffic Simulator Chaos Controller ===")
        print("Commands:")
        print("  add <type> <x> <y> [length] - Add obstruction (pothole/barricade/vendor)")
        print("  remove <id>                 - Remove obstruction by ID")
        print("  clear                       - Clear all obstructions")  
        print("  list                        - List active obstructions")
        print("  metrics                     - Show current metrics")
        print("  quit                        - Exit")
        print("\nExample: add pothole -50 100 25")
        print("         add barricade 0 -200")
        
        while self.running:
            try:
                cmd = input("\nChaos> ").strip().split()
                if not cmd:
                    continue
                    
                if cmd[0] == "quit":
                    break
                elif cmd[0] == "add" and len(cmd) >= 4:
                    obs_type = cmd[1]
                    x, y = float(cmd[2]), float(cmd[3])
                    length = float(cmd[4]) if len(cmd) > 4 else 20.0
                    obs_id = self.add_obstruction(obs_type, x, y, length)
                    if obs_id:
                        print(f"Added {obs_type} with ID: {obs_id}")
                elif cmd[0] == "remove" and len(cmd) >= 2:
                    self.remove_obstruction(cmd[1])
                elif cmd[0] == "clear":
                    self.clear_all_obstructions()
                elif cmd[0] == "list":
                    if not self.obstructions:
                        print("No active obstructions")
                    else:
                        for obs_id, obs in self.obstructions.items():
                            print(f"{obs_id}: {obs['type']} on {obs['lane']} at {obs['position']}")
                elif cmd[0] == "metrics":
                    metrics = self.get_simulation_metrics()
                    print(f"Metrics: {json.dumps(metrics, indent=2)}")
                else:
                    print("Invalid command. Type 'quit' to exit.")
                    
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error: {e}")

def main():
    controller = ChaosController()
    
    try:
        # Start SUMO with GUI
        controller.start_sumo(gui=True)
        
        # Wait a moment for SUMO to initialize
        time.sleep(2)
        
        # Start interactive mode
        controller.interactive_mode()
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        controller.stop_sumo()
        print("Simulation ended")

if __name__ == "__main__":
    main()