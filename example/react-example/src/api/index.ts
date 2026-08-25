import axios from 'axios';
import { API_ENDOPNIT } from './config';

const axiosInstance = axios.create({
  baseURL: API_ENDOPNIT,
  headers: { 'Content-Type': 'application/json' },
});

export async function postUser(body: Record<string, string>) {
  const res = await axios.post(`${API_ENDOPNIT}/users`, body);
  return res.data;
}

export async function postUserWithAxiosInstance(body: Record<string, string>) {
  const res = await axiosInstance.put('/users', body);
  return res.data;
}

export async function postTasks(body: string) {
  const res = await fetch(`${API_ENDOPNIT}/tasks`, {
    method: 'put',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data = await res.json();
  return data;
}

export async function postTasksWithAxiosInstance(body: Record<string, string>) {
  const res = await axiosInstance.patch('/tasks', body);
  return res.data;
}
