import axios from 'axios';
import type { DogsResp, DogImageResp } from './types';

const BREEDS_URL = 'https://dog.ceo/api/breeds/list/all';

/**
 * Fetches all dog breeds from external API.
 */
export async function getDogs(): Promise<DogsResp> {
  const { data } = await axios.get<DogsResp>(BREEDS_URL);
  return data;
}

/**
 * Fetches a random dog image URL for a given breed.
 * @param breed The breed name.
 */
export async function getDogImage(breed: string): Promise<string> {
  const { data } = await axios.get<DogImageResp>(`https://dog.ceo/api/breed/${breed}/images/random`);
  return data.message;
}
