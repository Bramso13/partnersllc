"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useApi } from "@/lib/api/useApi";
import type { Product, ProductFormData } from "./types";

type ProductsContextValue = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProduct: (id: string) => Promise<Product | null>;
  createProduct: (data: ProductFormData) => Promise<Product>;
  updateProduct: (
    id: string,
    data: Partial<ProductFormData> & { is_test?: boolean }
  ) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  fetchActiveProducts: () => Promise<Product[]>;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<{ products: Product[] }>(
        "/api/admin/products"
      );
      setProducts(data?.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProduct = useCallback(
    async (id: string): Promise<Product | null> => {
      try {
        const data = await api.get<{ product: Product }>(
          `/api/admin/products/${id}`
        );
        return data?.product ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const createProduct = useCallback(
    async (data: ProductFormData): Promise<Product> => {
      const res = await api.post<{ product: Product }>(
        "/api/admin/products",
        data
      );
      if (!res?.product) throw new Error("Réponse invalide");
      return res.product;
    },
    []
  );

  const updateProduct = useCallback(
    async (
      id: string,
      data: Partial<ProductFormData> & { is_test?: boolean }
    ) => {
      await api.patch(`/api/admin/products/${id}`, data);
    },
    []
  );

  const deleteProduct = useCallback(async (id: string) => {
    await api.delete(`/api/admin/products?id=${id}`);
  }, []);

  const fetchActiveProducts = useCallback(async (): Promise<Product[]> => {
    const data = await api.get<{ products: Product[] }>(
      "/api/admin/products/active"
    );
    return data?.products ?? [];
  }, []);

  const value = useMemo(
    () => ({
      products,
      isLoading,
      error,
      fetchProducts,
      getProduct,
      createProduct,
      updateProduct,
      deleteProduct,
      fetchActiveProducts,
    }),
    [
      products,
      isLoading,
      error,
      fetchProducts,
      getProduct,
      createProduct,
      updateProduct,
      deleteProduct,
      fetchActiveProducts,
    ]
  );

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error("useProducts must be used within ProductsProvider");
  }
  return ctx;
}
