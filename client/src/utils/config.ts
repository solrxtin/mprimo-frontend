import { API_BASE_URL, getApiUrl } from '@/config/api';

export { API_BASE_URL, getApiUrl };

export const AllProduct = getApiUrl("products");
export const AProduct = getApiUrl("products/");
export const AProductBySlug = getApiUrl("products/slug/");

