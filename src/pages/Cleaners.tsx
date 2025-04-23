import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Mail, Phone, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cleaner } from '../types';
import CleanerModal from '../components/CleanerModal';

const Cleaners = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCleaner, setSelectedCleaner] = React.useState<Cleaner | undefined>();
  const queryClient = useQueryClient();

  const { data: cleaners, isLoading } = useQuery({
    queryKey: ['cleaners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cleaners')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Cleaner[];
    },
  });

  const createCleanerMutation = useMutation({
    mutationFn: async (newCleaner: Partial<Cleaner>) => {
      const { data, error } = await supabase
        .from('cleaners')
        .insert([newCleaner])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('E-mail já cadastrado no sistema');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaners'] });
    },
  });

  const updateCleanerMutation = useMutation({
    mutationFn: async (updatedCleaner: Partial<Cleaner>) => {
      const { id, created_at, ...cleanerData } = updatedCleaner;
      
      const { data, error } = await supabase
        .from('cleaners')
        .update(cleanerData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('E-mail já cadastrado no sistema');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaners'] });
    },
  });

  const handleSaveCleaner = async (cleanerData: Partial<Cleaner>) => {
    try {
      if (selectedCleaner) {
        await updateCleanerMutation.mutateAsync({
          ...cleanerData,
          id: selectedCleaner.id,
        });
      } else {
        await createCleanerMutation.mutateAsync(cleanerData);
      }
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }
      return 'Ocorreu um erro ao salvar o limpador';
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Limpadores</h1>
        <button
          onClick={() => {
            setSelectedCleaner(undefined);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Limpador
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contato
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cleaners?.map((cleaner) => (
              <tr key={cleaner.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{cleaner.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      <a href={`mailto:${cleaner.email}`} className="hover:text-blue-600">
                        {cleaner.email}
                      </a>
                    </div>
                    {cleaner.personal_phone && (
                      <div className="flex items-center mt-1">
                        <Phone className="w-4 h-4 mr-1" />
                        <a href={`tel:${cleaner.personal_phone}`} className="hover:text-blue-600">
                          {cleaner.personal_phone}
                        </a>
                      </div>
                    )}
                    {cleaner.company_phone && (
                      <div className="flex items-center mt-1">
                        <Smartphone className="w-4 h-4 mr-1" />
                        <a href={`tel:${cleaner.company_phone}`} className="hover:text-blue-600">
                          {cleaner.company_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${cleaner.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {cleaner.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {cleaner.employee_code || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => {
                      setSelectedCleaner(cleaner);
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CleanerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCleaner(undefined);
        }}
        cleaner={selectedCleaner}
        onSave={handleSaveCleaner}
      />
    </div>
  );
};

export default Cleaners;