export type ServiceLocation = {
  id: string;
  client_id: string;
  street: string;
  street_number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
  created_at: string;
};

export type UserRole = 'admin' | 'manager' | 'cleaner';

export type DashboardUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  created_at: string;
};

export type Cleaner = {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  active: boolean;
};

export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type ServiceFrequency = 'weekly' | 'bi_weekly' | 'monthly' | 'one_time';

export type ServiceType = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  frequency: ServiceFrequency;
  created_at: string;
};

export type ServiceTask = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  active: boolean;
};

export type Appointment = {
  id: string;
  client_id: string;
  cleaner_id: string;
  service_location_id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  description: string;
  service_type_id: string | null;
  service_tasks: string[];
  additional_notes: string | null;
  frequency: ServiceFrequency | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  cleaner?: Cleaner;
  service_location?: ServiceLocation;
  service_type?: ServiceType;
};