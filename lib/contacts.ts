// lib/contacts.ts
import { fetchWithAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Contact Group Interfaces
export interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  order: number;
  active: boolean;
  airlineId: string;
  createdAt: string;
  updatedAt: string;
  contacts: Contact[];
  airline: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateContactGroupData {
  name: string;
  description?: string;
  order?: number;
  active?: boolean;
}

export interface UpdateContactGroupData {
  name?: string;
  description?: string;
  order?: number;
  active?: boolean;
}

// Contact Interfaces
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  avatar: string | null;
  order: number;
  active: boolean;
  groupId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  group: {
    id: string;
    name: string;
    airlineId: string;
  };
}

export interface CreateContactData {
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  avatar?: string;
  order?: number;
  metadata?: Record<string, unknown>;
  active?: boolean;
}

export interface UpdateContactData {
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  avatar?: string;
  order?: number;
  metadata?: Record<string, unknown>;
  active?: boolean;
}

// Response Interfaces
interface ContactGroupsResponse {
  success: boolean;
  data: ContactGroup[];
  count: number;
}

interface ContactGroupResponse {
  success: boolean;
  data: ContactGroup;
  message?: string;
}

interface ContactsResponse {
  success: boolean;
  data: Contact[];
  count: number;
}

interface ContactResponse {
  success: boolean;
  data: Contact;
  message?: string;
}

// Contact Groups Service
export const contactGroupsService = {
  async getAll(includeInactive?: boolean): Promise<ContactGroup[]> {
    const params = new URLSearchParams();
    if (includeInactive !== undefined) {
      params.append('includeInactive', String(includeInactive));
    }

    const url = `${API_URL}/contacts/groups${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch contact groups');
    }

    const result: ContactGroupsResponse = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<ContactGroup> {
    const response = await fetchWithAuth(`${API_URL}/contacts/groups/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch contact group');
    }

    const result: ContactGroupResponse = await response.json();
    return result.data;
  },

  async create(data: CreateContactGroupData): Promise<ContactGroup> {
    const response = await fetchWithAuth(`${API_URL}/contacts/groups`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create contact group');
    }

    const result: ContactGroupResponse = await response.json();
    return result.data;
  },

  async update(id: string, data: UpdateContactGroupData): Promise<ContactGroup> {
    const response = await fetchWithAuth(`${API_URL}/contacts/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update contact group');
    }

    const result: ContactGroupResponse = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/contacts/groups/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete contact group');
    }
  },
};

// Contacts Service
export const contactsService = {
  async getAllByGroup(groupId: string, includeInactive?: boolean): Promise<Contact[]> {
    const params = new URLSearchParams();
    if (includeInactive !== undefined) {
      params.append('includeInactive', String(includeInactive));
    }

    const url = `${API_URL}/contacts/groups/${groupId}/contacts${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch contacts');
    }

    const result: ContactsResponse = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<Contact> {
    const response = await fetchWithAuth(`${API_URL}/contacts/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch contact');
    }

    const result: ContactResponse = await response.json();
    return result.data;
  },

  async create(groupId: string, data: CreateContactData): Promise<Contact> {
    const response = await fetchWithAuth(`${API_URL}/contacts/groups/${groupId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create contact');
    }

    const result: ContactResponse = await response.json();
    return result.data;
  },

  async update(id: string, data: UpdateContactData): Promise<Contact> {
    const response = await fetchWithAuth(`${API_URL}/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update contact');
    }

    const result: ContactResponse = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/contacts/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete contact');
    }
  },
};