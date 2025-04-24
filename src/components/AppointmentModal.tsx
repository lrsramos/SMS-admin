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
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
          <div className="flex justify-between items-center p-6 border-b">
            <Dialog.Title className="text-xl font-semibold">
              {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline-block mr-1" />
                  Cliente
                </label>
                <select
                  value={formData.client_id || ''}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.client ? 'border-red-300' : 'border-gray-300'
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
                  <p className="mt-1 text-sm text-red-600">{errors.client}</p>
                )}
              </div>

              {selectedClient && serviceLocations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline-block mr-1" />
                    Local de Serviço
                  </label>
                  <select
                    value={selectedLocation?.id || ''}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Selecione um endereço</option>
                    {serviceLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {[
                          location.street,
                          location.street_number,
                          location.neighborhood,
                        ].filter(Boolean).join(', ')}
                        {location.is_primary && ' (Principal)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Map */}
              {formData.latitude && formData.longitude && (
                <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                  <MapContainer
                    center={mapCenter}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={mapCenter} icon={customIcon}>
                      <Popup>
                        <div className="text-sm">
                          <p className="font-medium">{formData.client_name}</p>
                          <p>{formData.address}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Briefcase className="w-4 h-4 inline-block mr-1" />
                  Limpador
                </label>
                <select
                  value={formData.cleaner_id || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, cleaner_id: e.target.value })
                  }
                  className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.cleaner ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um limpador</option>
                  {cleaners.map((cleaner) => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.name}
                    </option>
                  ))}
                </select>
                {errors.cleaner && (
                  <p className="mt-1 text-sm text-red-600">{errors.cleaner}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline-block mr-1" />
                  Data e Hora
                </label>
                <input
                  type="datetime-local"
                  value={format(new Date(formData.scheduled_at || ''), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduled_at: new Date(e.target.value).toISOString(),
                    })
                  }
                  className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.scheduled_at ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.scheduled_at && (
                  <p className="mt-1 text-sm text-red-600">{errors.scheduled_at}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Briefcase className="w-4 h-4 inline-block mr-1" />
                  Tipo de Serviço
                </label>
                <select
                  value={selectedServiceType || ''}
                  onChange={(e) => setSelectedServiceType(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Selecione um tipo de serviço</option>
                  {serviceTypes.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CheckSquare className="w-4 h-4 inline-block mr-1" />
                  Tarefas Adicionais
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {serviceTasks.map((task) => (
                    <label key={task.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTasks([...selectedTasks, task.id]);
                          } else {
                            setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                          }
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">{task.name}</span>
                        <p className="text-xs text-gray-500">{task.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4 inline-block mr-1" />
                  Observações Adicionais
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Instruções especiais ou observações..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : appointment ? 'Salvar Alterações' : 'Criar Agendamento'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AppointmentModal;