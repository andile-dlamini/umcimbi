import { useState, useEffect } from 'react';
import { Users, Store, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalUsers: number;
  totalVendors: number;
  totalEvents: number;
  eventsByType: { umembeso: number; umabo: number };
  vendorsByCategory: Record<string, number>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalVendors: 0,
    totalEvents: 0,
    eventsByType: { umembeso: 0, umabo: 0 },
    vendorsByCategory: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch profiles count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch vendors count
      const { count: vendorsCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Fetch events by type
      const { data: events } = await supabase
        .from('events')
        .select('type');

      const eventsByType = { umembeso: 0, umabo: 0 };
      events?.forEach(e => {
        if (e.type === 'umembeso') eventsByType.umembeso++;
        else if (e.type === 'umabo') eventsByType.umabo++;
      });

      // Fetch vendors by category
      const { data: vendors } = await supabase
        .from('vendors')
        .select('category')
        .eq('is_active', true);

      const vendorsByCategory: Record<string, number> = {};
      vendors?.forEach(v => {
        vendorsByCategory[v.category] = (vendorsByCategory[v.category] || 0) + 1;
      });

      setStats({
        totalUsers: usersCount || 0,
        totalVendors: vendorsCount || 0,
        totalEvents: eventsCount || 0,
        eventsByType,
        vendorsByCategory,
      });
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const categoryLabels: Record<string, string> = {
    decor: 'Decor',
    catering: 'Catering',
    livestock: 'Livestock',
    tents: 'Tents',
    transport: 'Transport',
    attire: 'Attire',
    photographer: 'Photography',
    other: 'Other',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform metrics at a glance</p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading stats...</p>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Store className="h-6 w-6 mx-auto text-secondary mb-2" />
                  <p className="text-2xl font-bold">{stats.totalVendors}</p>
                  <p className="text-xs text-muted-foreground">Vendors</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto text-accent mb-2" />
                  <p className="text-2xl font-bold">{stats.totalEvents}</p>
                  <p className="text-xs text-muted-foreground">Events</p>
                </CardContent>
              </Card>
            </div>

            {/* Events by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Events by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Umembeso</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary rounded-full"
                          style={{ 
                            width: `${stats.totalEvents > 0 ? (stats.eventsByType.umembeso / stats.totalEvents) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{stats.eventsByType.umembeso}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Umabo</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent rounded-full"
                          style={{ 
                            width: `${stats.totalEvents > 0 ? (stats.eventsByType.umabo / stats.totalEvents) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{stats.eventsByType.umabo}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendors by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Vendors by Category
                </CardTitle>
                <CardDescription>
                  Distribution of service providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.vendorsByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center py-1">
                        <span className="text-sm">{categoryLabels[category] || category}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  {Object.keys(stats.vendorsByCategory).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No vendors registered yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
