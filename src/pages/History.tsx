import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Dialog } from '@headlessui/react';
import { Calendar, Users, X, Clock, MapPin, User, FileText } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { Appointment, Cleaner, Client } from '../types';

interface CompletedAppointment extends Appointment {
  cleaners: { name: string };
}

const DEFAULT_CENTER = {
  lat: -23.5505,
  lng: -46.6333,
};

const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const History = () => {
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<CompletedAppointment | null>(null);
  const [dateRange, setDateRange] = React.useState({ start: '', end: '' });
  const [selectedCleaner, setSelectedCleaner] = React.useState('all');
  const [selectedClient, setSelectedClient] = React.useState('all');

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['completed-appointments', dateRange, selectedCleaner, selectedClient],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*, cleaners(name)')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (dateRange.start) {
        query = query.gte('completed_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('completed_at', dateRange.end);
      }
      if (selectedCleaner !== 'all') {
        query = query.eq('cleaner_id', selectedCleaner);
      }
      if (selectedClient !== 'all') {
        query = query.eq('client_name', selectedClient);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CompletedAppointment[];
    },
  });

  const { data: cleaners } = useQuery({
    queryKey: ['cleaners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cleaners')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Cleaner[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Client[];
    },
  });

  const handleViewDetails = (appointment: CompletedAppointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  if (isLoadingAppointments) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Histórico de Serviços</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limpador</label>
            <select
              value={selectedCleaner}
              onChange={(e) => setSelectedCleaner(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">Todos os Limpadores</option>
              {cleaners?.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">Todos os Clientes</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                Data de Conclusão
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duração
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Endereço
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments?.map((appointment) => {
              const duration = appointment.started_at && appointment.completed_at
                ? differenceInMinutes(new Date(appointment.completed_at), new Date(appointment.started_at))
                : 0;

              return (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {appointment.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appointment.cleaners?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(appointment.completed_at!), 'PPp')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {duration} minutos
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appointment.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleViewDetails(appointment)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Appointment Details Modal */}
      {isDetailsOpen && selectedAppointment && (
        <Dialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
              <div className="flex justify-between items-center p-6 border-b">
                <Dialog.Title className="text-xl font-semibold">
                  Detalhes do Agendamento
                </Dialog.Title>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Map */}
                {selectedAppointment.latitude && selectedAppointment.longitude && (
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-300 mb-6">
                    <MapContainer
                      center={{ lat: selectedAppointment.latitude, lng: selectedAppointment.longitude }}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker 
                        position={{ lat: selectedAppointment.latitude, lng: selectedAppointment.longitude }}
                        icon={customIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-medium">{selectedAppointment.client_name}</p>
                            <p>{selectedAppointment.address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-500">
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-sm">Cliente</span>
                    </div>
                    <p className="text-sm font-medium">{selectedAppointment.client_name}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-gray-500">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="text-sm">Limpador</span>
                    </div>
                    <p className="text-sm font-medium">{selectedAppointment.cleaners.name}</p>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center text-gray-500">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">Endereço</span>
                    </div>
                    <p className="text-sm font-medium">{selectedAppointment.address}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">Início</span>
                    </div>
                    <p className="text-sm font-medium">
                      {selectedAppointment.started_at
                        ? format(parseISO(selectedAppointment.started_at), 'PPp')
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">Conclusão</span>
                    </div>
                    <p className="text-sm font-medium">
                      {format(parseISO(selectedAppointment.completed_at!), 'PPp')}
                    </p>
                  </div>

                  {selectedAppointment.description && (
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center text-gray-500">
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="text-sm">Descrição</span>
                      </div>
                      <p className="text-sm font-medium">{selectedAppointment.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default History;