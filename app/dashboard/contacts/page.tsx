// app/dashboard/contacts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, User, Loader2, AlertCircle, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { contactGroupsService, contactsService, ContactGroup, Contact } from '@/lib/contacts';

export default function ContactsPage() {
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  useEffect(() => {
    loadContactGroups();
  }, []);

  const loadContactGroups = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const groups = await contactGroupsService.getAll();
      setContactGroups(groups);
    } catch (err) {
      console.error('Error loading contact groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact group?')) {
      return;
    }

    try {
      setDeletingGroupId(id);
      await contactGroupsService.delete(id);
      setContactGroups(contactGroups.filter(group => group.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete contact group');
      console.error('Error deleting contact group:', err);
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleDeleteContact = async (contactId: string, groupId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
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
            <Button onClick={loadContactGroups} variant="secondary">
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
        <div className="flex space-x-3">
          <Link href="/dashboard/contacts/groups/new">
            <Button variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Add Group
            </Button>
          </Link>
          <Link href="/dashboard/contacts/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {contactGroups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">No contacts yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first contact group</p>
            <div className="flex justify-center space-x-3">
              <Link href="/dashboard/contacts/groups/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact Group
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Contact Groups */
        <div className="space-y-8">
          {contactGroups.map((group) => (
            <div key={group.id} className="space-y-4">
              {/* Group Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                    )}
                  </div>
                  <Badge variant={group.active ? 'green' : 'gray'}>
                    {group.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="blue">
                    {group.contacts.length} {group.contacts.length === 1 ? 'Contact' : 'Contacts'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Link href={`/dashboard/contacts/groups/${group.id}`}>
                    <Button variant="secondary" size="sm">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Group
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    disabled={deletingGroupId === group.id || group.contacts.length > 0}
                    title={group.contacts.length > 0 ? 'Cannot delete group with contacts' : 'Delete group'}
                  >
                    {deletingGroupId === group.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Contacts Grid */}
              {group.contacts.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500 mb-4">No contacts in this group</p>
                    <Link href={`/dashboard/contacts/new?groupId=${group.id}`}>
                      <Button size="sm" variant="secondary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact
                      </Button>
                    </Link>
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
}

function ContactCard({ contact, groupId, deletingContactId, onDelete }: ContactCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Contact Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
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
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">
                {contact.firstName} {contact.lastName}
              </h4>
              {contact.title && (
                <p className="text-sm text-gray-600 truncate">{contact.title}</p>
              )}
            </div>
          </div>

          <Badge variant={contact.active ? 'green' : 'gray'}>
            {contact.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Contact Details */}
        <div className="space-y-2 mb-4">
          {contact.company && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2 flex-shrink-0" />
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
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-3 border-t">
          <Link href={`/dashboard/contacts/${contact.id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(contact.id, groupId)}
            disabled={deletingContactId === contact.id}
          >
            {deletingContactId === contact.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}