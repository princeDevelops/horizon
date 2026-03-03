import { AuthProvider } from '../types';

/** Payload contract for OAuth callback handling. */
export interface OAuthCallBackInput {
  provider: AuthProvider;
  code: string;
  state?: string;
}
