import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, MapPin, Calendar, Clock, User, Briefcase, FileText, CheckSquare } from 'lucide-react';
import { format, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Appointment, Cleaner, Client, ServiceLocation, ServiceType, ServiceTask, ServiceFrequency } from '../types';
import { supabase } from '../lib/supabase';
import { modalStyles, inputStyles, buttonStyles } from '../styles/components';
import { createComponentStyle } from '../utils/styles';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment;
  cleaners: Cleaner[];
  onSave: (appointment: Partial<Appointment>) => Promise<void>;
}

// Default center (São Paulo)
const DEFAULT_CENTER = {
  lat: -23.5505,
  lng: -46.6333,
};

const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  cleaners,
  onSave,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientAddresses, setClientAddresses] = useState<ServiceLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ServiceLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceTasks, setServiceTasks] = useState<ServiceTask[]>([]);
  const [formData, setFormData] = useState<Partial<Appointment>>(
    appointment || {
      client_id: '',
      cleaner_id: '',
      scheduled_at: new Date().toISOString(),
      status: 'scheduled',
      description: '',
      service_type_id: null,
      service_tasks: [],
      additional_notes: null,
      frequency: null,
      service_location_id: ''
    }
  );
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
    fetchServiceTypes();
    fetchServiceTasks();
  }, []);

  useEffect(() => {
    if (isOpen && appointment) {
      setFormData(appointment);
      setSelectedServiceType(appointment.service_type_id || null);
      setSelectedTasks(appointment.service_tasks || []);
      setAdditionalNotes(appointment.additional_notes || '');
      if (appointment.client) {
        setSelectedClient(appointment.client);
      }
    } else if (isOpen) {
      setFormData({
        client_id: '',
        cleaner_id: '',
        scheduled_at: new Date().toISOString(),
        status: 'scheduled',
        description: '',
        service_type_id: null,
        service_tasks: [],
        additional_notes: null,
        frequency: null,
        service_location_id: ''
      });
      setSelectedServiceType(null);
      setSelectedTasks([]);
      setAdditionalNotes('');
      setSelectedClient(null);
      setSelectedLocation(null);
      setPreferredTime(null);
    }
  }, [isOpen, appointment]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setServiceTypes(data || []);
    } catch (error) {
      console.error('Error fetching service types:', error);
    }
  };

  const fetchServiceTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('service_tasks')
        .select('*')
        .order('name');

      if (error) throw error;
      setServiceTasks(data || []);
    } catch (error) {
      console.error('Error fetching service tasks:', error);
    }
  };

  const fetchClientAddresses = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_locations')
        .select('*')
        .eq('client_id', clientId);

      if (error) throw error;
      
      const addresses = data || [];
      setClientAddresses(addresses);

      // If client has only one address, select it automatically
      if (addresses.length === 1) {
        setSelectedLocation(addresses[0]);
        setFormData(prev => ({
          ...prev,
          service_location_id: addresses[0].id
        }));
      } else {
        // Reset location selection if client has multiple addresses
        setSelectedLocation(null);
        setFormData(prev => ({
          ...prev,
          service_location_id: null
        }));
      }
    } catch (error) {
      console.error('Error fetching client addresses:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client = 'Selecione um cliente';
    }
    if (!formData.cleaner_id) {
      newErrors.cleaner = 'Selecione um limpador';
    }
    if (!formData.scheduled_at) {
      newErrors.scheduled_at = 'Data e hora são obrigatórios';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('Selected service type before submit:', selectedServiceType);
      console.log('Form data before submit:', formData);
      console.log('Service types available:', serviceTypes);
      
      const serviceType = serviceTypes.find(st => st.id === selectedServiceType);
      console.log('Found service type:', serviceType);
      
      // Combine date and time into scheduled_at, adjusting for Brazil timezone (GMT-3)
      const date = formData.date as string;
      const time = formData.time as string;
      let scheduled_at: string | undefined;
      
      if (date && time) {
        // Create a date object in local time
        const localDate = new Date(`${date}T${time}:00`);
        // Adjust for Brazil timezone (GMT-3)
        const brazilDate = addHours(localDate, -3);
        // Format to ISO string
        scheduled_at = brazilDate.toISOString();
      }

      // Create a new object without date and time fields
      const { date: _, time: __, ...formDataWithoutDateTime } = formData;

      // Remove any nested objects that shouldn't be sent to the database
      const { cleaner, client, service_location, service_type, ...cleanFormData } = formDataWithoutDateTime;

      const appointmentData = {
        ...cleanFormData,
        scheduled_at: scheduled_at || formData.scheduled_at,
        service_type_id: selectedServiceType,
        service_tasks: selectedTasks,
        additional_notes: additionalNotes,
        frequency: serviceType?.frequency || null
      };
      
      console.log('Final appointment data to be saved:', appointmentData);
      console.log('Service type ID in final data:', appointmentData.service_type_id);

      await onSave(appointmentData);
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
      setErrors({ submit: 'Erro ao salvar o agendamento' });
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    if (client) {
      setFormData(prev => ({
        ...prev,
        client_id: client.id,
        service_location_id: null // Reset location when client changes
      }));
      fetchClientAddresses(client.id);
      
      // Set preferred time if available
      if (client.preferred_time) {
        setPreferredTime(client.preferred_time);
        // Set the time in the form data
        setFormData(prev => ({
          ...prev,
          time: client.preferred_time
        }));
      } else {
        setPreferredTime(null);
      }
    } else {
      setClientAddresses([]);
      setSelectedLocation(null);
      setPreferredTime(null);
    }
  };

  const handleLocationChange = (locationId: string) => {
    const location = clientAddresses.find(loc => loc.id === locationId);
    setSelectedLocation(location || null);
    if (location) {
      setFormData(prev => ({
        ...prev,
        service_location_id: location.id
      }));
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'additional_notes') {
      setAdditionalNotes(value);
      setFormData(prev => ({
        ...prev,
        additional_notes: value
      }));
    } else {
      console.log(`Input change - field: ${field}, value:`, value);
      setFormData(prev => {
        const newData = {
          ...prev,
          [field]: value
        };
        console.log('Updated formData:', newData);
        return newData;
      });
    }
  };

  const mapCenter = formData.latitude && formData.longitude
    ? { lat: formData.latitude, lng: formData.longitude }
    : DEFAULT_CENTER;

  // Add useEffect to handle date/time initialization
  useEffect(() => {
    if (isOpen && appointment) {
      // If we have an existing appointment, split scheduled_at into date and time
      if (appointment.scheduled_at) {
        const date = new Date(appointment.scheduled_at);
        const formattedDate = date.toISOString().split('T')[0];
        const formattedTime = date.toTimeString().slice(0, 5);
        
        setFormData(prev => ({
          ...prev,
          date: formattedDate,
          time: formattedTime
        }));
      }
    }
  }, [isOpen, appointment]);

  // Add useEffect to handle date/time changes
  useEffect(() => {
    if (formData.date && formData.time) {
      // Create a date object in local time
      const localDate = new Date(`${formData.date}T${formData.time}:00`);
      // Adjust for Brazil timezone (GMT-3)
      const brazilDate = addHours(localDate, -3);
      // Format to ISO string
      const scheduled_at = brazilDate.toISOString();
      
      setFormData(prev => ({
        ...prev,
        scheduled_at
      }));
    }
  }, [formData.date, formData.time]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className={modalStyles.overlay} aria-hidden="true" />
      <div className={modalStyles.container}>
        <Dialog.Panel className={`${modalStyles.content} max-h-[90vh] flex flex-col`}>
          <div className={modalStyles.header}>
            <Dialog.Title className={modalStyles.title}>
              {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {errors.submit && (
                <div className="bg-error-50 border border-error-200 rounded-md p-3">
                  <p className="text-sm text-error-600">{errors.submit}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    <User className="w-4 h-4 inline-block mr-1" />
                    Cliente
                  </label>
                  <select
                    value={formData.client_id || ''}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className={`${inputStyles.base} ${
                      errors.client ? inputStyles.error : ''
                    }`}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {errors.client && (
                    <p className="mt-1 text-sm text-error-600">{errors.client}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    <User className="w-4 h-4 inline-block mr-1" />
                    Limpador
                  </label>
                  <select
                    value={formData.cleaner_id || ''}
                    onChange={(e) => handleInputChange('cleaner_id', e.target.value)}
                    className={`${inputStyles.base} ${
                      errors.cleaner ? inputStyles.error : ''
                    }`}
                    required
                  >
                    <option value="">Selecione um limpador</option>
                    {cleaners.map((cleaner) => (
                      <option key={cleaner.id} value={cleaner.id}>
                        {cleaner.name}
                      </option>
                    ))}
                  </select>
                  {errors.cleaner && (
                    <p className="mt-1 text-sm text-error-600">{errors.cleaner}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    Data
                  </label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={`${inputStyles.base} ${
                      errors.date ? inputStyles.error : ''
                    }`}
                    required
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-error-600">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    <Clock className="w-4 h-4 inline-block mr-1" />
                    Horário
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={formData.time || ''}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className={`${inputStyles.base} flex-1 ${
                        errors.time ? inputStyles.error : ''
                      }`}
                      required
                    />
                    {preferredTime && (
                      <div className="flex items-center gap-1 text-sm text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        <Clock className="w-4 h-4" />
                        <span>Preferência: {preferredTime}</span>
                      </div>
                    )}
                  </div>
                  {errors.time && (
                    <p className="mt-1 text-sm text-error-600">{errors.time}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    <MapPin className="w-4 h-4 inline-block mr-1" />
                    Local
                  </label>
                  <select
                    value={formData.service_location_id || ''}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className={`${inputStyles.base} ${
                      errors.location ? inputStyles.error : ''
                    }`}
                    required
                    disabled={!selectedClient || clientAddresses.length === 0}
                  >
                    <option value="">Selecione um local</option>
                    {clientAddresses.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.street}, {location.street_number} - {location.neighborhood}
                      </option>
                    ))}
                  </select>
                  {errors.location && (
                    <p className="mt-1 text-sm text-error-600">{errors.location}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    <Briefcase className="w-4 h-4 inline-block mr-1" />
                    Tipo de Serviço
                  </label>
                  <select
                    value={formData.service_type_id || ''}
                    onChange={(e) => handleInputChange('service_type_id', e.target.value)}
                    className={inputStyles.base}
                  >
                    <option value="">Selecione um tipo de serviço</option>
                    {serviceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    <CheckSquare className="w-4 h-4 inline-block mr-1" />
                    Tarefas Adicionais
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {serviceTasks.map((task) => (
                      <label key={task.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks(prev => [...prev, task.id]);
                            } else {
                              setSelectedTasks(prev => prev.filter(id => id !== task.id));
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        />
                        <span className="text-sm text-secondary-700">{task.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    <FileText className="w-4 h-4 inline-block mr-1" />
                    Observações
                  </label>
                  <textarea
                    value={formData.additional_notes || ''}
                    onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                    className={inputStyles.base}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className={modalStyles.footer}>
              <button
                type="button"
                onClick={onClose}
                className={createComponentStyle(buttonStyles, 'secondary')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={createComponentStyle(buttonStyles, 'primary')}
              >
                {appointment ? 'Salvar Alterações' : 'Criar Agendamento'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AppointmentModal;