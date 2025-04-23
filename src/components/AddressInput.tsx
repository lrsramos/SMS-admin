import React from 'react';
import { Search } from 'lucide-react';
import { IMaskInput } from 'react-imask';

interface OpenStreetMapAddress {
  road?: string;
  street?: string;
  residential?: string;
  path?: string;
  pedestrian?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  subdistrict?: string;
  city?: string;
  town?: string;
  village?: string;
  city_district?: string;
  state?: string;
  postcode?: string;
}

interface OpenStreetMapResult {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  address: OpenStreetMapAddress;
}

interface AddressValue {
  street: string;
  street_number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
}

interface AddressInputProps {
  value: AddressValue;
  onChange: (address: AddressValue) => void;
  onValidate: (isValid: boolean) => void;
}

export const AddressInput: React.FC<AddressInputProps> = ({ value, onChange, onValidate }) => {
  const [suggestions, setSuggestions] = React.useState<OpenStreetMapResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const searchTimeout = React.useRef<NodeJS.Timeout>();

  const validatePostalCode = (postalCode: string): boolean => {
    const cleanPostalCode = postalCode.replace(/\D/g, '');
    return cleanPostalCode.length === 8;
  };

  const searchByPostalCode = async (postalCode: string) => {
    setError(null);
    
    if (!validatePostalCode(postalCode)) {
      setError('CEP inválido. Por favor, insira um CEP válido com 8 dígitos.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const formattedPostalCode = postalCode.replace(/^(\d{5})(\d{3})$/, '$1-$2');
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `postalcode=${encodeURIComponent(formattedPostalCode)}&` +
        `country=brazil&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=1`,
        {
          headers: {
            'Accept-Language': 'pt-BR',
            'User-Agent': 'PoolServiceApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na busca do CEP: ${response.status}`);
      }

      const data = await response.json();
      console.log('Postal code search response:', data);

      if (data && data.length > 0) {
        const result: OpenStreetMapResult = data[0];
        const address = result.address;
        
        // Log raw data for debugging
        console.log('Raw postal code data:', result);
        console.log('Raw address data:', address);

        const newAddress: AddressValue = {
          street: address.road || address.street || address.residential || address.path || address.pedestrian || '',
          street_number: address.house_number || '',
          neighborhood: address.suburb || address.neighbourhood || address.subdistrict || '',
          city: address.city || address.town || address.village || address.city_district || '',
          state: address.state || '',
          postal_code: formattedPostalCode,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        };

        console.log('Mapped postal code address:', newAddress);

        // Update the form fields
        onChange(newAddress);
        onValidate(true);
        setSuggestions([]);

        // Update search term with formatted address
        const formattedAddress = [
          newAddress.street,
          newAddress.street_number,
          newAddress.neighborhood,
          newAddress.city
        ].filter(Boolean).join(', ');
        
        setSearchTerm(formattedAddress);
      } else {
        setError('Endereço não encontrado para este CEP.');
      }
    } catch (error) {
      console.error('Error fetching postal code data:', error);
      setError('Erro ao buscar o CEP. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setError(null);
    
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const cleanQuery = query.replace(/\D/g, '');
    if (cleanQuery.length === 8) {
      await searchByPostalCode(cleanQuery);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}, Brasil&` +
        `format=json&` +
        `countrycodes=br&` +
        `addressdetails=1&` +
        `limit=5`,
        {
          headers: {
            'Accept-Language': 'pt-BR',
            'User-Agent': 'PoolServiceApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na busca de endereço: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setError('Erro ao buscar endereços. Por favor, tente novamente.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    setError(null);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const handleSelectAddress = (place: OpenStreetMapResult) => {
    const address = place.address;
    
    // Log raw data for debugging
    console.log('Raw OpenStreetMap data:', place);
    console.log('Raw address data:', address);
    
    const newAddress: AddressValue = {
      street: address.road || address.street || address.residential || address.path || address.pedestrian || '',
      street_number: address.house_number || '',
      neighborhood: address.suburb || address.neighbourhood || address.subdistrict || '',
      city: address.city || address.town || address.village || address.city_district || '',
      state: address.state || '',
      postal_code: address.postcode || '',
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    };

    console.log('Mapped address data:', newAddress);

    // Update the form fields
    onChange(newAddress);
    onValidate(true);
    setSuggestions([]);

    // Update search term with formatted address
    const formattedAddress = [
      newAddress.street,
      newAddress.street_number,
      newAddress.neighborhood,
      newAddress.city
    ].filter(Boolean).join(', ');
    
    setSearchTerm(formattedAddress);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Digite o endereço ou CEP para buscar..."
            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                onClick={() => handleSelectAddress(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <p className="text-sm font-medium text-gray-900">{suggestion.display_name}</p>
                <p className="text-xs text-gray-500">{suggestion.type}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
          <input
            type="text"
            value={value.street}
            onChange={(e) => onChange({ ...value, street: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Nome da rua"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
          <input
            type="text"
            value={value.street_number}
            onChange={(e) => onChange({ ...value, street_number: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Número"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
          <input
            type="text"
            value={value.neighborhood}
            onChange={(e) => onChange({ ...value, neighborhood: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Bairro"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
          <IMaskInput
            mask="00000-000"
            value={value.postal_code}
            onAccept={(postalCode) => {
              onChange({ ...value, postal_code: postalCode });
              const cleanValue = postalCode.replace(/\D/g, '');
              if (cleanValue.length === 8) {
                searchByPostalCode(cleanValue);
              }
            }}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="00000-000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
          <input
            type="text"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Cidade"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <input
            type="text"
            value={value.state}
            onChange={(e) => onChange({ ...value, state: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Estado"
          />
        </div>
      </div>
    </div>
  );
};