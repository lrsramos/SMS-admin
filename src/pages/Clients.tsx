import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Client, Appointment } from '../types';
import ClientModal from '../components/ClientModal';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Clients = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | undefined>();
  const [expandedClient, setExpandedClient] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          service_locations (*)
        `)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ['appointments', expandedClient],
    enabled: !!expandedClient,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select()
        .eq('client_name', expandedClient)
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return data as Appointment[];
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (newClient: Partial<Client>) => {
      const { service_locations, ...clientData } = newClient;
      
      // First create the client
      const { data: createdClient, error: clientError } = await supabase
        .from('clients')
        .insert([clientData])
        .select(`
          *,
          service_locations (*)
        `)
        .single();

      if (clientError) throw clientError;

      // Then create the service location if provided
      if (service_locations?.[0]) {
        const { id, client_id, created_at, ...serviceLocationData } = service_locations[0];
        const { error: locationError } = await supabase
          .from('service_locations')
          .insert([{
            ...serviceLocationData,
            client_id: createdClient.id,
          }])
          .select()
          .single();

        if (locationError) throw locationError;
      }

      // Fetch the complete client data with service locations
      const { data: finalClientData, error: fetchError } = await supabase
        .from('clients')
        .select(`
          *,
          service_locations (*)
        `)
        .eq('id', createdClient.id)
        .single();

      if (fetchError) throw fetchError;
      return finalClientData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (updatedClient: Partial<Client>) => {
      const { id, service_locations, ...clientData } = updatedClient;
      
      // Update client data
      const { error: clientError } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id);

      if (clientError) throw clientError;

      // Update service location if provided
      if (service_locations?.[0]) {
        const serviceLocation = service_locations[0];
        const { id: locationId, client_id, created_at, ...serviceLocationData } = serviceLocation;
        
        if (locationId) {
          // Update existing service location
          const { error: locationError } = await supabase
            .from('service_locations')
            .update({
              ...serviceLocationData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', locationId);

          if (locationError) throw locationError;
        } else {
          // Create new service location
          const { error: locationError } = await supabase
            .from('service_locations')
            .insert([{
              ...serviceLocationData,
              client_id: id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }]);

          if (locationError) throw locationError;
        }
      }

      // Fetch and return updated client data
      const { data: updatedClientData, error: fetchError } = await supabase
        .from('clients')
        .select(`
          *,
          service_locations (*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return updatedClientData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const handleSaveClient = async (clientData: Partial<Client>) => {
    if (selectedClient) {
      await updateClientMutation.mutateAsync({
        ...clientData,
        id: selectedClient.id,
      });
    } else {
      await createClientMutation.mutateAsync(clientData);
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

  if (isLoadingClients) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <button
          onClick={() => {
            setSelectedClient(undefined);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clients?.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{client.name}</h2>
                <button
                  onClick={() => {
                    setSelectedClient(client);
                    setIsModalOpen(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Editar
                </button>
              </div>

              <div className="space-y-2">
                {client.service_locations?.[0] && (
                  <div className="flex items-start text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                    <span className="whitespace-pre-wrap">
                      {`${client.service_locations[0].street}, ${client.service_locations[0].street_number}${client.service_locations[0].complemento ? ` - ${client.service_locations[0].complemento}` : ''}\n${client.service_locations[0].neighborhood}, ${client.service_locations[0].city} - ${client.service_locations[0].state}\nCEP: ${client.service_locations[0].postal_code}`}
                    </span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <a href={`mailto:${client.email}`} className="hover:text-blue-600">
                      {client.email}
                    </a>
                  </div>
                )}
                {client.telefone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <a href={`tel:${client.telefone}`} className="hover:text-blue-600">
                      {client.telefone}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {client.service_locations?.[0]?.tipo_piscina && (
                  <div>
                    <span className="font-medium">Tipo de Piscina:</span> {client.service_locations[0].tipo_piscina}
                  </div>
                )}
                {client.service_locations?.[0]?.tamanho_piscina && (
                  <div>
                    <span className="font-medium">Tamanho:</span> {client.service_locations[0].tamanho_piscina}
                  </div>
                )}
                {client.frequencia_limpeza && (
                  <div>
                    <span className="font-medium">Frequência:</span> {client.frequencia_limpeza}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setExpandedClient(expandedClient === client.name ? null : client.name)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  {expandedClient === client.name ? 'Ocultar Agendamentos' : 'Ver Agendamentos'}
                </button>

                {expandedClient === client.name && appointments && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Agendamentos Recentes</h3>
                    {appointments.length > 0 ? (
                      appointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="text-sm p-3 bg-gray-50 rounded-md"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">
                              {format(parseISO(appointment.scheduled_at), "PPp", { locale: ptBR })}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium
                                ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-blue-100 text-blue-800'}`}
                            >
                              {getStatusText(appointment.status)}
                            </span>
                          </div>
                          {appointment.description && (
                            <p className="mt-1 text-gray-600">{appointment.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum agendamento encontrado</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClient(undefined);
        }}
        client={selectedClient}
        onSave={handleSaveClient}
      />
    </div>
  );
};

export default Clients