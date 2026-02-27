import { AuthProvider } from '../types';

export interface OAuthCallBackInput {
  provider: AuthProvider;
  code: string;
  state?: string;
}
