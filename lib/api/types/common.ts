export type GlobalRole = 'USER' | 'ADMIN' | 'MODERATOR';

export interface ActionResponse {
  message: string;
}

export interface ApiErrorBody {
  statusCode: number;
  errorCode: string;
  message: string;
}
