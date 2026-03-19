'use client';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, Plane, Users, BookOpen, TrendingUp } from 'lucide-react';
import { airlinesService, type Airline } from '@/lib/airlines';
import { useEffect, useState } from 'react';
import { usersService, type User } from '@/lib/users';
import { chaptersService, type Chapter } from '@/lib/chapters';

const formatLastLogin = (lastLogin: string | null): string => {
  if (!lastLogin) return 'Never';
  
  const now = new Date();
  const loginDate = new Date(lastLogin);
  const diffMs = now.getTime() - loginDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'} ago`;
  return loginDate.toLocaleDateString();
};

export default function DashboardPage() {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all data in parallel
      const [airlinesData, usersData, chaptersData] = await Promise.all([
        airlinesService.getAll(),
        usersService.getAll(),
        chaptersService.getAll(),
      ]);
      
      setAirlines(airlinesData);
      setUsers(usersData);
      setChapters(chaptersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
  { label: 'Add Airline', icon: Plane, href: '/dashboard/airlines/new' },
  { label: 'Add User', icon: Users, href: '/dashboard/users/new' },
  { label: 'New Manual', icon: BookOpen, href: '/dashboard/manuals/new' },
  ];
  
  // Calculate dynamic stats based on real data
  const stats = [
    {
      name: 'Total Airlines',
      value: airlines.length.toString(),
      change: `${airlines.filter(a => a.active).length} active`,
      icon: Plane,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Active Users',
      value: users.length.toString(),
      change: `${airlines.reduce((sum, a) => sum + (a._count?.users || 0), 0)} total`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Manual Chapters',
      value: airlines.reduce((sum, a) => sum + (a._count?.manualChapters || 0), 0).toString(),
      change: `Across ${airlines.length} airlines`,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

const sortedUsers = [...users].sort((a, b) => {
  if (!a.lastLogin) return 1;   // sin login van al final
  if (!b.lastLogin) return -1;
  return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime();
});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Airlines */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Airlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {airlines.slice(0, 5).map((airline) => (
                <div 
                  key={airline.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {airline.logo && (
                      <img 
                        src={airline.logo} 
                        alt={airline.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{airline.name}</p>
                      <p className="text-xs text-gray-500">{airline.code}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-600">{airline._count?.users || 0} users</p>
                    <p className="text-gray-500">{airline._count?.manualChapters || 0} chapters</p>
                  </div>
                </div>
              ))}
              {airlines.length === 0 && (
                <p className="text-center text-gray-500 py-4">No airlines yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center cursor-pointer">
                    <action.icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {action.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
     {/* User Access Log */}
      <Card>
        <CardHeader>
          <CardTitle>
            User Access Log
            <span className="ml-2 text-sm font-normal text-gray-500">
              {sortedUsers.length} records
            </span>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          {sortedUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No access records found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Airline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">

                    {/* Usuario */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Aerolínea */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.airline?.name ?? '—'}
                    </td>

                    {/* Fecha de último acceso */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.lastLogin ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(user.lastLogin).toLocaleString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {formatLastLogin(user.lastLogin)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          Never logged in
                        </span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}