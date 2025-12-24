import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, BookOpen, ChevronRight } from 'lucide-react';

export default function NewChapterPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/manuals" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Chapters
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Chapter</h2>
        <p className="text-gray-600 mt-1">Create a new manual chapter</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="space-y-6">
            <Input
              label="Chapter Title"
              placeholder="e.g., Safety Procedures"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Brief description of this chapter..."
              />
            </div>

            <Input
              label="Order"
              type="number"
              defaultValue="1"
              min="1"
              required
            />

            <div className="flex space-x-3 pt-4">
              <Button type="submit">Create Chapter</Button>
              <Link href="/manuals">
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}