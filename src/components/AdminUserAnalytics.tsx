import React, { useState, useEffect } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserStats {
  totalFreelancers: number;
  verifiedFreelancers: number;
  maleFreelancers: number;
  femaleFreelancers: number;
  totalClients: number;
  verifiedClients: number;
}

const AdminUserAnalytics: React.FC = () => {
  const [stats, setStats] = useState<UserStats>({
    totalFreelancers: 0,
    verifiedFreelancers: 0,
    maleFreelancers: 0,
    femaleFreelancers: 0,
    totalClients: 0,
    verifiedClients: 0,
  });
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      // Get all users with profiles
      const usersData = await api.admin.getUsersWithEmail();

      // Filter freelancers and clients
      const freelancers = usersData.filter((u: any) => 
        u.userType === 'FREELANCER' && 
        u.profile?.fullName && 
        u.profile.fullName !== 'Incomplete Profile'
      );

      const clients = usersData.filter((u: any) => 
        u.userType === 'CLIENT' && 
        u.profile?.fullName && 
        u.profile.fullName !== 'Incomplete Profile'
      );

      // Calculate freelancer stats
      const totalFreelancers = freelancers.length;
      const verifiedFreelancers = freelancers.filter((f: any) => 
        f.phoneVerified && f.profile?.mitidVerified
      ).length;
      
      // For gender, we'll use a simple approximation based on common Danish names
      const maleNames = ['Lars', 'Morten', 'Anders', 'Peter', 'Jesper', 'Thomas', 'Michael', 'Henrik', 'Martin', 'Søren'];
      const femaleNames = ['Anna', 'Marie', 'Camilla', 'Mette', 'Louise', 'Susanne', 'Charlotte', 'Hanne', 'Lise', 'Karen'];
      
      let estimatedMale = 0;
      let estimatedFemale = 0;
      
      freelancers.forEach((f: any) => {
        const firstName = f.profile?.fullName?.split(' ')[0]?.toLowerCase() || '';
        if (maleNames.some(name => firstName.includes(name.toLowerCase()))) {
          estimatedMale++;
        } else if (femaleNames.some(name => firstName.includes(name.toLowerCase()))) {
          estimatedFemale++;
        }
      });

      // Calculate client stats
      const totalClients = clients.length;
      const verifiedClients = clients.filter((c: any) => 
        c.phoneVerified && c.profile?.paymentVerified
      ).length;

      setStats({
        totalFreelancers,
        verifiedFreelancers,
        maleFreelancers: estimatedMale,
        femaleFreelancers: estimatedFemale,
        totalClients,
        verifiedClients,
      });

    } catch (error: any) {
      console.error('Error fetching user statistics:', error);
      toast.error(error.message || 'Fejl ved indlæsning af brugerstatistik');
    } finally {
      setLoading(false);
    }
  };

  // Calculate percentages for pie charts
  const malePercentage = stats.totalFreelancers > 0 
    ? (stats.maleFreelancers / stats.totalFreelancers) * 100 
    : 0;
  const femalePercentage = stats.totalFreelancers > 0 
    ? (stats.femaleFreelancers / stats.totalFreelancers) * 100 
    : 0;
  const otherGenderCount = stats.totalFreelancers - stats.maleFreelancers - stats.femaleFreelancers;
  const otherPercentage = stats.totalFreelancers > 0 
    ? (otherGenderCount / stats.totalFreelancers) * 100 
    : 0;

  const clientVerifiedPercentage = stats.totalClients > 0 
    ? (stats.verifiedClients / stats.totalClients) * 100 
    : 0;
  const clientUnverifiedPercentage = 100 - clientVerifiedPercentage;

  // Create SVG pie chart
  const createPieChart = (
    segments: Array<{ percentage: number; color: string; label: string }>,
    size: number = 120
  ) => {
    let cumulativePercentage = 0;
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        {segments.map((segment, index) => {
          if (segment.percentage === 0) return null;
          
          const startAngle = (cumulativePercentage / 100) * 360 - 90;
          const endAngle = ((cumulativePercentage + segment.percentage) / 100) * 360 - 90;
          
          const startAngleRad = (startAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;
          
          const largeArcFlag = segment.percentage > 50 ? 1 : 0;
          
          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          cumulativePercentage += segment.percentage;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={segment.color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        {/* Center circle for donut effect */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius * 0.5}
          fill="white"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Freelancer Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Freelancer Statistik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{stats.totalFreelancers}</div>
                <div className="text-sm text-muted-foreground">Tilmeldte freelancere</div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <span className="text-lg font-semibold">{stats.verifiedFreelancers}</span>
                </div>
                <div className="text-sm text-muted-foreground">Verificerede profiler</div>
              </div>

              {/* Gender Legend */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Mulige mænd: {stats.maleFreelancers} ({malePercentage.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  <span className="text-sm">Mulige kvinder: {stats.femaleFreelancers} ({femalePercentage.toFixed(1)}%)</span>
                </div>
                {otherGenderCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-sm">Ukendt: {otherGenderCount} ({otherPercentage.toFixed(1)}%)</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  *Baseret på navneanalyse
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="flex flex-col items-center">
              {createPieChart([
                { percentage: malePercentage, color: '#3b82f6', label: 'Mulige mænd' },
                { percentage: femalePercentage, color: '#ec4899', label: 'Mulige kvinder' },
                { percentage: otherPercentage, color: '#9ca3af', label: 'Ukendt' },
              ])}
              <div className="text-xs text-muted-foreground mt-2">Navneanalyse</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-500" />
            Klient Statistik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <div className="text-sm text-muted-foreground">Registrerede klienter</div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <span className="text-lg font-semibold">{stats.verifiedClients}</span>
                </div>
                <div className="text-sm text-muted-foreground">Verificerede profiler</div>
              </div>

              {/* Verification Legend */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Verificeret: {stats.verifiedClients} ({clientVerifiedPercentage.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                  <span className="text-sm">Ikke verificeret: {stats.totalClients - stats.verifiedClients} ({clientUnverifiedPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="flex flex-col items-center">
              {createPieChart([
                { percentage: clientVerifiedPercentage, color: '#10b981', label: 'Verificeret' },
                { percentage: clientUnverifiedPercentage, color: '#fb923c', label: 'Ikke verificeret' },
              ])}
              <div className="text-xs text-muted-foreground mt-2">Verifikationsstatus</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserAnalytics;