export interface IGameResponse {
  name: string;
  id: number;
  description: string;
  url: string;
  is_test: boolean;
  number_of_plays: number;
  icon?: string;
  priority?: number;
}
