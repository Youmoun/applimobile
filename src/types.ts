export type Service = { id?: string; name: string; price: number; provider_id?: string; };
export type Provider = { id?: string; first_name: string; last_name: string; department?: string | null; city: string; phone: string; photo_url?: string | null; about?: string | null; categories: string[]; user_id?: string | null; services?: Service[]; ratings?: { stars: number }[]; };
