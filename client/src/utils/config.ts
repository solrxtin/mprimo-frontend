import { API_CONFIG } from '@/config/api.config';

export const API_BASE_URL = API_CONFIG.BASE_URL;

export const getApiUrl = (endpoint: string) => API_BASE_URL + endpoint;

export const AllProduct = getApiUrl("/products");
export const AProduct = getApiUrl("/products/");
export const AProductBySlug = getApiUrl("/products/slug/");

