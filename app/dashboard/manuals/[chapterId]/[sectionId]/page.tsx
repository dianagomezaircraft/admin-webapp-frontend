import { FileText, Image, Video, FileAudio } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, BookOpen, ChevronRight } from 'lucide-react';

const contents = [
  { id: '1', title: 'Safety Equipment Overview', type: 'TEXT', order: 1 },
  { id: '2', title: 'Emergency Exit Diagram', type: 'IMAGE', order: 2 },
  { id: '3', title: 'Safety Demonstration Video', type: 'VIDEO', order: 3 },
  { id: '4', title: 'Equipment Checklist', type: 'TEXT', order: 4 },
];

const getContentIcon = (type: string) => {
  const icons = {
    TEXT: FileText,
    IMAGE: Image,
    VIDEO: Video,
    PDF: FileText,
    AUDIO: FileAudio,
  };
  return icons[type as keyof typeof icons] || FileText;
};

export default function SectionPage({ 
  params 
}: { 
  params: { chapterId: string; sectionId: string } 
}) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm">
        <Link href="/manuals" className="text-gray-600 hover:text-gray-900">
          Chapters
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <Link href={`/manuals/${params.chapterId}`} className="text-gray-600 hover:text-gray-900">
          Safety Procedures
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900">Pre-Flight Safety Check</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pre-Flight Safety Check</h2>
          <p className="text-gray-600 mt-1">5 content items</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">Edit Section</Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Content Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contents.map((content) => {
          const Icon = getContentIcon(content.type);
          return (
            <Card key={content.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">{content.title}</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500 uppercase">{content.type}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">Order {content.order}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Editor Preview */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Content Editor</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Select a content item to edit</p>
            <p className="text-sm text-gray-500 mt-1">Rich text editor will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}