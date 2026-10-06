import { useNavigate } from 'react-router';
import { memo } from 'react';

import { useGetDocs } from '../../api/dog';
function DogsList() {
  const { data: breeds, isLoading, isError } = useGetDocs();
  const navigate = useNavigate();

  if (isLoading) return <p>Loading cute dogs...</p>;
  if (isError) return <p style={{ color: '#ef4444' }}>Failed to load dogs.</p>;

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
      <h2 className="mt-0 text-slate-900 dark:text-slate-50 text-2xl font-bold mb-4">
        🐶 Dog Breeds
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
        {breeds?.map((breed) => (
          <div
            key={breed}
            onClick={() => navigate(`/dogs/${breed}`)}
            className="p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-center cursor-pointer font-semibold capitalize shadow-sm transition-transform hover:scale-105 hover:shadow-md dark:text-slate-50"
          >
            {breed}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(DogsList);
