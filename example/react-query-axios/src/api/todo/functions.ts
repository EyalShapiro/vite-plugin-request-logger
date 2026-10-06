import { axiosInstance } from '../axiosInstance';
import type { TodoItem, CreateTodoPayload } from './types';

/* =========== API Functions  ===========*/

export async function fetchTodos(): Promise<TodoItem[]> {
  const { data } = await axiosInstance.get<TodoItem[]>('/todos');
  return data;
}
export async function fetchTodo(id: number): Promise<TodoItem> {
  const { data } = await axiosInstance.get<TodoItem>(`/todos/${id}`);
  return data;
}
export async function createTodo(newTodo: CreateTodoPayload): Promise<TodoItem> {
  const { data } = await axiosInstance.post<TodoItem>('/todos', newTodo);
  return data;
}
export async function updateTodo(updatedTodo: Partial<TodoItem> & { id: number }): Promise<TodoItem> {
  const { data } = await axiosInstance.patch<TodoItem>(`/todos/${updatedTodo.id}`, updatedTodo);
  return data;
}
export async function deleteTodo(id: TodoItem['id']): Promise<void> {
  const { data } = await axiosInstance.delete(`/todos/${id}`);
  return data;
}
export async function clearCompletedTodos(ids: number[]): Promise<void> {
  // Mocking mass delete by deleting one by one via Promise.all
  await Promise.all(ids.map(id => axiosInstance.delete(`/todos/${id}`)));
}
