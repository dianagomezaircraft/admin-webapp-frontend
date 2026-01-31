// lib/contacts.ts
import { fetchWithAuth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Airline {
  id: string;
  name: string;
  code: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  order: number;
  active: boolean;
  airlineId: string;
  airline: Airline;
  contacts: Contact[];
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  avatar?: string;
  order: number;
  active: boolean;
  groupId: string;
  airlineId: string;
  metadata?: Record<string, string | number | boolean>;
  group: {
    id: string;
    name: string;
    airlineId: string;
  };
  airline: Airline;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactDto {
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  avatar?: string;
  order?: number;
  metadata?: Record<string, string | number | boolean>;
  active?: boolean;
}

export interface UpdateContactDto {
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  avatar?: string;
  order?: number;
  metadata?: Record<string, string | number | boolean>;
  active?: boolean;
}

export interface CreateContactGroupDto {
  name: string;
  description?: string;
  order?: number;
  active?: boolean;
  airlineId?: string; // AGREGADO: Permitir pasar airlineId explícitamente para SUPER_ADMIN
}

export interface UpdateContactGroupDto {
  name?: string;
  description?: string;
  order?: number;
  active?: boolean;
}

class ContactsService {
  // ============================================
  // CONTACT GROUPS
  // ============================================

  async getAllGroups(includeInactive: boolean = false): Promise<ContactGroup[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await fetchWithAuth(`${API_URL}/contacts/groups${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load contact groups');
    }
    
    const data = await response.json();
    return data.data;
  }

  async getGroupById(id: string): Promise<ContactGroup> {
    const response = await fetchWithAuth(`${API_URL}/contacts/groups/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load contact group');
    }
    
    const data = await response.json();
    return data.data;
  }

  async createGroup(data: CreateContactGroupDto): Promise<ContactGroup> {
    const response = await fetchWithAuth(`${API_URL}/contacts/groups`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create contact group');
    }
    
    const result = await response.json();
    return result.data;
  }

  async updateGroup(id: string, data: UpdateContactGroupDto): Promise<ContactGroup> {
    const response = await fetchWithAuth(`${API_URL}/contacts/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update contact group');
    }
    
    const result = await response.json();
    return result.data;
  }

  async deleteGroup(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/contacts/groups/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete contact group');
    }
  }

  // ============================================
  // CONTACTS
  // ============================================

  async getById(id: string): Promise<Contact> {
    const response = await fetchWithAuth(`${API_URL}/contacts/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load contact');
    }
    
    const data = await response.json();
    return data.data;
  }

  async create(groupId: string, data: CreateContactDto): Promise<Contact> {
    const response = await fetchWithAuth(`${API_URL}/contacts/groups/${groupId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create contact');
    }
    
    const result = await response.json();
    return result.data;
  }

  async update(id: string, data: UpdateContactDto): Promise<Contact> {
    const response = await fetchWithAuth(`${API_URL}/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update contact');
    }
    
    const result = await response.json();
    return result.data;
  }

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/contacts/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete contact');
    }
  }
}

export const contactsService = new ContactsService();