import { useQuery } from '@tanstack/react-query';
import type { DogsResp, DogsList } from './types';
import { getDogs, getDogImage } from './functions';

function formatBreeds(data: DogsResp): string[] {
  return Object.keys(data.message);
}

/**
 * Custom React Query hook to fetch and format the list of dog breeds.
 */
export function useGetDocs() {
  return useQuery<DogsResp, Error, DogsList>({
    queryKey: ['dogs'],
    queryFn: getDogs,
    select: formatBreeds,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Custom React Query hook to fetch a random image for a specific dog breed.
 * @param breed Target dog breed.
 */
export function useGetDogImage(breed?: string) {
  return useQuery<string, Error>({
    queryKey: ['dog', 'image', breed],
    queryFn: () => getDogImage(breed!),
    enabled: Boolean(breed),
    staleTime: 1000 * 60 * 5,
  });
}
