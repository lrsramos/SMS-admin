import React from 'react';
import { Dialog, Tab } from '@headlessui/react';
import { X, User, Briefcase, Building } from 'lucide-react';
import { IMaskInput } from 'react-imask';
import { Cleaner } from '../types';
import { modalStyles, inputStyles, buttonStyles } from '../styles/components';
import { createComponentStyle } from '../utils/styles';

interface CleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cleaner?: Cleaner;
  onSave: (cleaner: Partial<Cleaner>) => Promise<string | null>;
}

const DAYS_OF_WEEK = [
  { value: 'domingo', label: 'Domingo' },
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sabado', label: 'Sábado' },
];

const SERVICE_AREAS = [
  'Zona Sul',
  'Zona Norte',
  'Zona Leste',
  'Zona Oeste',
  'Centro',
];

const CleanerModal: React.FC<CleanerModalProps> = ({
  isOpen,
  onClose,
  cleaner,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<Partial<Cleaner>>(
    cleaner || {
      name: '',
      email: '',
      personal_phone: '',
      company_phone: '',
      active: true,
      password: '',
      available_days: [],
      work_start_time: null,
      work_end_time: null,
      service_areas: [],
      has_vehicle: false,
      vehicle_type: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      employee_code: '',
      hire_date: new Date().toISOString().split('T')[0],
      role: 'cleaner',
    }
  );

  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errors, setErrors] = React.useState({
    email: '',
    personal_phone: '',
    company_phone: '',
    password: '',
    emergency_phone: '',
    submit: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormData(cleaner || {
        name: '',
        email: '',
        personal_phone: '',
        company_phone: '',
        active: true,
        password: '',
        available_days: [],
        work_start_time: null,
        work_end_time: null,
        service_areas: [],
        has_vehicle: false,
        vehicle_type: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        employee_code: '',
        hire_date: new Date().toISOString().split('T')[0],
        role: 'cleaner',
      });
      setConfirmPassword('');
      setErrors({
        email: '',
        personal_phone: '',
        company_phone: '',
        password: '',
        emergency_phone: '',
        submit: '',
      });
      setIsSubmitting(false);
    }
  }, [isOpen, cleaner]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'E-mail é obrigatório';
    if (!emailRegex.test(email)) return 'E-mail inválido';
    return '';
  };

  const validatePhone = (phone: string) => {
    if (!phone) return '';
    const phoneNumber = phone.replace(/[^0-9]/g, '');
    if (phoneNumber.length !== 11) return 'Telefone deve ter 11 dígitos';
    return '';
  };

  const validatePassword = () => {
    if (cleaner) return '';
    
    if (!formData.password) return 'Senha é obrigatória';
    if (formData.password.length < 8) return 'Senha deve ter no mínimo 8 caracteres';
    if (formData.password !== confirmPassword) return 'As senhas não coincidem';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const emailError = validateEmail(formData.email || '');
    const personalPhoneError = validatePhone(formData.personal_phone || '');
    const companyPhoneError = validatePhone(formData.company_phone || '');
    const passwordError = validatePassword();
    const emergencyPhoneError = formData.emergency_contact_phone ? 
      validatePhone(formData.emergency_contact_phone) : '';
    
    setErrors({
      email: emailError,
      personal_phone: personalPhoneError,
      company_phone: companyPhoneError,
      password: passwordError,
      emergency_phone: emergencyPhoneError,
      submit: '',
    });

    if (emailError || personalPhoneError || companyPhoneError || passwordError || emergencyPhoneError) {
      return;
    }

    // Convert empty time strings to null
    const cleanedFormData = {
      ...formData,
      work_start_time: formData.work_start_time || null,
      work_end_time: formData.work_end_time || null,
    };

    setIsSubmitting(true);

    try {
      const error = await onSave(cleanedFormData);
      if (error) {
        setErrors(prev => ({ ...prev, submit: error }));
      } else {
        onClose();
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, submit: 'Erro ao salvar o limpador' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvailableDaysChange = (day: string) => {
    const days = formData.available_days || [];
    setFormData({ 
      ...formData, 
      available_days: days.includes(day) ? days.filter(d => d !== day) : [...days, day] 
    });
  };

  const handleServiceAreasChange = (area: string) => {
    const areas = formData.service_areas || [];
    setFormData({ 
      ...formData, 
      service_areas: areas.includes(area) ? areas.filter(a => a !== area) : [...areas, area] 
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className={modalStyles.overlay} aria-hidden="true" />
      <div className={modalStyles.container}>
        <Dialog.Panel className={`${modalStyles.content} max-h-[90vh] flex flex-col`}>
          <div className={modalStyles.header}>
            <Dialog.Title className={modalStyles.title}>
              {cleaner ? 'Editar Limpador' : 'Novo Limpador'}
            </Dialog.Title>
            <button onClick={onClose} className="text-secondary-400 hover:text-secondary-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form 
            onSubmit={handleSubmit} 
            className="flex-1 overflow-y-auto"
          >
            <div className="p-6 space-y-4">
              {errors.submit && (
                <div className="bg-error-50 border border-error-200 rounded-md p-3">
                  <p className="text-sm text-error-600">{errors.submit}</p>
                </div>
              )}

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
                    <User className="w-4 h-4 inline-block mr-1" />
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
                    <Briefcase className="w-4 h-4 inline-block mr-1" />
                    Dados Profissionais
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
                    <Building className="w-4 h-4 inline-block mr-1" />
                    Dados da Empresa
                  </Tab>
                </Tab.List>

                <Tab.Panels className="mt-4">
                  <Tab.Panel className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Nome</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={inputStyles.base}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">E-mail</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          setErrors(prev => ({ ...prev, email: '', submit: '' }));
                        }}
                        className={`${inputStyles.base} ${
                          errors.email ? inputStyles.error : ''
                        }`}
                        required
                      />
                      {errors.email && <p className="mt-1 text-sm text-error-600">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Telefone Pessoal</label>
                      <IMaskInput
                        mask="(00) 00000-0000"
                        value={formData.personal_phone || ''}
                        onAccept={(value) => {
                          setFormData({ ...formData, personal_phone: value });
                          setErrors(prev => ({ ...prev, personal_phone: '' }));
                        }}
                        className={`${inputStyles.base} ${
                          errors.personal_phone ? inputStyles.error : ''
                        }`}
                        placeholder="(00) 00000-0000"
                      />
                      {errors.personal_phone && <p className="mt-1 text-sm text-error-600">{errors.personal_phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Telefone Empresa</label>
                      <IMaskInput
                        mask="(00) 00000-0000"
                        value={formData.company_phone || ''}
                        onAccept={(value) => {
                          setFormData({ ...formData, company_phone: value });
                          setErrors(prev => ({ ...prev, company_phone: '' }));
                        }}
                        className={`${inputStyles.base} ${
                          errors.company_phone ? inputStyles.error : ''
                        }`}
                        placeholder="(00) 00000-0000"
                      />
                      {errors.company_phone && <p className="mt-1 text-sm text-error-600">{errors.company_phone}</p>}
                    </div>

                    {!cleaner && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700">Senha</label>
                          <input
                            type="password"
                            value={formData.password || ''}
                            onChange={(e) => {
                              setFormData({ ...formData, password: e.target.value });
                              setErrors(prev => ({ ...prev, password: '' }));
                            }}
                            className={`${inputStyles.base} ${
                              errors.password ? inputStyles.error : ''
                            }`}
                            required={!cleaner}
                            minLength={8}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700">Confirmar Senha</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              setErrors(prev => ({ ...prev, password: '' }));
                            }}
                            className={`${inputStyles.base} ${
                              errors.password ? inputStyles.error : ''
                            }`}
                            required={!cleaner}
                          />
                          {errors.password && <p className="mt-1 text-sm text-error-600">{errors.password}</p>}
                        </div>
                      </>
                    )}
                  </Tab.Panel>

                  <Tab.Panel className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Horário Início</label>
                      <input
                        type="time"
                        value={formData.work_start_time || ''}
                        onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value || null })}
                        className={inputStyles.base}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Horário Fim</label>
                      <input
                        type="time"
                        value={formData.work_end_time || ''}
                        onChange={(e) => setFormData({ ...formData, work_end_time: e.target.value || null })}
                        className={inputStyles.base}
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id="has_vehicle"
                          checked={formData.has_vehicle}
                          onChange={(e) => setFormData({ ...formData, has_vehicle: e.target.checked })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                        />
                        <label htmlFor="has_vehicle" className="ml-2 text-sm text-secondary-700">
                          Possui Veículo
                        </label>
                      </div>

                      {formData.has_vehicle && (
                        <input
                          type="text"
                          value={formData.vehicle_type || ''}
                          onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                          className={inputStyles.base}
                          placeholder="Ex: Carro, Moto"
                        />
                      )}
                    </div>
                  </Tab.Panel>

                  <Tab.Panel className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Código do Funcionário</label>
                      <input
                        type="text"
                        value={formData.employee_code || ''}
                        onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                        className={inputStyles.base}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Data de Contratação</label>
                      <input
                        type="date"
                        value={formData.hire_date || ''}
                        onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                        className={inputStyles.base}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-secondary-700">Status</label>
                      <div className="mt-1">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                          <span className="ml-2 text-sm text-secondary-700">Ativo</span>
                        </label>
                      </div>
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
                type="button"
                onClick={(e) => {
                  const syntheticEvent = {
                    preventDefault: () => {},
                  } as React.FormEvent;
                  handleSubmit(syntheticEvent);
                }}
                disabled={isSubmitting}
                className={createComponentStyle(buttonStyles, 'primary')}
              >
                {isSubmitting ? 'Salvando...' : cleaner ? 'Salvar Alterações' : 'Criar Limpador'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CleanerModal;
