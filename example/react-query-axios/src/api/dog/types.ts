export type DogsResp = {
  message: { [dog: string]: Array<string> };
};

export type DogsList = string[];

export type DogImageResp = {
  message: string;
  status: string;
};
