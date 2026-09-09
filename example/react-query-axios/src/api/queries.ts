import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
}

export function useFetchTodos() {
  return useQuery<TodoItem[]>({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await apiClient.get<TodoItem[]>('/todos');
      return response.data;
    },
  });
}

export function useAddTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTodo: { title: string; password?: string }) => {
      const response = await apiClient.post('/todos', newTodo);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
