import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { MapPin, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Appointment, Cleaner } from '../types';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYm9sdC1kZW1vIiwiYSI6ImNsc3ZjOWF2cjBjOTYya3BlZzVxYmxqbWsifQ.84xvz1hJE4mhqwI-BmZEtQ';

interface ActiveAppointment extends Appointment {
  cleaners: { name: string };
}

const LiveLocation = () => {
  const [selectedAppointment, setSelectedAppointment] = React.useState<ActiveAppointment | null>(null);
  const [selectedCleaner, setSelectedCleaner] = React.useState<string>('all');
  const [viewport, setViewport] = React.useState({
    latitude: -23.5505,  // São Paulo coordinates as default
    longitude: -46.6333,
    zoom: 11
  });

  const { data: activeAppointments, isLoading: isLoadingAppointments, refetch } = useQuery({
    queryKey: ['active-appointments', selectedCleaner],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*, cleaners(name)')
        .eq('status', 'in_progress');

      if (selectedCleaner !== 'all') {
        query = query.eq('cleaner_id', selectedCleaner);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActiveAppointment[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: cleaners } = useQuery({
    queryKey: ['cleaners'],
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

  const handleMarkerClick = (appointment: ActiveAppointment) => {
    setSelectedAppointment(appointment);
    setViewport({
      ...viewport,
      latitude: appointment.latitude || viewport.latitude,
      longitude: appointment.longitude || viewport.longitude,
    });
  };

  if (isLoadingAppointments) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Live Location</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedCleaner}
            onChange={(e) => setSelectedCleaner(e.target.value)}
            className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Cleaners</option>
            {cleaners?.map((cleaner) => (
              <option key={cleaner.id} value={cleaner.id}>
                {cleaner.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="flex items-center px-3 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <Map
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <NavigationControl position="top-right" />
          
          {activeAppointments?.map((appointment) => (
            appointment.latitude && appointment.longitude ? (
              <Marker
                key={appointment.id}
                latitude={appointment.latitude}
                longitude={appointment.longitude}
                onClick={() => handleMarkerClick(appointment)}
              >
                <div className="cursor-pointer">
                  <MapPin className="w-8 h-8 text-blue-600 -translate-x-1/2 -translate-y-full" />
                </div>
              </Marker>
            ) : null
          ))}

          {selectedAppointment && selectedAppointment.latitude && selectedAppointment.longitude && (
            <Popup
              latitude={selectedAppointment.latitude}
              longitude={selectedAppointment.longitude}
              onClose={() => setSelectedAppointment(null)}
              closeButton={true}
              closeOnClick={false}
              offset={[0, -20]}
            >
              <div className="p-2">
                <h3 className="font-semibold text-gray-900">{selectedAppointment.cleaners.name}</h3>
                <p className="text-sm text-gray-600">{selectedAppointment.client_name}</p>
                <p className="text-sm text-gray-600">{selectedAppointment.address}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Started: {formatDistanceToNow(parseISO(selectedAppointment.started_at!), { addSuffix: true })}
                </p>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Active Services</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cleaner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeAppointments?.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleMarkerClick(appointment)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {appointment.cleaners.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appointment.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appointment.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(appointment.started_at!), 'p')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(parseISO(appointment.started_at!))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiveLocation;