const ENV = import.meta.env;
export const API_ENDPOINT = ENV.VITE_API_ENDPOINT ?? '/api';

export const IS_PROD = ENV.PROD;
