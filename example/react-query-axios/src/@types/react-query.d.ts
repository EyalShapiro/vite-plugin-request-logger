import { type AxiosError } from 'axios';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: AxiosError<{ message?: string }>;
  }
}
export {};
