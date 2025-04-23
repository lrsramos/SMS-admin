import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfToday, endOfToday, isToday } from 'date-fns';
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
import { Appointment, Cleaner } from '../types';

const Dashboard = () => {
  const { data: todayAppointments, isLoading: isLoadingToday } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const start = startOfToday();
      const end = endOfToday();
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          cleaners (
            name,
            email,
            personal_phone,
            company_phone
          )
        `)
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString())
        .order('scheduled_at');
      
      if (error) throw error;
      return data as (Appointment & { cleaners: Cleaner })[];
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

  if (isLoadingToday || isLoadingCleaners) {
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
        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Agendamentos de Hoje</h2>
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
            {todayAppointments?.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhum agendamento para hoje
              </div>
            ) : (
              todayAppointments?.map((appointment) => (
                <div key={appointment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {appointment.client_name}
                        </p>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {appointment.status === 'completed'
                            ? 'Concluído'
                            : appointment.status === 'in_progress'
                            ? 'Em Andamento'
                            : 'Agendado'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <p>{format(new Date(appointment.scheduled_at), 'HH:mm')}</p>
                        <span>&middot;</span>
                        <MapPin className="h-4 w-4" />
                        <p className="truncate">{appointment.address}</p>
                      </div>
                    </div>
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
              const currentAppointment = todayAppointments?.find(
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
                                Em serviço: {currentAppointment.client_name}
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