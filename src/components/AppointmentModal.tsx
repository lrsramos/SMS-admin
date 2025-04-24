import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, MapPin, Calendar, Clock, User, Briefcase, FileText, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
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
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ServiceLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      frequency: null
    }
  );
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

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
        frequency: null
      });
      setSelectedServiceType(null);
      setSelectedTasks([]);
      setAdditionalNotes('');
      setSelectedClient(null);
      setSelectedLocation(null);
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
      const serviceType = serviceTypes.find(st => st.id === selectedServiceType);
      await onSave({
        ...formData,
        service_type_id: selectedServiceType,
        service_tasks: selectedTasks,
        additional_notes: additionalNotes,
        frequency: serviceType?.frequency || null
      });
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
      }));
    }
  };

  const handleLocationChange = (locationId: string) => {
    const location = serviceLocations.find(loc => loc.id === locationId);
    setSelectedLocation(location || null);
    if (location) {
      setFormData(prev => ({
        ...prev,
        service_location_id: location.id
      }));
    }
  };

  const mapCenter = formData.latitude && formData.longitude
    ? { lat: formData.latitude, lng: formData.longitude }
    : DEFAULT_CENTER;

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
                  <input
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className={`${inputStyles.base} ${
                      errors.time ? inputStyles.error : ''
                    }`}
                    required
                  />
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
                    value={formData.location_id || ''}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className={`${inputStyles.base} ${
                      errors.location ? inputStyles.error : ''
                    }`}
                    required
                  >
                    <option value="">Selecione um local</option>
                    {selectedClient?.service_locations?.map((location) => (
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
                          checked={formData.service_tasks?.includes(task.id) || false}
                          onChange={(e) => {
                            const tasks = formData.service_tasks || [];
                            if (e.target.checked) {
                              handleInputChange('service_tasks', [...tasks, task.id]);
                            } else {
                              handleInputChange(
                                'service_tasks',
                                tasks.filter((id) => id !== task.id)
                              );
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
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
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