import { useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router';
import {
  useTodos,
  useAddTodo,
  useUpdateTodo,
  useDeleteTodo,
  useClearCompleted,
  useTodo,
} from '../../api/todo';

function TodosList() {
  const { data: todos, isLoading, isError } = useTodos();
  const addTodoMutation = useAddTodo();
  const updateTodoMutation = useUpdateTodo();
  const deleteTodoMutation = useDeleteTodo();
  const clearCompletedMutation = useClearCompleted();

  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTodoMutation.mutate(
      { title: newTitle },
      {
        onSuccess: () => setNewTitle(''),
      },
    );
  };

  const handleClearCompleted = () => {
    if (!todos) return;
    const completedIds = todos.filter((t) => t.completed).map((t) => t.id);
    if (completedIds.length > 0) {
      clearCompletedMutation.mutate(completedIds);
    }
  };

  if (isLoading) return <p className="text-slate-500 dark:text-slate-400">Loading todos...</p>;
  if (isError) return <p className="text-red-500">Failed to load todos.</p>;

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
      <h2 className="mt-0 text-slate-900 dark:text-slate-50 text-2xl font-bold mb-6">
        📋 Todos List
      </h2>

      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter new todo..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:border-sky-500 dark:focus:border-sky-500 transition-colors"
        />
        <button
          type="submit"
          disabled={addTodoMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white border-none px-5 py-2.5 rounded-lg cursor-pointer font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addTodoMutation.isPending ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div className="mb-4 flex justify-end">
        <button
          onClick={handleClearCompleted}
          disabled={clearCompletedMutation.isPending || !todos?.some((t) => t.completed)}
          className="bg-red-500 hover:bg-red-600 text-white border-none px-4 py-2 rounded-lg cursor-pointer font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clearCompletedMutation.isPending ? 'Clearing...' : 'Clear Completed'}
        </button>
      </div>

      <ul className="list-none p-0 flex flex-col gap-2">
        {todos?.map((item) => (
          <li
            key={item.id}
            className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg flex justify-between items-center shadow-sm"
          >
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) =>
                  updateTodoMutation.mutate({ id: item.id, completed: e.target.checked })
                }
                className="w-5 h-5 cursor-pointer accent-sky-500"
              />
              <span
                className={`cursor-pointer transition-colors hover:text-sky-500 ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-50'}`}
                onClick={() => navigate(`/todo/${item.id}`)}
              >
                {item.title}
              </span>
            </div>
            <button
              onClick={() => deleteTodoMutation.mutate(item.id)}
              className="bg-transparent border-none text-red-500 hover:text-red-600 cursor-pointer text-xl flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TodoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: todo, isLoading, isError } = useTodo(Number(id));

  if (isLoading) return <p className="text-slate-500 dark:text-slate-400">Loading detail...</p>;
  if (isError || !todo) return <p className="text-red-500">Failed to load detail.</p>;

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => navigate('/')}
        className="mb-6 bg-transparent border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-md cursor-pointer block hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors dark:text-slate-50"
      >
        &larr; Back
      </button>
      <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-50">Todo Detail</h2>
      <div className="flex flex-col gap-2 text-slate-700 dark:text-slate-300 text-lg">
        <p>
          <strong className="text-slate-900 dark:text-slate-50">ID:</strong> {todo.id}
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-50">Title:</strong> {todo.title}
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-50">Status:</strong>{' '}
          {todo.completed ? (
            <span className="text-emerald-500">Completed &#10004;</span>
          ) : (
            <span className="text-amber-500">Pending &#8987;</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function TodosPage() {
  return (
    <Routes>
      <Route path="/" element={<TodosList />} />
      <Route path="/todo/:id" element={<TodoDetail />} />
    </Routes>
  );
}
