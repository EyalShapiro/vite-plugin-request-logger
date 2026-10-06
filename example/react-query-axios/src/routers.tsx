import { createBrowserRouter } from 'react-router';

import Layout from './components/Layout';
import TodosPage from './pages/todos/TodosPage';
import DogsList from './pages/dogs/DogsList';
import DogDetail from './pages/dogs/DogDetail';
import ChatPage from './pages/chat/ChatPage';
import ErrorPage from './pages/error/ErrorPage';

export const Router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <TodosPage />,
      },
      {
        path: 'dogs',
        element: <DogsList />,
      },
      {
        path: 'dogs/:breed',
        element: <DogDetail />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: '*',
        element: <ErrorPage />,
      },
    ],
  },
]);
