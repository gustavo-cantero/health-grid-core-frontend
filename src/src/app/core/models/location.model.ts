export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface CreateLocationPayload {
  name: string;
  address: string;
  city: string;
  country: string;
}
