import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function NewUserPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/users" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Users
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
        <p className="text-gray-600 mt-1">Create a new user account</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                placeholder="John"
                required
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="john.doe@airline.com"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>VIEWER</option>
                  <option>EDITOR</option>
                  <option>ADMIN</option>
                  <option>SUPER_ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Airline
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select airline...</option>
                  <option>American Airlines</option>
                  <option>Delta Air Lines</option>
                  <option>United Airlines</option>
                  <option>Southwest Airlines</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="active" defaultChecked className="rounded border-gray-300" />
              <label htmlFor="active" className="text-sm text-gray-700">Active account</label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit">Create User</Button>
              <Link href="/users">
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}