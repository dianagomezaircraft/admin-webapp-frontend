import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plane, Users, BookOpen, TrendingUp } from 'lucide-react';

const stats = [
  {
    name: 'Total Airlines',
    value: '12',
    change: '+2 this month',
    icon: Plane,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Active Users',
    value: '248',
    change: '+18 this month',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    name: 'Manual Chapters',
    value: '156',
    change: '+12 this month',
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    name: 'Growth Rate',
    value: '12.5%',
    change: '+2.4% from last month',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

const recentActivity = [
  { user: 'John Doe', action: 'Updated Safety Manual Chapter 3', time: '2 hours ago' },
  { user: 'Jane Smith', action: 'Added new airline: Southwest', time: '4 hours ago' },
  { user: 'Mike Johnson', action: 'Created new user account', time: '6 hours ago' },
  { user: 'Sarah Williams', action: 'Modified Flight Procedures', time: '1 day ago' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-700">
                      {activity.user.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                <Plane className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Add Airline</span>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Add User</span>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">New Manual</span>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">View Reports</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}