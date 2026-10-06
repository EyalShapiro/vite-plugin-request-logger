import axios from 'axios';
import type { DogsResp, DogImageResp } from './types';

const DOG_API_URL = 'https://dog.ceo/api/';
export const apiDogAxios = axios.create({ baseURL: DOG_API_URL });

apiDogAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Dog API Error]', error);
    return Promise.reject(error);
  },
);

/**
 * Fetches all dog breeds from the Dog API.
 * @returns {Promise<DogsResp>} All breeds response object.
 */
export async function getDogs(): Promise<DogsResp> {
  const { data } = await apiDogAxios.get<DogsResp>('breeds/list/all');
  return data;
}

/**
 * Fetches a random dog image URL for a given breed.
 * @param breed The breed name.
 * @returns {Promise<string>} The image URL.
 */
export async function getDogImage(breed: string): Promise<string> {
  const encodedBreed = encodeURIComponent(breed);
  const { data } = await apiDogAxios.get<DogImageResp>(`breed/${encodedBreed}/images/random`);
  return data.message;
}
