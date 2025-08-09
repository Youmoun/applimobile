
export type Service = {
  id?: string;
  name: string;
  price: number; // EUR
  provider_id?: string;
};

export type Provider = {
  id?: string;
  first_name: string;
  last_name: string;
  city: string;
  phone: string;
  photo_url?: string | null;
  about?: string | null;
  categories: string[]; // text[]
  latitude?: number | null;
  longitude?: number | null;
  user_id?: string | null;
  services?: Service[];
  ratings?: { stars: number }[];
};
