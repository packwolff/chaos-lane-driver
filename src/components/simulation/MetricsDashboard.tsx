import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEnhancedSimulation } from "./EnhancedSimulationContext";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  Clock, 
  Gauge, 
  Leaf, 
  TrendingUp, 
  Users 
} from "lucide-react";

export const MetricsDashboard = () => {
  const { metrics, exportMetrics, baselineMetrics, trafficSignal } = useEnhancedSimulation();

  const getMetricColor = (value: number, thresholds: { good: number, warning: number }) => {
    if (value <= thresholds.good) return "metric-success";
    if (value <= thresholds.warning) return "metric-warning";
    return "metric-danger";
  };

  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(1)} m/s`;
  };

  const formatCO2 = (kg: number) => {
    return kg < 1 ? `${(kg * 1000).toFixed(0)}g` : `${kg.toFixed(2)}kg`;
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Live Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle counts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded bg-muted">
              <Users className="w-6 h-6 mx-auto mb-1 text-primary" />
              <div className="text-2xl font-bold text-foreground">
                {metrics.totalVehicles}
              </div>
              <div className="text-xs text-muted-foreground">Total Spawned</div>
            </div>
            <div className="text-center p-3 rounded bg-muted">
              <Car className="w-6 h-6 mx-auto mb-1 text-primary" />
              <div className="text-2xl font-bold text-foreground">
                {metrics.activeVehicles}
              </div>
              <div className="text-xs text-muted-foreground">Active Now</div>
            </div>
          </div>

          {/* Performance metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-foreground">Avg Wait Time</span>
              </div>
              <Badge 
                variant={metrics.averageWaitTime > 30 ? "destructive" : 
                       metrics.averageWaitTime > 15 ? "secondary" : "default"}
              >
                {formatTime(metrics.averageWaitTime)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Gauge className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-foreground">Avg Speed</span>
              </div>
              <Badge 
                variant={metrics.averageSpeed < 5 ? "destructive" : 
                       metrics.averageSpeed < 10 ? "secondary" : "default"}
              >
                {formatSpeed(metrics.averageSpeed)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Leaf className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-foreground">CO₂ Emissions</span>
              </div>
              <Badge variant="outline">
                {formatCO2(metrics.co2Emissions)}
              </Badge>
            </div>
          </div>

          {/* Congestion level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Congestion Level</span>
              <span className="text-sm font-medium text-foreground">
                {Math.round(metrics.congestionLevel)}%
              </span>
            </div>
            <Progress 
              value={metrics.congestionLevel} 
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Traffic signals status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-foreground">Signal Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">North-South</span>
            <Badge 
              variant={trafficSignal.northSouth === "green" ? "default" : 
                     trafficSignal.northSouth === "yellow" ? "secondary" : "destructive"}
            >
              {trafficSignal.northSouth.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">East-West</span>
            <Badge 
              variant={trafficSignal.eastWest === "green" ? "default" : 
                     trafficSignal.eastWest === "yellow" ? "secondary" : "destructive"}
            >
              {trafficSignal.eastWest.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Time Remaining</span>
            <span className="text-sm font-mono text-foreground">
              {Math.ceil(trafficSignal.timeRemaining)}s
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-foreground">Legend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-vehicle-primary rounded"></div>
            <span className="text-muted-foreground">Cars (80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-vehicle-secondary rounded"></div>
            <span className="text-muted-foreground">Buses (12%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-vehicle-truck rounded"></div>
            <span className="text-muted-foreground">Trucks (8%)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};