import { 
  Appointment as BaseAppointment,
  Client,
  Cleaner,
  ServiceLocation,
  ServiceType,
  AppointmentStatus,
  ServiceFrequency
} from './index';

// Re-export the types with explicit service_location property
export interface AppointmentWithRelations extends BaseAppointment {
  client?: Client;
  cleaner?: Cleaner;
  service_location?: ServiceLocation;
  service_type?: ServiceType;
  additional_notes: string | null;
}

export type {
  Client,
  Cleaner,
  ServiceLocation,
  ServiceType,
  AppointmentStatus,
  ServiceFrequency
}; 