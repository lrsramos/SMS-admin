import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfToday, endOfToday, isToday, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  MapPin,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Appointment, Cleaner, Client, ServiceLocation } from '../types/models';

interface AppointmentWithRelations extends Appointment {
  cleaners: Cleaner;
  clients: Client;
  service_locations: ServiceLocation;
}

const Dashboard = () => {
  const { data: allAppointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: async () => {
      // First, fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_at', { ascending: true });
      
      if (appointmentsError) throw appointmentsError;

      if (appointmentsData && appointmentsData.length > 0) {
        // Get unique IDs for related data
        const clientIds = [...new Set(appointmentsData.map(a => a.client_id))];
        const cleanerIds = [...new Set(appointmentsData.map(a => a.cleaner_id))];
        const locationIds = [...new Set(appointmentsData.map(a => a.service_location_id))];

        // Fetch related data in parallel
        const [
          { data: clientsData, error: clientsError },
          { data: cleanersData, error: cleanersError },
          { data: locationsData, error: locationsError }
        ] = await Promise.all([
          supabase.from('clients').select('*').in('id', clientIds),
          supabase.from('cleaners').select('*').in('id', cleanerIds),
          supabase.from('service_locations').select('*').in('id', locationIds)
        ]);

        if (clientsError) throw clientsError;
        if (cleanersError) throw cleanersError;
        if (locationsError) throw locationsError;

        // Combine the data
        const enrichedAppointments = appointmentsData.map(appointment => ({
          ...appointment,
          client: clientsData?.find(c => c.id === appointment.client_id),
          cleaner: cleanersData?.find(c => c.id === appointment.cleaner_id),
          service_location: locationsData?.find(l => l.id === appointment.service_location_id)
        }));

        return enrichedAppointments as unknown as AppointmentWithRelations[];
      }

      return [] as AppointmentWithRelations[];
    },
  });

  const { data: activeCleaners, isLoading: isLoadingCleaners } = useQuery({
    queryKey: ['cleaners', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cleaners')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as Cleaner[];
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ['appointments', 'metrics'],
    queryFn: async () => {
      const start = startOfToday();
      const end = endOfToday();
      
      const { data: allAppointments, error } = await supabase
        .from('appointments')
        .select('status, scheduled_at');
      
      if (error) throw error;

      const today = allAppointments?.filter(apt => 
        isToday(new Date(apt.scheduled_at))
      ) || [];

      return {
        scheduled: today.filter(apt => apt.status === 'scheduled').length,
        inProgress: today.filter(apt => apt.status === 'in_progress').length,
        completed: today.filter(apt => apt.status === 'completed').length,
        total: today.length
      };
    },
  });

  // Group appointments by date
  const groupedAppointments = React.useMemo(() => {
    if (!allAppointments) return {};
    
    return allAppointments.reduce((acc, appointment) => {
      const date = format(parseISO(appointment.scheduled_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(appointment);
      return acc;
    }, {} as Record<string, AppointmentWithRelations[]>);
  }, [allAppointments]);

  // Sort dates in ascending order
  const sortedDates = React.useMemo(() => {
    return Object.keys(groupedAppointments).sort();
  }, [groupedAppointments]);

  // Format address
  const formatAddress = (location: ServiceLocation) => {
    if (!location) return '';
    return `${location.street}, ${location.street_number} - ${location.neighborhood}, ${location.city}/${location.state}`;
  };

  // Format status
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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoadingAppointments || isLoadingCleaners) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
        <div className="text-sm text-gray-500">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Agendados Hoje</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics?.scheduled || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics?.inProgress || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concluídos Hoje</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics?.completed || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Limpadores Ativos</p>
              <p className="text-2xl font-semibold text-gray-900">{activeCleaners?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Agendamentos</h2>
              <Link 
                to="/appointments" 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                Ver Todos
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {sortedDates.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhum agendamento encontrado
              </div>
            ) : (
              sortedDates.map((date) => (
                <div key={date} className="p-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <div className="space-y-4">
                    {groupedAppointments[date].map((appointment) => (
                      <div key={appointment.id} className="hover:bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-3">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {appointment.client?.name}
                              </p>
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}
                              >
                                {getStatusText(appointment.status)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <p>{format(parseISO(appointment.scheduled_at), 'HH:mm')}</p>
                              <span>&middot;</span>
                              <MapPin className="h-4 w-4" />
                              <p className="truncate">
                                {appointment.service_location ? formatAddress(appointment.service_location) : 'Endereço não disponível'}
                              </p>
                            </div>
                            <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                              <Users className="h-4 w-4" />
                              <p>{appointment.cleaner?.name}</p>
                              {appointment.description && (
                                <>
                                  <span>&middot;</span>
                                  <p className="truncate">{appointment.description}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cleaners Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Status dos Limpadores</h2>
              <Link 
                to="/live" 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                Ver Localização
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {activeCleaners?.map((cleaner) => {
              const currentAppointment = allAppointments?.find(
                apt => apt.cleaner_id === cleaner.id && apt.status === 'in_progress'
              );

              return (
                <div key={cleaner.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cleaner.name}</p>
                        <div className="flex items-center mt-1">
                          {currentAppointment ? (
                            <>
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <p className="ml-1.5 text-sm text-gray-500">
                                Em serviço: {currentAppointment.client?.name}
                              </p>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                              <p className="ml-1.5 text-sm text-gray-500">Disponível</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;