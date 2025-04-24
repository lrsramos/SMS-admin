export type ServiceLocation = {
  id: string;
  client_id: string;
  street: string;
  street_number: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
};

export type UserRole = 'admin' | 'manager' | 'cleaner';

export type DashboardUser = {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Cleaner = {
  id: string;
  name: string;
  email: string;
  personal_phone: string | null;
  company_phone: string | null;
  active: boolean;
  created_at: string;
  password?: string;
  available_days: string[];
  work_start_time: string | null;
  work_end_time: string | null;
  service_areas: string[];
  has_vehicle: boolean;
  vehicle_type: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  employee_code: string | null;
  hire_date: string | null;
  role: UserRole;
};

export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed';

export type CleaningServiceType = 'weekly' | 'bi_weekly' | 'monthly' | 'one_time';

export type CleaningTask = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
};

export type CleaningTasks = {
  skimming: boolean;
  vacuuming: boolean;
  brushing: boolean;
  basket_empty: boolean;
  water_chemistry: boolean;
  filter_backwash: boolean;
  algae_treatment: boolean;
  shock_treatment: boolean;
  tile_cleaning: boolean;
  acid_wash: boolean;
  pool_opening: boolean;
  pool_closing: boolean;
};

export type Appointment = {
  id: string;
  client_id: string;
  client_name: string;
  address: string;
  cleaner_id: string;
  status: AppointmentStatus;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  service_type: CleaningServiceType;
  cleaning_tasks: CleaningTasks;
  estimated_duration: number;
  special_instructions: string | null;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
  created_at: string;
  complemento?: string;
  ponto_referencia?: string;
  instrucoes_acesso?: string;
  tipo_piscina?: string;
  tamanho_piscina?: string;
  produtos_utilizados?: string;
  equipamentos?: string;
  horario_preferido?: string;
  observacoes?: string;
  como_conheceu?: string;
  address_validated: boolean;
  street?: string;
  street_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
};