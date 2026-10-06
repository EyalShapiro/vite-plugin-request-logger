import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TodoItem } from './types';
import { fetchTodos, fetchTodo, createTodo, updateTodo, deleteTodo, clearCompletedTodos } from './functions';

export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  detail: (id: number) => [...todoKeys.all, 'detail', id] as const,
};

export function useTodos() {
  return useQuery({
    queryKey: todoKeys.lists(),
    queryFn: fetchTodos,
  });
}

export function useTodo(id: number) {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => fetchTodo(id),
    enabled: !!id,
  });
}

export function useAddTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTodo,
    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const previousTodos = queryClient.getQueryData<TodoItem[]>(todoKeys.lists());

      queryClient.setQueryData<TodoItem[]>(todoKeys.lists(), (old = []) =>
        old.map((todo) => (todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo))
      );

      return { previousTodos };
    },
    onError: (err, _variables, context) => {
      console.error(err);
      if (context?.previousTodos) {
        queryClient.setQueryData(todoKeys.lists(), context.previousTodos);
      }
    },
    onSettled: (data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      if (data) {
        queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) });
      }
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTodo,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      const previousTodos = queryClient.getQueryData<TodoItem[]>(todoKeys.lists());

      queryClient.setQueryData<TodoItem[]>(todoKeys.lists(), (old = []) =>
        old.filter((todo) => todo.id !== deletedId)
      );

      return { previousTodos };
    },
    onError: (err, _variables, context) => {
      console.error(err);
      if (context?.previousTodos) {
        queryClient.setQueryData(todoKeys.lists(), context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}

export function useClearCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCompletedTodos,
    onMutate: async (deletedIds) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
      const previousTodos = queryClient.getQueryData<TodoItem[]>(todoKeys.lists());

      queryClient.setQueryData<TodoItem[]>(todoKeys.lists(), (old = []) =>
        old.filter((todo) => !deletedIds.includes(todo.id))
      );
      return { previousTodos };
    },
    onError: (err, _variables, context) => {
      console.error(err);
      if (context?.previousTodos) {
        queryClient.setQueryData(todoKeys.lists(), context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}
