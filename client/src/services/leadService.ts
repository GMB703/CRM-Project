import api from './api';

export enum LeadActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  STAGE_CHANGE = 'STAGE_CHANGE',
  DEMO = 'DEMO',
  QUOTE_SENT = 'QUOTE_SENT',
  FOLLOW_UP = 'FOLLOW_UP',
  CONVERSION = 'CONVERSION',
  OTHER = 'OTHER',
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  stage: string;
  estimatedValue?: number;
  leadScore?: number;
  assignedUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  outcome?: string;
  nextAction?: string;
  duration?: number;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFilter {
  search?: string;
  stage?: string;
  assignedUserId?: string;
  minLeadScore?: number;
  maxLeadScore?: number;
  minEstimatedValue?: number;
  maxEstimatedValue?: number;
  source?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface LeadSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface LeadPagination {
  page: number;
  limit: number;
}

export interface LeadStage {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order: number;
  isActive: boolean;
}

export interface LeadSource {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface LeadStatistics {
  totalLeads: number;
  newLeadsThisMonth: number;
  conversionRate: number;
  averageLeadScore: number;
  stageDistribution: {
    stage: string;
    count: number;
    percentage: number;
  }[];
  sourceDistribution: {
    source: string;
    count: number;
    percentage: number;
  }[];
}

class LeadService {
  async getLeads(filter?: LeadFilter, sort?: LeadSort, pagination?: LeadPagination) {
    const params = new URLSearchParams();
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    if (sort) {
      params.append('sortField', sort.field);
      params.append('sortDirection', sort.direction);
    }

    if (pagination) {
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
    }

    const response = await api.get(`/leads?${params.toString()}`);
    return response.data;
  }

  async getLeadById(id: string) {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  }

  async createLead(data: Partial<Lead>) {
    const response = await api.post('/leads', data);
    return response.data;
  }

  async updateLead(id: string, data: Partial<Lead>) {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  }

  async deleteLead(id: string) {
    await api.delete(`/leads/${id}`);
  }

  async updateLeadStage(id: string, stage: string) {
    const response = await api.put(`/leads/${id}/stage`, { stage });
    return response.data;
  }

  async createLeadActivity(leadId: string, data: Partial<LeadActivity>) {
    const response = await api.post(`/leads/${leadId}/activities`, data);
    return response.data;
  }

  async getLeadActivities(leadId: string, page = 1, limit = 10) {
    const response = await api.get(`/leads/${leadId}/activities?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getLeadStages() {
    const response = await api.get('/leads/stages/list');
    return response.data;
  }

  async getLeadSources() {
    const response = await api.get('/leads/sources/list');
    return response.data;
  }

  async getLeadStatistics() {
    const response = await api.get('/leads/statistics/overview');
    return response.data;
  }
}

export const leadService = new LeadService(); 