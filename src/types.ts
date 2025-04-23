export interface Cleaner {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  client_id: string;
  cleaner_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  description?: string;
  client?: Client;
  cleaner?: Cleaner;
} 