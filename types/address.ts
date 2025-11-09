// types/address.ts
export interface Address {
  address: string;
  address_structured: { [key: string]: string };
  location_lat: number | null;
  location_lon: number | null;
  location_place_id: string | null;
}

export interface AddressAutocompleteProps {
  apiKey: string;
  onAddressSelect: (address: Address) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
  error?: string;
}

