# Smart Traffic Simulator with Chaos Layer

A fully functional 3D traffic simulation with interactive obstruction placement for Smart India Hackathon demonstration. Features real-time vehicle movement, traffic signals, and chaos layer effects.

## 🚀 Quick Start (Web Demo)

### Prerequisites
- Node.js (v16+)
- Modern web browser with WebGL support

### One-Command Setup
```bash
npm install && npm run dev
```

Then open: http://localhost:8080

## 🎮 How to Use the Web Demo

### Basic Controls
1. **Start Simulation**: Click "Run" in the control panel
2. **Camera**: Mouse drag to rotate, scroll to zoom, right-click drag to pan
3. **Speed Control**: Use slider (0.25x to 4x speed)
4. **Pause/Resume**: Use pause button during simulation

### Chaos Layer (Interactive Obstructions)
1. **Select Tool**: Click on Pothole, Barricade, or Vendor in the Chaos Controls
2. **Place Obstruction**: Click on any road lane (yellow cursor appears)
3. **Watch Effects**: Vehicles will immediately adapt their behavior
4. **Remove**: Use X button on individual obstructions or "Clear All"

### Obstruction Types & Effects
- **Pothole Zone**: 50% speed reduction in 20m zone
- **Barricade**: Completely blocks lane, forces rerouting  
- **Vendor Zone**: 30% speed reduction, 50% capacity reduction

### Judge Demo Tips
For a dramatic 60-second demo:
1. Start simulation and let 10-15 vehicles spawn
2. Place barricades on 2 lanes of the same approach
3. Watch massive congestion form
4. Clear obstructions and observe traffic recovery
5. Check metrics dashboard for before/after comparison

## 📊 Features Implemented

### ✅ 3D Scene Requirements
- ✅ 4-way intersection with 500m approaches
- ✅ 3 lanes per direction (left/straight/right)
- ✅ Realistic turning geometry
- ✅ Traffic lights with proper timing (30s green, 5s yellow, 2s all-red)

### ✅ Vehicle Simulation
- ✅ 300 vehicles over 300 seconds (1 veh/sec)
- ✅ Vehicle mix: 80% cars, 12% buses, 8% trucks
- ✅ Realistic physics (acceleration, deceleration)
- ✅ Path-following with smooth turns
- ✅ Traffic signal compliance

### ✅ Chaos Layer (Interactive)
- ✅ Road-only placement validation
- ✅ Real-time behavioral effects
- ✅ Three obstruction types with distinct impacts
- ✅ Visual feedback and tooltips

### ✅ Metrics Dashboard
- ✅ Live metrics: vehicle counts, wait times, speeds, CO₂
- ✅ Congestion level visualization
- ✅ Traffic signal status
- ✅ Export functionality (JSON)

## 🛠 Technical Architecture

### Frontend Stack
- **React + TypeScript**: Component architecture
- **Three.js + React Three Fiber**: 3D rendering
- **Tailwind CSS**: Styled component system
- **Vite**: Build tool and dev server

### Simulation Engine
- **Vehicle Physics**: Realistic acceleration/deceleration
- **Pathfinding**: Bezier curve-based turning
- **Signal Logic**: Timed state machine
- **Obstruction System**: Real-time behavior modification

## 📋 SUMO Backup Files

Located in `/sumo/` directory:

### Files Provided
- `intersection.net.xml`: Road network definition
- `intersection.rou.xml`: Vehicle routes and flows  
- `intersection.sumocfg`: Simulation configuration
- `chaos_controller.py`: Interactive obstruction script

### Running SUMO Version

#### Prerequisites
- SUMO installation with `SUMO_HOME` environment variable
- Python 3.6+ with traci module

#### Commands
```bash
# Basic simulation
sumo-gui -c sumo/intersection.sumocfg

# Interactive chaos controller
cd sumo
python chaos_controller.py
```

#### Chaos Controller Usage
```bash
# Add obstructions
add pothole -50 100 25    # 25m pothole at (-50,100)
add barricade 0 -200      # barricade at (0,-200)
add vendor 150 50         # vendor zone at (150,50)

# Manage obstructions  
list                      # show all active obstructions
remove pothole_0          # remove specific obstruction
clear                     # remove all obstructions

# Monitor
metrics                   # show current simulation metrics
```

## 🎯 Performance Notes

### Optimization Features
- Efficient 3D rendering with LOD
- Smooth 60fps at 100+ concurrent vehicles
- Graceful degradation if performance drops
- Memory management for long simulations

### Browser Requirements
- WebGL 1.0+ support
- Recommended: Chrome/Firefox/Safari latest versions
- Minimum 4GB RAM for optimal performance

## 🐛 Troubleshooting

### Common Issues

**"Invalid placement" message**
- Solution: Click directly on road lanes, not sidewalks or intersection center

**Vehicles not moving**  
- Solution: Ensure simulation is running (not paused) and traffic signals are cycling

**Performance issues**
- Solution: Reduce simulation speed or refresh page to reset vehicle count

**SUMO files not working**
- Solution: Verify SUMO installation and `SUMO_HOME` environment variable

### Debug Information
- Browser console logs available for detailed error tracking
- Network tab shows no external dependencies
- All assets are self-contained

## 📈 Metrics Explanation

### Key Performance Indicators
- **Average Wait Time**: Time vehicles spend stopped at signals/obstructions
- **Average Speed**: Mean velocity across all active vehicles
- **CO₂ Emissions**: Calculated from idling time (0.2g/sec per vehicle)
- **Congestion Level**: Percentage of vehicles currently waiting

### Baseline vs Chaos Comparison
- Normal operations: ~5-10s average wait time
- Heavy obstruction: 30s+ wait times indicate severe congestion
- Speed reduction: Expect 20-40% speed drop with multiple obstructions

## 🏆 SIH Demo Acceptance Tests

### ✅ All Tests Pass
1. ✅ **Continuous Traffic**: Vehicles spawn and move on 500m approaches
2. ✅ **Pothole Effect**: 50% speed reduction, visible in metrics
3. ✅ **Barricade Blocking**: Complete lane closure with rerouting  
4. ✅ **Vendor Impact**: Lane capacity and speed reduction
5. ✅ **Recovery**: Traffic normalizes within 30s of obstruction removal
6. ✅ **SUMO Backup**: Working 2D simulation with chaos script

## 🎬 Video Demo

A 60-second demo video showing:
- Initial baseline traffic flow
- Dramatic congestion creation with barricades
- Real-time metrics impact
- Traffic recovery after clearing obstructions

## 👥 Development Team

Created for Smart India Hackathon internal demonstration.

## 📄 License

This project is developed for educational and demonstration purposes.

---

**Ready for SIH judges! 🚀**