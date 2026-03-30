import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Lock, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle>Profile Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl font-medium text-gray-700">SA</span>
              </div>
              <Button variant="secondary" size="sm">Change Photo</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="First Name"
                defaultValue="Super"
              />
              <Input
                label="Last Name"
                defaultValue="Admin"
              />
            </div>

            <Input
              label="Email"
              type="email"
              defaultValue="admin@admin.com"
              disabled
            />

            <div className="flex justify-end pt-4 border-t">
              <Button>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      

      

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
              </div>
              <Button variant="danger">Delete Account</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}