import React, { useState, useEffect } from 'react';
import { Dialog, Tab } from '@headlessui/react';
import { Client, ServiceLocation } from '../types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AddressInput } from './AddressInput';
import { modalStyles, inputStyles, buttonStyles } from '../styles/components';
import { createComponentStyle } from '../utils/styles';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  client?: Client;
}

type FormData = {
  name: string;
  email: string;
  telefone: string;
  frequencia_limpeza: string;
  como_conheceu: string;
}

interface ServiceLocationFormState {
  street: string;
  street_number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  complemento: string;
  ponto_referencia: string;
  instrucoes_acesso: string;
  tipo_piscina: string;
  tamanho_piscina: string;
  produtos_utilizados: string;
  equipamentos: string;
  horario_preferido: string;
  observacoes: string;
  address_validated: boolean;
  latitude: number | null;
  longitude: number | null;
}

const defaultServiceLocation: ServiceLocationFormState = {
  street: '',
  street_number: '',
  neighborhood: '',
  city: '',
  state: '',
  postal_code: '',
  complemento: '',
  ponto_referencia: '',
  instrucoes_acesso: '',
  tipo_piscina: '',
  tamanho_piscina: '',
  produtos_utilizados: '',
  equipamentos: '',
  horario_preferido: '',
  observacoes: '',
  address_validated: false,
  latitude: null,
  longitude: null,
};

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, client, onSave }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    telefone: '',
    frequencia_limpeza: '',
    como_conheceu: '',
  });

  const [serviceLocation, setServiceLocation] = useState<ServiceLocationFormState>(defaultServiceLocation);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        telefone: client.telefone || '',
        frequencia_limpeza: client.frequencia_limpeza || '',
        como_conheceu: client.como_conheceu || '',
      });

      if (client.service_locations?.[0]) {
        const location = client.service_locations[0];
        setServiceLocation({
          street: location.street || '',
          street_number: location.street_number || '',
          neighborhood: location.neighborhood || '',
          city: location.city || '',
          state: location.state || '',
          postal_code: location.postal_code || '',
          complemento: location.complemento || '',
          ponto_referencia: location.ponto_referencia || '',
          instrucoes_acesso: location.instrucoes_acesso || '',
          tipo_piscina: location.tipo_piscina || '',
          tamanho_piscina: location.tamanho_piscina || '',
          produtos_utilizados: location.produtos_utilizados || '',
          equipamentos: location.equipamentos || '',
          horario_preferido: location.horario_preferido || '',
          observacoes: location.observacoes || '',
          address_validated: true,
          latitude: location.latitude,
          longitude: location.longitude,
        });
      } else {
        setServiceLocation(defaultServiceLocation);
      }
    } else {
      setFormData({
        name: '',
        email: '',
        telefone: '',
        frequencia_limpeza: '',
        como_conheceu: '',
      });
      setServiceLocation(defaultServiceLocation);
    }
  }, [client, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create base service location data
    const baseServiceLocation = {
      name: formData.name,
      is_primary: true,
      street: serviceLocation.street || null,
      street_number: serviceLocation.street_number || null,
      neighborhood: serviceLocation.neighborhood || null,
      city: serviceLocation.city || null,
      state: serviceLocation.state || null,
      postal_code: serviceLocation.postal_code || null,
      complemento: serviceLocation.complemento || null,
      ponto_referencia: serviceLocation.ponto_referencia || null,
      instrucoes_acesso: serviceLocation.instrucoes_acesso || null,
      tipo_piscina: serviceLocation.tipo_piscina || null,
      tamanho_piscina: serviceLocation.tamanho_piscina || null,
      produtos_utilizados: serviceLocation.produtos_utilizados || null,
      equipamentos: serviceLocation.equipamentos || null,
      horario_preferido: serviceLocation.horario_preferido || null,
      observacoes: serviceLocation.observacoes || null,
      updated_at: new Date().toISOString(),
      latitude: serviceLocation.latitude,
      longitude: serviceLocation.longitude,
      address_validated: serviceLocation.address_validated,
    };

    // Add IDs and timestamps for existing service location
    const serviceLocationData: ServiceLocation = client?.service_locations?.[0]?.id
      ? {
          ...baseServiceLocation,
          id: client.service_locations[0].id,
          client_id: client.id,
          created_at: client.service_locations[0].created_at,
        }
      : {
          ...baseServiceLocation,
          id: '', // Will be generated by Supabase
          client_id: client?.id || '', // Will be set after client creation
          created_at: new Date().toISOString(),
        };

    const clientData: Partial<Client> = {
      ...formData,
      ...(client?.id && { id: client.id }),
      service_locations: [serviceLocationData],
    };

    onSave(clientData);
    onClose();
  };

  const handleServiceLocationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setServiceLocation(prevState => ({
      ...prevState,
      [name]: value || '',
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value || '',
    }));
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className={modalStyles.overlay} aria-hidden="true" />
      <div className={modalStyles.container}>
        <Dialog.Panel className={`${modalStyles.content} max-h-[90vh] flex flex-col`}>
          <div className={modalStyles.header}>
            <Dialog.Title className={modalStyles.title}>
              {client ? 'Editar Cliente' : 'Novo Cliente'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-secondary-100 p-1">
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2 text-sm font-medium leading-5
                      ${selected
                        ? 'bg-white text-primary-600 shadow'
                        : 'text-secondary-600 hover:bg-white/[0.12] hover:text-primary-500'
                      }`
                    }
                  >
                    Dados Pessoais
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2 text-sm font-medium leading-5
                      ${selected
                        ? 'bg-white text-primary-600 shadow'
                        : 'text-secondary-600 hover:bg-white/[0.12] hover:text-primary-500'
                      }`
                    }
                  >
                    Endereço
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2 text-sm font-medium leading-5
                      ${selected
                        ? 'bg-white text-primary-600 shadow'
                        : 'text-secondary-600 hover:bg-white/[0.12] hover:text-primary-500'
                      }`
                    }
                  >
                    Informações da Piscina
                  </Tab>
                </Tab.List>

                <Tab.Panels className="mt-4">
                  <Tab.Panel className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Nome
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={inputStyles.base}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={inputStyles.base}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        className={inputStyles.base}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Frequência de Limpeza
                      </label>
                      <select
                        name="frequencia_limpeza"
                        value={formData.frequencia_limpeza}
                        onChange={handleInputChange}
                        className={inputStyles.base}
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="semanal">Semanal</option>
                        <option value="quinzenal">Quinzenal</option>
                        <option value="mensal">Mensal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Como Conheceu
                      </label>
                      <select
                        name="como_conheceu"
                        value={formData.como_conheceu}
                        onChange={handleInputChange}
                        className={inputStyles.base}
                      >
                        <option value="">Selecione...</option>
                        <option value="google">Google</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="indicacao">Indicação</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </Tab.Panel>

                  <Tab.Panel className="space-y-4">
                    <AddressInput
                      value={{
                        street: serviceLocation.street,
                        street_number: serviceLocation.street_number,
                        neighborhood: serviceLocation.neighborhood,
                        city: serviceLocation.city,
                        state: serviceLocation.state,
                        postal_code: serviceLocation.postal_code,
                        latitude: serviceLocation.latitude,
                        longitude: serviceLocation.longitude,
                      }}
                      onChange={(address) => {
                        setServiceLocation(prevState => ({
                          ...prevState,
                          street: address.street,
                          street_number: address.street_number,
                          neighborhood: address.neighborhood,
                          city: address.city,
                          state: address.state,
                          postal_code: address.postal_code,
                          latitude: address.latitude,
                          longitude: address.longitude,
                          address_validated: true,
                        }));
                      }}
                      onValidate={(isValid) => {
                        setServiceLocation(prevState => ({
                          ...prevState,
                          address_validated: isValid,
                        }));
                      }}
                    />
                  </Tab.Panel>

                  <Tab.Panel className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Tipo de Piscina
                      </label>
                      <input
                        type="text"
                        name="tipo_piscina"
                        value={serviceLocation.tipo_piscina}
                        onChange={handleServiceLocationChange}
                        className={inputStyles.base}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Tamanho da Piscina
                      </label>
                      <input
                        type="text"
                        name="tamanho_piscina"
                        value={serviceLocation.tamanho_piscina}
                        onChange={handleServiceLocationChange}
                        className={inputStyles.base}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Produtos Utilizados
                      </label>
                      <input
                        type="text"
                        name="produtos_utilizados"
                        value={serviceLocation.produtos_utilizados}
                        onChange={handleServiceLocationChange}
                        className={inputStyles.base}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Equipamentos
                      </label>
                      <input
                        type="text"
                        name="equipamentos"
                        value={serviceLocation.equipamentos}
                        onChange={handleServiceLocationChange}
                        className={inputStyles.base}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Horário Preferido
                      </label>
                      <input
                        type="text"
                        name="horario_preferido"
                        value={serviceLocation.horario_preferido}
                        onChange={handleServiceLocationChange}
                        className={inputStyles.base}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-secondary-700">
                        Observações
                      </label>
                      <textarea
                        name="observacoes"
                        value={serviceLocation.observacoes}
                        onChange={handleServiceLocationChange}
                        rows={3}
                        className={inputStyles.base}
                      />
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
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
                {client ? 'Salvar Alterações' : 'Criar Cliente'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ClientModal;