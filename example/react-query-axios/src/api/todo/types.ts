export interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
}

export type CreateTodoPayload = Omit<TodoItem, 'id' | 'completed'> & { password?: string };
