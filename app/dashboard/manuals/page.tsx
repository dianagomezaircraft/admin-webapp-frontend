import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, BookOpen, ChevronRight } from 'lucide-react';

const chapters = [
  { id: '1', title: 'Safety Procedures', sections: 12, order: 1, updated: '2 days ago' },
  { id: '2', title: 'Emergency Protocols', sections: 8, order: 2, updated: '5 days ago' },
  { id: '3', title: 'Flight Operations', sections: 15, order: 3, updated: '1 week ago' },
  { id: '4', title: 'Maintenance Guidelines', sections: 10, order: 4, updated: '2 weeks ago' },
];

export default function ManualsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manual Chapters</h2>
          <p className="text-gray-600 mt-1">Manage training and operational manuals</p>
        </div>
        <Link href="/manuals/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Chapter
          </Button>
        </Link>
      </div>

      {/* Chapters List */}
      <div className="space-y-3">
        {chapters.map((chapter) => (
          <Link key={chapter.id} href={`/manuals/${chapter.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">{chapter.sections} sections</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">Updated {chapter.updated}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}