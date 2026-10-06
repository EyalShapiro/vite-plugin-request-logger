import { memo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useGetDogImage } from '../../api/dog';

/**
 * Dog Detail component displaying a random dog image for the selected breed.
 */
function DogDetail() {
  const { breed } = useParams<{ breed: string }>();
  const navigate = useNavigate();
  const { data: imageUrl, isLoading, isError } = useGetDogImage(breed);

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
      <button
        onClick={() => navigate('/dogs')}
        className="mb-4 bg-transparent border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-md cursor-pointer inline-flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors dark:text-slate-50 text-slate-700 font-medium"
      >
        ← Back to Breed List
      </button>
      <h2 className="capitalize text-3xl font-bold mb-6 text-slate-900 dark:text-slate-50">
        🐶 {breed}
      </h2>
      {isLoading && (
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading cute photo...</p>
      )}
      {isError && (
        <p className="text-red-500 font-medium">Failed to load dog image.</p>
      )}
      {imageUrl && !isLoading && (
        <img
          src={imageUrl}
          alt={breed}
          className="max-w-full max-h-[400px] rounded-lg object-cover mx-auto shadow-md border border-slate-200 dark:border-slate-700"
        />
      )}
    </div>
  );
}

export default memo(DogDetail);
