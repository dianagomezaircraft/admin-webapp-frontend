import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, BookOpen, ChevronRight } from 'lucide-react';

const sections = [
  { id: '1', title: 'Pre-Flight Safety Check', contents: 5, order: 1 },
  { id: '2', title: 'In-Flight Procedures', contents: 8, order: 2 },
  { id: '3', title: 'Emergency Equipment', contents: 6, order: 3 },
  { id: '4', title: 'Post-Flight Review', contents: 4, order: 4 },
];

export default function ChapterPage({ params }: { params: { chapterId: string } }) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm">
        <Link href="/manuals" className="text-gray-600 hover:text-gray-900">
          Chapters
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900">Safety Procedures</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Safety Procedures</h2>
          <p className="text-gray-600 mt-1">12 sections • Updated 2 days ago</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">Edit Chapter</Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((section) => (
          <Link key={section.id} href={`/manuals/${params.chapterId}/${section.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">{section.order}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                      <span className="text-sm text-gray-500">{section.contents} content items</span>
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