
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { DashboardService, DashboardStats as StatsType } from "@/services/dashboardService";

export const DashboardStats = () => {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await DashboardService.getDashboardStats();
        if (mounted) setStats(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const items = [
    {
      title: "Applications Sent",
      value: stats?.total_applications ?? 0,
      change: `${stats?.recent_activity_count ?? 0} this week`,
      color: "text-primary",
    },
    {
      title: "Reviewed Applications",
      value: stats?.interview_requests ?? 0,
      change: `${stats?.total_applications ? Math.round(((stats?.interview_requests || 0) / Math.max(stats?.total_applications || 1, 1)) * 100) : 0}% conversion`,
      color: "text-primary",
    },
    {
      title: "Profile Completion",
      value: `${stats?.profile_completion_percentage ?? 0}%`,
      change: "",
      color: "text-primary",
    },
    {
      title: "Jobs Viewed",
      value: stats?.total_jobs_viewed ?? 0,
      change: "",
      color: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow border-pink-100">
          <CardHeader className="pb-2 border-b bg-gradient-to-r from-pink-50 to-pink-100">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {loading ? '…' : stat.value}
            </div>
            {stat.change && (
              <p className="text-xs text-gray-500 mt-1">
                {loading ? '' : stat.change}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
