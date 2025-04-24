import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Calendar, Clock, User, Info, AlertCircle } from 'lucide-react';
import { Appointment, Client, CleaningServiceType, CleaningTasks } from '@/types';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Map } from '@/components/Map';

const defaultCleaningTasks: CleaningTasks = {
  skimming: true,
  vacuuming: true,
  brushing: true,
  basket_empty: true,
  water_chemistry: true,
  filter_backwash: false,
  algae_treatment: false,
  shock_treatment: false,
  tile_cleaning: false,
  acid_wash: false,
  pool_opening: false,
  pool_closing: false,
};

const serviceTypeDescriptions: Record<CleaningServiceType, string> = {
  weekly: 'Limpeza semanal regular',
  bi_weekly: 'Limpeza quinzenal regular',
  monthly: 'Limpeza mensal regular',
  one_time: 'Limpeza única',
};

const taskDescriptions: Record<keyof CleaningTasks, string> = {
  skimming: 'Remoção de folhas e detritos da superfície',
  vacuuming: 'Aspiração do fundo da piscina',
  brushing: 'Escovação das paredes e degraus',
  basket_empty: 'Limpeza do cesto do skimmer',
  water_chemistry: 'Verificação e ajuste da química da água',
  filter_backwash: 'Retrolavagem do filtro',
  algae_treatment: 'Tratamento contra algas',
  shock_treatment: 'Tratamento de choque',
  tile_cleaning: 'Limpeza das bordas',
  acid_wash: 'Lavagem ácida',
  pool_opening: 'Abertura da piscina',
  pool_closing: 'Fechamento da piscina',
};

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment;
  onSave: (appointment: Partial<Appointment>) => Promise<void>;
}

export function AppointmentModal({ isOpen, onClose, appointment, onSave }: AppointmentModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [cleaners, setCleaners] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<Partial<Appointment>>({
    client_id: '',
    cleaner_id: '',
    scheduled_at: '',
    status: 'scheduled',
    service_type: 'weekly',
    cleaning_tasks: defaultCleaningTasks,
    estimated_duration: 60,
    special_instructions: '',
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        ...appointment,
        cleaning_tasks: appointment.cleaning_tasks || defaultCleaningTasks,
      });
    }
  }, [appointment]);

  useEffect(() => {
    fetchClients();
    fetchCleaners();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error fetching clients:', error);
      return;
    }

    setClients(data || []);
  };

  const fetchCleaners = async () => {
    const { data, error } = await supabase
      .from('cleaners')
      .select('id, name')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error fetching cleaners:', error);
      return;
    }

    setCleaners(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  const handleTaskChange = (task: keyof CleaningTasks) => {
    setFormData(prev => ({
      ...prev,
      cleaning_tasks: {
        ...prev.cleaning_tasks,
        [task]: !prev.cleaning_tasks?.[task],
      },
    }));
  };

  const selectedClient = clients.find(c => c.id === formData.client_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">Tipo de Serviço</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value: CleaningServiceType) => 
                  setFormData(prev => ({ ...prev, service_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de serviço" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(serviceTypeDescriptions).map(([type, description]) => (
                    <SelectItem key={type} value={type}>
                      {description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaner">Profissional</Label>
              <Select
                value={formData.cleaner_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cleaner_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um profissional" />
                </SelectTrigger>
                <SelectContent>
                  {cleaners.map((cleaner) => (
                    <SelectItem key={cleaner.id} value={cleaner.id}>
                      {cleaner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_at">Data e Hora</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Tarefas de Limpeza</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(taskDescriptions).map(([task, description]) => (
                <div key={task} className="flex items-start space-x-2">
                  <Checkbox
                    id={task}
                    checked={formData.cleaning_tasks?.[task as keyof CleaningTasks]}
                    onCheckedChange={() => handleTaskChange(task as keyof CleaningTasks)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={task} className="font-medium">
                      {task.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Label>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_instructions">Instruções Especiais</Label>
            <Textarea
              id="special_instructions"
              value={formData.special_instructions || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
              placeholder="Adicione instruções especiais ou observações importantes..."
              className="h-24"
            />
          </div>

          {selectedClient && (selectedClient.latitude && selectedClient.longitude) && (
            <div className="space-y-2">
              <Label>Local do Serviço</Label>
              <div className="h-48 rounded-lg overflow-hidden">
                <Map
                  latitude={selectedClient.latitude}
                  longitude={selectedClient.longitude}
                  zoom={15}
                />
              </div>
              <p className="text-sm text-gray-500">
                {selectedClient.street}, {selectedClient.street_number} - {selectedClient.neighborhood}, {selectedClient.city}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {appointment ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}