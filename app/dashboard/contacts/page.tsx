// app/dashboard/contacts/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Phone, Mail, User as UserIcon, Loader2, Plus, Pencil, Trash2, Users, Plane, Filter, X, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { contactsService, ContactGroup, Contact } from '@/lib/contacts';
import { authService, User } from '@/lib/auth';
import { airlinesService } from '@/lib/airlines';

interface Airline {
  id: string;
  name: string;
  code: string;
}

export default function ContactsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [selectedAirlineId, setSelectedAirlineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [activeGroupMenu, setActiveGroupMenu] = useState<string | null>(null);

  useEffect(() => {
    // Get user from authService
    const currentUser = authService.getUser();
    setUser(currentUser);
    
    if (!currentUser) {
      window.location.href = '/auth/login';
      return;
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load contact groups (includes contacts and airline info)
      const groups = await contactsService.getAllGroups();
      setContactGroups(groups);

      const allAirlines = await airlinesService.getAll();
      setAirlines(allAirlines);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const group = contactGroups.find(g => g.id === groupId);
    
    if (!group) return;

    if (group.contacts.length > 0) {
      alert(`Cannot delete this group. It contains ${group.contacts.length} contact(s). Please delete all contacts first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingGroupId(groupId);
      setActiveGroupMenu(null);
      
      await contactsService.deleteGroup(groupId);
      
      setContactGroups(contactGroups.filter(g => g.id !== groupId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete contact group');
      console.error('Error deleting contact group:', err);
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleDeleteContact = async (contactId: string, groupId: string) => {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingContactId(contactId);
      await contactsService.delete(contactId);
      
      // Update the local state by removing the contact from its group
      setContactGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === groupId
            ? { ...group, contacts: group.contacts.filter(c => c.id !== contactId) }
            : group
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete contact');
      console.error('Error deleting contact:', err);
    } finally {
      setDeletingContactId(null);
    }
  };

  // Filter contact groups by selected airline
  const filteredContactGroups = useMemo(() => {
    if (!selectedAirlineId) {
      return contactGroups;
    }
    return contactGroups.filter(group => group.airlineId === selectedAirlineId);
  }, [contactGroups, selectedAirlineId]);

  // Get statistics
  const stats = useMemo(() => {
    const totalGroups = filteredContactGroups.length;
    const totalContacts = filteredContactGroups.reduce((sum, group) => sum + group.contacts.length, 0);
    return { totalGroups, totalContacts };
  }, [filteredContactGroups]);

  const selectedAirline = airlines.find(a => a.id === selectedAirlineId);

  // Check if user can edit/delete (EDITOR or SUPER_ADMIN)
  const canEdit = user?.role === 'EDITOR' || user?.role === 'SUPER_ADMIN';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
            <p className="text-gray-600 mt-1">Manage your contact groups and contacts</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={loadData} variant="secondary">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
          <p className="text-gray-600 mt-1">Manage your contact groups and contacts</p>
        </div>
        {canEdit && (
          <div className="flex space-x-2">
            <Link href="/dashboard/contacts/groups/new">
              <Button variant="secondary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Group
              </Button>
            </Link>
            <Link href="/dashboard/contacts/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Contact
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filters & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Airline Filter */}
        {airlines.length > 1 && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:min-w-[280px]">
              <select
                value={selectedAirlineId || ''}
                onChange={(e) => setSelectedAirlineId(e.target.value || null)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer"
              >
                <option value="">All Airlines</option>
                {airlines.map((airline) => (
                  <option key={airline.id} value={airline.id}>
                    {airline.code} - {airline.name}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              {selectedAirlineId && (
                <button
                  onClick={() => setSelectedAirlineId(null)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Active Filter Badge */}
            {selectedAirlineId && selectedAirline && (
              <Badge variant="blue">
                <Plane className="w-3.5 h-3.5" />
                <span>{selectedAirline.code}</span>
              </Badge>
            )}
          </div>
        )}

        {/* Statistics */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="font-medium">{stats.totalGroups}</span>
            <span>Groups</span>
          </div>
          <div className="w-px h-4 bg-gray-300" />
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            <span className="font-medium">{stats.totalContacts}</span>
            <span>Contacts</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredContactGroups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {selectedAirlineId ? (
              <>
                <h3 className="font-medium text-gray-900 mb-2">
                  No contacts for {selectedAirline?.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  There are no contact groups for this airline yet
                </p>
                <div className="flex justify-center space-x-3">
                  <Button variant="secondary" onClick={() => setSelectedAirlineId(null)}>
                    Show All Airlines
                  </Button>
                  {canEdit && (
                    <Link href="/dashboard/contacts/groups/new">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact Group
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="font-medium text-gray-900 mb-2">No contacts yet</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first contact group</p>
                {canEdit ? (
                  <div className="flex justify-center space-x-3">
                    <Link href="/dashboard/contacts/groups/new">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact Group
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Contact your administrator to add contacts
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Contact Groups */
        <div className="space-y-8">
          {filteredContactGroups.map((group) => (
            <div key={group.id} className="space-y-4">
              {/* Group Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center flex-wrap gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={group.active ? 'green' : 'gray'}>
                      {group.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="blue">
                      {group.contacts.length} {group.contacts.length === 1 ? 'Contact' : 'Contacts'}
                    </Badge>
                    <Badge variant="blue">
                      <Plane className="w-3 h-3 mr-1" />
                      {group.airline.code}
                    </Badge>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/contacts/groups/${group.id}`}>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      disabled={deletingGroupId === group.id}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={group.contacts.length > 0 ? 'Cannot delete group with contacts' : 'Delete group'}
                    >
                      {deletingGroupId === group.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Contacts Grid */}
              {group.contacts.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500 mb-4">No contacts in this group</p>
                    {canEdit && (
                      <Link href={`/dashboard/contacts/new?groupId=${group.id}`}>
                        <Button size="sm" variant="secondary">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Contact
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.contacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      groupId={group.id}
                      deletingContactId={deletingContactId}
                      onDelete={handleDeleteContact}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Contact Card Component
interface ContactCardProps {
  contact: Contact;
  groupId: string;
  deletingContactId: string | null;
  onDelete: (contactId: string, groupId: string) => void;
  canEdit: boolean;
}

function ContactCard({ contact, groupId, deletingContactId, onDelete, canEdit }: ContactCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Contact Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {contact.avatar ? (
                <img
                  src={contact.avatar}
                  alt={`${contact.firstName} ${contact.lastName}`}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(contact.firstName, contact.lastName)}
                  </span>
                </div>
              )}
            </div>

            {/* Name */}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-900 truncate">
                {contact.firstName} {contact.lastName}
              </h4>
              {contact.title && (
                <p className="text-sm text-gray-600 truncate">{contact.title}</p>
              )}
            </div>
          </div>

          <div className="ml-2 flex-shrink-0">
            <Badge variant={contact.active ? 'green' : 'gray'}>
              {contact.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-2 mb-4">
          {contact.company && (
            <div className="flex items-center text-sm text-gray-600">
              <UserIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}
          
          {contact.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              <a 
                href={`tel:${contact.phone}`}
                className="hover:text-blue-600 transition-colors truncate"
              >
                {contact.phone}
              </a>
            </div>
          )}

          {contact.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
              <a 
                href={`mailto:${contact.email}`}
                className="hover:text-blue-600 transition-colors truncate"
              >
                {contact.email}
              </a>
            </div>
          )}

          {contact.timezone && (
            <div className="text-xs text-gray-500 mt-2">
              Timezone: {contact.timezone}
            </div>
          )}

          {/* Airline Info */}
          {contact.airline && (
            <div className="flex items-center text-xs text-gray-500 mt-2 pt-2 border-t">
              <Plane className="w-3 h-3 mr-1" />
              <span>{contact.airline.code} - {contact.airline.name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit ? (
          <div className="flex items-center gap-1 pt-3 border-t">
            <Link href={`/dashboard/contacts/${contact.id}`} className="flex-1">
              <button className="w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </button>
            </Link>
            <button
              onClick={() => onDelete(contact.id, groupId)}
              disabled={deletingContactId === contact.id}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingContactId === contact.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : (
          <div className="pt-3 border-t">
            <Link href={`/dashboard/contacts/${contact.id}`} className="block">
              <button className="w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                View Details
              </button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}