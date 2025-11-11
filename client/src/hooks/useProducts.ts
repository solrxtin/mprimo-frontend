import { useQuery } from '@tanstack/react-query';

import { API_BASE_URL } from '@/utils/config';

interface ProductFilters {
  category?: string;
  subCategory1?: string;
  subCategory2?: string;
  subCategory3?: string;
  subCategory4?: string;
  brand?: string;
  priceRange?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

const fetchProducts = async (filters: ProductFilters) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`${API_BASE_URL}/products/get-products?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

export const useProducts = (filters: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchCategoryBySlug = async (slug: string) => {
  const response = await fetch(`${API_BASE_URL}/categories/slug/${slug}`);
  if (!response.ok) {
    throw new Error('Failed to fetch category');
  }
  return response.json();
};

export const useCategoryBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => fetchCategoryBySlug(slug),
    enabled: !!slug,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

const fetchCategoryTree = async (parentId?: string) => {
  const params = parentId ? `?parentId=${parentId}` : '';
  const response = await fetch(`${API_BASE_URL}/categories/tree${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch category tree');
  }
  return response.json();
};

export const useCategoryTree = (parentId?: string) => {
  return useQuery({
    queryKey: ['categoryTree', parentId],
    queryFn: () => fetchCategoryTree(parentId),
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

interface CategoryProductFilters {
  categoryId: string;
  subCategory1?: string;
  subCategory2?: string;
  subCategory3?: string;
  subCategory4?: string;
  brand?: string;
  priceRange?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

const fetchProductsByCategory = async (filters: CategoryProductFilters) => {
  const { categoryId, ...params } = filters;
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/products/categories/${categoryId}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch products by category');
  }
  return response.json();
};

export const useProductsByCategory = (filters: CategoryProductFilters) => {
  return useQuery({
    queryKey: ['productsByCategory', filters],
    queryFn: () => fetchProductsByCategory(filters),
    enabled: !!filters.categoryId,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};