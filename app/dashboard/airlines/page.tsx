import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const airlines = [
  { id: '1', name: 'American Airlines', code: 'AA', users: 45, manuals: 23, active: true },
  { id: '2', name: 'Delta Air Lines', code: 'DL', users: 38, manuals: 19, active: true },
  { id: '3', name: 'United Airlines', code: 'UA', users: 52, manuals: 27, active: true },
  { id: '4', name: 'Southwest Airlines', code: 'WN', users: 31, manuals: 15, active: false },
];

export default function AirlinesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Airlines</h2>
          <p className="text-gray-600 mt-1">Manage airline tenants</p>
        </div>
        <Link href="/airlines/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Airline
          </Button>
        </Link>
      </div>

      {/* Airlines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {airlines.map((airline) => (
          <Card key={airline.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">{airline.code}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{airline.name}</h3>
                    <p className="text-sm text-gray-500">{airline.code}</p>
                  </div>
                </div>
                <Badge variant={airline.active ? 'green' : 'gray'}>
                  {airline.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Users</span>
                  <span className="font-medium text-gray-900">{airline.users}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Manuals</span>
                  <span className="font-medium text-gray-900">{airline.manuals}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link href={`/airlines/${airline.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button variant="danger" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}