import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Appointment } from '../types';

const Dashboard = () => {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const scheduled = appointments?.filter(a => a.status === 'scheduled').length || 0;
  const inProgress = appointments?.filter(a => a.status === 'in_progress').length || 0;
  const completed = appointments?.filter(a => a.status === 'completed').length || 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Scheduled</h3>
          <p className="text-3xl font-bold text-blue-600">{scheduled}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">In Progress</h3>
          <p className="text-3xl font-bold text-yellow-600">{inProgress}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
          <p className="text-3xl font-bold text-green-600">{completed}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Agendamentos de Hoje</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments?.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(appointment.scheduled_at).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {appointment.status === 'completed' ? 'Concluído' :
                       appointment.status === 'in_progress' ? 'Em Andamento' :
                       'Agendado'}
                    </span>
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

export default Dashboard;