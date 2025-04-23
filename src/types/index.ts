export type ServiceLocation = {
  id: string;
  client_id: string;
  name: string;
  is_primary: boolean;
  street: string | null;
  street_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  complemento: string | null;
  ponto_referencia: string | null;
  instrucoes_acesso: string | null;
  latitude: number | null;
  longitude: number | null;
  address_validated: boolean;
  tipo_piscina: string | null;
  tamanho_piscina: string | null;
  produtos_utilizados: string | null;
  equipamentos: string | null;
  horario_preferido: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
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

export type Appointment = {
  id: string;
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
};

export type Client = {
  id: string;
  name: string;
  email: string | null;
  telefone: string | null;
  frequencia_limpeza: string | null;
  como_conheceu: string | null;
  created_at: string;
  service_locations?: ServiceLocation[];
};