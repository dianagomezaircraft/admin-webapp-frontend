'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, BookOpen, ChevronRight, Loader2, AlertCircle, Filter, X } from 'lucide-react';
import { chaptersService, Chapter } from '@/lib/chapters';

interface Airline {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export default function ManualsPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [selectedAirlineId, setSelectedAirlineId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterChapters();
  }, [selectedAirlineId, chapters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [chaptersData, airlinesData] = await Promise.all([
        chaptersService.getAll(),
        chaptersService.getAirlines(),
      ]);
      
      setChapters(chaptersData);
      setAirlines(airlinesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterChapters = () => {
    if (selectedAirlineId === 'all') {
      setFilteredChapters(chapters);
    } else {
      setFilteredChapters(
        chapters.filter(chapter => chapter.airlineId === selectedAirlineId)
      );
    }
  };

  const handleAirlineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAirlineId(e.target.value);
  };

  const clearFilter = () => {
    setSelectedAirlineId('all');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getAirlineName = (airlineId: string) => {
    const airline = airlines.find(a => a.id === airlineId);
    return airline ? airline.name : 'Unknown';
  };

  const getAirlineCode = (airlineId: string) => {
    const airline = airlines.find(a => a.id === airlineId);
    return airline ? airline.code : '';
  };

  const getChapterCount = (airlineId: string) => {
    if (airlineId === 'all') return chapters.length;
    return chapters.filter(c => c.airlineId === airlineId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manual Chapters</h2>
          <p className="text-gray-600 mt-1">Manage training and operational manuals</p>
        </div>
        <Link href="/dashboard/manuals/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Chapter
          </Button>
        </Link>
      </div>

      {/* Filter Section - Dropdown Version */}
      {!loading && airlines.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <label htmlFor="airline-filter" className="text-sm font-medium text-gray-700">
              Filter by Airline:
            </label>
          </div>
          
          <select
            id="airline-filter"
            value={selectedAirlineId}
            onChange={handleAirlineChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">
              All Airlines ({chapters.length})
            </option>
            {airlines.map((airline) => (
              <option key={airline.id} value={airline.id}>
                {airline.name} ({getChapterCount(airline.id)})
              </option>
            ))}
          </select>

          {selectedAirlineId !== 'all' && (
            <button
              onClick={clearFilter}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}

          {selectedAirlineId !== 'all' && (
            <div className="ml-auto">
              <span className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredChapters.length}</span> chapters
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error loading chapters</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <Button
              onClick={loadData}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Chapters */}
      {!loading && !error && chapters.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No chapters yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first manual chapter</p>
            <Link href="/dashboard/manuals/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Chapter
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Results for Filter */}
      {!loading && !error && chapters.length > 0 && filteredChapters.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No chapters found</h3>
            <p className="text-gray-600 mb-6">
              No chapters found for {getAirlineName(selectedAirlineId)}
            </p>
            <Button onClick={clearFilter} variant="secondary">
              <X className="w-4 h-4 mr-2" />
              Clear Filter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Chapters List */}
      {!loading && !error && filteredChapters.length > 0 && (
        <div className="space-y-3">
          {filteredChapters.map((chapter) => (
            <Link key={chapter.id} href={`/dashboard/manuals/${chapter.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                          {!chapter.active && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500">
                            Updated {formatDate(chapter.updatedAt)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-sm text-blue-600 font-medium">
                            {getAirlineCode(chapter.airlineId)}
                          </span>
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
      )}

      {/* Results Summary */}
      {!loading && !error && filteredChapters.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Showing {filteredChapters.length} of {chapters.length} chapters
          </p>
        </div>
      )}
    </div>
  );
}