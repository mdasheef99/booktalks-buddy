import React, { useState, useEffect } from 'react';
import { 
  getEntitlementsCacheStats, 
  getCachedUserIds, 
  clearEntitlementsCache,
  resetEntitlementsCacheStats,
  configureEntitlementsCache
} from '@/lib/entitlements/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

/**
 * Debug component for monitoring entitlements cache performance
 * 
 * This component is only meant to be used in development mode.
 */
const EntitlementsCacheDebug: React.FC = () => {
  const [stats, setStats] = useState(getEntitlementsCacheStats());
  const [cachedUsers, setCachedUsers] = useState(getCachedUserIds());
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [expiration, setExpiration] = useState(5 * 60 * 1000); // 5 minutes in ms
  const [debug, setDebug] = useState(false);

  // Auto-refresh stats
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setStats(getEntitlementsCacheStats());
      setCachedUsers(getCachedUserIds());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval]);

  // Manual refresh
  const handleRefresh = () => {
    setStats(getEntitlementsCacheStats());
    setCachedUsers(getCachedUserIds());
    toast.success('Cache statistics refreshed');
  };

  // Clear cache
  const handleClearCache = () => {
    clearEntitlementsCache();
    setStats(getEntitlementsCacheStats());
    setCachedUsers(getCachedUserIds());
    toast.success('Cache cleared');
  };

  // Reset stats
  const handleResetStats = () => {
    resetEntitlementsCacheStats();
    setStats(getEntitlementsCacheStats());
    toast.success('Statistics reset');
  };

  // Update cache configuration
  const handleUpdateConfig = () => {
    configureEntitlementsCache({
      EXPIRATION: expiration,
      DEBUG: debug
    });
    toast.success('Cache configuration updated');
  };

  // Calculate hit rate
  const totalRequests = stats.hits + stats.misses;
  const hitRate = totalRequests > 0 ? (stats.hits / totalRequests) * 100 : 0;

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Entitlements Cache Debug
          <Badge variant={hitRate > 80 ? "success" : hitRate > 50 ? "warning" : "destructive"}>
            {hitRate.toFixed(1)}% Hit Rate
          </Badge>
        </CardTitle>
        <CardDescription>
          Monitor and manage the entitlements caching system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{stats.hits}</div>
            <div className="text-sm text-muted-foreground">Cache Hits</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.misses}</div>
            <div className="text-sm text-muted-foreground">Cache Misses</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.errors}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Cached Users ({cachedUsers.length})</h3>
          <div className="max-h-24 overflow-y-auto text-xs bg-muted p-2 rounded">
            {cachedUsers.length > 0 ? (
              cachedUsers.map((userId) => (
                <div key={userId} className="mb-1 truncate">
                  {userId}
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">No cached users</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
            <Switch
              id="auto-refresh"
              checked={isAutoRefresh}
              onCheckedChange={setIsAutoRefresh}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="refresh-interval" className="w-40">Refresh Interval (ms)</Label>
            <Input
              id="refresh-interval"
              type="number"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              min={500}
              max={10000}
              step={500}
              disabled={!isAutoRefresh}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="expiration" className="w-40">Cache Expiration (ms)</Label>
            <Input
              id="expiration"
              type="number"
              value={expiration}
              onChange={(e) => setExpiration(Number(e.target.value))}
              min={10000}
              max={3600000}
              step={10000}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="debug">Debug Logging</Label>
            <Switch
              id="debug"
              checked={debug}
              onCheckedChange={setDebug}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetStats}>
            Reset Stats
          </Button>
        </div>
        <div className="space-x-2">
          <Button variant="default" size="sm" onClick={handleUpdateConfig}>
            Update Config
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearCache}>
            Clear Cache
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EntitlementsCacheDebug;
