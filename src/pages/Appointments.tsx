// Appointments page component
import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Filter, MapPin, Clock, User, Calendar } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Appointment, Cleaner, Client, ServiceLocation, ServiceTask, ServiceType } from '../types/models';
import AppointmentModal from '../components/AppointmentModal';
import { supabase } from '../lib/supabase';

const DEFAULT_CENTER = {
  lat: -23.5505,
  lng: -46.6333,
};

const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [serviceTasks, setServiceTasks] = useState<ServiceTask[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>();
  const [filters, setFilters] = useState({
    dateRange: 'all',
    cleanerId: '',
    status: 'all',
    clientId: '',
    searchTerm: '',
    customDateStart: '',
    customDateEnd: '',
  });
  const [loading, setLoading] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchCleaners();
    fetchClients();
    fetchServiceLocations();
    fetchServiceTasks();
    fetchServiceTypes();
  }, [filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // First, let's fetch just the appointments
      let query = supabase
        .from('appointments')
        .select('*');

      if (filters.dateRange !== 'all') {
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        switch (filters.dateRange) {
          case 'today':
            startDate = startOfDay(new Date());
            endDate = endOfDay(new Date());
            break;
          case 'week':
            startDate = startOfWeek(new Date(), { weekStartsOn: 0 });
            endDate = endOfWeek(new Date(), { weekStartsOn: 0 });
            break;
          case 'lastWeek':
            startDate = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });
            endDate = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });
            break;
          case 'custom':
            if (filters.customDateStart && filters.customDateEnd) {
              startDate = new Date(filters.customDateStart);
              endDate = new Date(filters.customDateEnd);
            }
            break;
          default:
            break;
        }

        if (startDate && endDate) {
          query = query
            .gte('scheduled_at', startDate.toISOString())
            .lte('scheduled_at', endDate.toISOString());
        }
      }

      if (filters.cleanerId) {
        query = query.eq('cleaner_id', filters.cleanerId);
      }

      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data: appointmentsData, error: appointmentsError } = await query.order('scheduled_at', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Now let's fetch related data separately
      if (appointmentsData && appointmentsData.length > 0) {
        const clientIds = [...new Set(appointmentsData.map(a => a.client_id))];
        const cleanerIds = [...new Set(appointmentsData.map(a => a.cleaner_id))];
        const locationIds = [...new Set(appointmentsData.map(a => a.service_location_id))];
        const serviceTypeIds = [...new Set(appointmentsData.map(a => a.service_type_id).filter(Boolean))];

        const [
          { data: clientsData, error: clientsError },
          { data: cleanersData, error: cleanersError },
          { data: locationsData, error: locationsError },
          { data: serviceTypesData, error: serviceTypesError }
        ] = await Promise.all([
          supabase.from('clients').select('*').in('id', clientIds),
          supabase.from('cleaners').select('*').in('id', cleanerIds),
          supabase.from('service_locations').select('*').in('id', locationIds),
          serviceTypeIds.length > 0 ? supabase.from('service_types').select('*').in('id', serviceTypeIds) : Promise.resolve({ data: [], error: null })
        ]);

        if (clientsError) throw clientsError;
        if (cleanersError) throw cleanersError;
        if (locationsError) throw locationsError;
        if (serviceTypesError) throw serviceTypesError;

        // Map related data to appointments
        const enrichedAppointments = appointmentsData.map(appointment => ({
          ...appointment,
          client: clientsData?.find(c => c.id === appointment.client_id),
          cleaner: cleanersData?.find(c => c.id === appointment.cleaner_id),
          service_location: locationsData?.find(l => l.id === appointment.service_location_id),
          service_type: serviceTypesData?.find(t => t.id === appointment.service_type_id)
        }));

        setAppointments(enrichedAppointments as unknown as Appointment[]);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select('*')
        .order('name');

      if (error) throw error;
      setCleaners(data || []);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data as unknown as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchServiceLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('service_locations')
        .select('*');

      if (error) throw error;
      setServiceLocations(data as unknown as ServiceLocation[]);
    } catch (error) {
      console.error('Error fetching service locations:', error);
    }
  };

  const fetchServiceTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('service_tasks')
        .select('*');

      if (error) throw error;
      setServiceTasks(data as unknown as ServiceTask[]);
    } catch (error) {
      console.error('Error fetching service tasks:', error);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*');

      if (error) throw error;
      setServiceTypes(data as unknown as ServiceType[]);
    } catch (error) {
      console.error('Error fetching service types:', error);
    }
  };

  const handleSaveAppointment = async (appointment: Partial<Appointment>) => {
    try {
      // Validate required fields
      if (!appointment.client_id || !appointment.cleaner_id || !appointment.scheduled_at || !appointment.service_location_id) {
        throw new Error('Missing required fields');
      }

      const appointmentData = {
        client_id: appointment.client_id,
        cleaner_id: appointment.cleaner_id,
        scheduled_at: appointment.scheduled_at,
        status: appointment.status || 'scheduled',
        service_location_id: appointment.service_location_id,
        service_type_id: appointment.service_type_id || null,
        service_tasks: appointment.service_tasks || [],
        additional_notes: appointment.additional_notes || '',
        description: appointment.description || '',
        frequency: appointment.frequency || null
      };

      // Log the appointment data being saved
      console.log('Saving appointment data:', appointmentData);
      console.log('Original appointment data:', appointment);
      console.log('Additional notes value:', appointment.additional_notes);
      console.log('Service type ID value:', appointment.service_type_id);
      console.log('Service type ID in appointmentData:', appointmentData.service_type_id);
      console.log('Frequency value:', appointment.frequency);
      console.log('Frequency in appointmentData:', appointmentData.frequency);

      if (selectedAppointment) {
        console.log('Updating existing appointment with ID:', selectedAppointment.id);
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', selectedAppointment.id);

        if (error) {
          console.error('Error updating appointment:', error);
          throw error;
        }
        console.log('Appointment updated successfully');
      } else {
        console.log('Creating new appointment');
        const { error } = await supabase
          .from('appointments')
          .insert([appointmentData]);

        if (error) {
          console.error('Error creating appointment:', error);
          throw error;
        }
        console.log('Appointment created successfully');
      }

      fetchAppointments();
      setIsModalOpen(false);
      setSelectedAppointment(undefined);
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-5 w-5 inline-block mr-1" />
          Novo Agendamento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">Todos</option>
                <option value="today">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="lastWeek">Semana Passada</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {filters.dateRange === 'custom' && (
              <div className="flex gap-2 flex-1 min-w-[300px]">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={filters.customDateStart}
                    onChange={(e) =>
                      setFilters({ ...filters, customDateStart: e.target.value })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={filters.customDateEnd}
                    onChange={(e) =>
                      setFilters({ ...filters, customDateEnd: e.target.value })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limpador
              </label>
              <select
                value={filters.cleanerId}
                onChange={(e) =>
                  setFilters({ ...filters, cleanerId: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Todos os Limpadores</option>
                {cleaners.map((cleaner) => (
                  <option key={cleaner.id} value={cleaner.id}>
                    {cleaner.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                value={filters.clientId}
                onChange={(e) =>
                  setFilters({ ...filters, clientId: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Todos os Clientes</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">Todos os Status</option>
                <option value="scheduled">Agendado</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluído</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              placeholder="Buscar por cliente ou endereço..."
              className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limpador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data e Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endereço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Serviço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarefas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Nenhum agendamento encontrado
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr 
                    key={appointment.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.client?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.cleaner?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(appointment.scheduled_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2">
                        {appointment.service_location ? 
                          `${appointment.service_location.street}, ${appointment.service_location.street_number} - ${appointment.service_location.neighborhood}, ${appointment.service_location.city}` 
                          : 'Endereço não disponível'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {appointment.service_type_id ? (
                          serviceTypes.find(type => type.id === appointment.service_type_id)?.name || 'Tipo não encontrado'
                        ) : (
                          'Não especificado'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {appointment.service_tasks && appointment.service_tasks.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {appointment.service_tasks.map((taskId) => {
                              const task = serviceTasks.find(t => t.id === taskId);
                              return task ? (
                                <span key={taskId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {task.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          'Nenhuma tarefa'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(appointment);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAppointment(appointment.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(undefined);
        }}
        appointment={selectedAppointment}
        cleaners={cleaners}
        onSave={handleSaveAppointment}
      />

      {/* Appointment Details Modal */}
      {isDetailsModalOpen && selectedAppointment && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsDetailsModalOpen(false)}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Detalhes do Agendamento
                    </h3>
                    
                    {selectedAppointment.service_location?.latitude && selectedAppointment.service_location?.longitude && (
                      <div className="h-64 rounded-lg overflow-hidden border border-gray-300 mb-4">
                        <MapContainer
                          center={{ 
                            lat: selectedAppointment.service_location.latitude, 
                            lng: selectedAppointment.service_location.longitude 
                          }}
                          zoom={15}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          <Marker 
                            position={{ 
                              lat: selectedAppointment.service_location.latitude, 
                              lng: selectedAppointment.service_location.longitude 
                            }}
                            icon={customIcon}
                          >
                            <Popup>
                              <div className="text-sm">
                                <p className="font-medium">{selectedAppointment.client?.name}</p>
                                <p>{`${selectedAppointment.service_location.street}, ${selectedAppointment.service_location.street_number}`}</p>
                              </div>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    )}

                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Cliente</p>
                          <p className="text-sm text-gray-900">{selectedAppointment.client?.name}</p>
                          <p className="text-xs text-gray-500">{selectedAppointment.client?.email}</p>
                          <p className="text-xs text-gray-500">{selectedAppointment.client?.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Data e Hora</p>
                          <p className="text-sm text-gray-900">
                            {format(new Date(selectedAppointment.scheduled_at), "PPp", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Endereço</p>
                          {selectedAppointment.service_location ? (
                            <>
                              <p className="text-sm text-gray-900">
                                {`${selectedAppointment.service_location.street}, ${selectedAppointment.service_location.street_number}`}
                              </p>
                              <p className="text-sm text-gray-900">
                                {`${selectedAppointment.service_location.neighborhood}`}
                              </p>
                              <p className="text-sm text-gray-900">
                                {`${selectedAppointment.service_location.city} - ${selectedAppointment.service_location.state}`}
                              </p>
                              <p className="text-sm text-gray-900">
                                {selectedAppointment.service_location.zip_code}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">Endereço não disponível</p>
                          )}
                        </div>
                      </div>

                      {selectedAppointment.description && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Descrição</p>
                          <p className="text-sm text-gray-900 mt-1">
                            {selectedAppointment.description}
                          </p>
                        </div>
                      )}

                      {selectedAppointment.additional_notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Notas Adicionais</p>
                          <p className="text-sm text-gray-900 mt-1">
                            {selectedAppointment.additional_notes}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <span
                          className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            selectedAppointment.status
                          )}`}
                        >
                          {getStatusText(selectedAppointment.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;