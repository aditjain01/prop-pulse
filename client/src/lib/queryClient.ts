import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiRequest } from './api/base';

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <T>({ on401: unauthorizedBehavior }: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const params = queryKey[1] as Record<string, any> | undefined;
    
    // If we have params, append them to the URL
    const urlWithParams = params 
      ? `${url}?${new URLSearchParams(params as Record<string, string>)}`
      : url;
    
    const res = await apiRequest("GET", urlWithParams);
    const data = await res.json();
    
    if (res.status === 401 && unauthorizedBehavior === "returnNull") {
      return null;
    }
    
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
