import {
  AUTH_PROVIDERS,
  USER_ROLES,
  type AuthProvider,
} from '@horizon/shared';
import { ErrorFactory } from '../errors/errors';
import { OAUTH_CONFIG } from '../config/oauth';
import { authService } from './auth.service';
import { UserModel } from '../models/user.model';
import { logger } from '../../utils/logger';

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
};

type OAuthProfile = {
  providerUserId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

/** Creates a short-lived random state token for OAuth CSRF protection. */
const randomState = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const oauthService = {
  /** Builds provider authorization URL and returns it with resolved state. */
  buildAuthorizationUrl(provider: AuthProvider, state?: string) {
    const nextState = state ?? randomState();
    logger.info('Building OAuth authorization URL', { provider });

    if (provider === AUTH_PROVIDERS.GOOGLE) {
      const cfg = OAUTH_CONFIG.GOOGLE;
      const query = new URLSearchParams({
        client_id: cfg.CLIENT_ID,
        redirect_uri: cfg.CALLBACK_URL,
        response_type: 'code',
        scope: 'openid email profile',
        state: nextState,
      });

      return { url: `${cfg.AUTH_URL}?${query.toString()}`, state: nextState };
    }

    if (provider === AUTH_PROVIDERS.GITHUB) {
      const cfg = OAUTH_CONFIG.GITHUB;
      const query = new URLSearchParams({
        client_id: cfg.CLIENT_ID,
        redirect_uri: cfg.CALLBACK_URL,
        scope: 'read:user user:email',
        state: nextState,
      });

      return { url: `${cfg.AUTH_URL}?${query.toString()}`, state: nextState };
    }

    throw ErrorFactory.badRequest('Unsupported OAuth provider', 'ERR_UNSUPPORTED_PROVIDER');
  },

  /** Exchanges provider callback code, upserts user, and issues app tokens. */
  async handleCallback(provider: AuthProvider, code: string, meta?: RequestMeta) {
    logger.info('Handling OAuth callback', { provider });
    const profile = await this.fetchProviderProfile(provider, code);

    const email = profile.email.trim().toLowerCase();
    let user = await UserModel.findOne({ email });

    if (!user) {
      logger.info('Creating new user from OAuth profile', { provider, email });
      user = await UserModel.create({
        email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        role: USER_ROLES.USER,
        providers: [{ provider, providerUserId: profile.providerUserId }],
        isEmailVerified: true,
        tokenVersion: 0,
      });
    } else {
      const linkedProvider = user.providers.some(
        (item) =>
          item.provider === provider && item.providerUserId === profile.providerUserId
      );

      if (!linkedProvider) {
        logger.info('Linking OAuth provider to existing user', {
          provider,
          userId: user._id.toString(),
        });
        user.providers.push({
          provider,
          providerUserId: profile.providerUserId,
        });
      }

      if (!user.name && profile.name) user.name = profile.name;
      if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
      await user.save();
      logger.info('OAuth user profile updated', { userId: user._id.toString() });
    }

    return authService.issueSessionTokens(
      user._id.toString(),
      meta,
      user.email,
      user.role,
      user.tokenVersion,
      user
    );
  },

  /** Resolves provider-specific profile retrieval based on provider name. */
  async fetchProviderProfile(provider: AuthProvider, code: string): Promise<OAuthProfile> {
    logger.info('Fetching OAuth provider profile', { provider });
    if (provider === AUTH_PROVIDERS.GOOGLE) {
      return this.fetchGoogleProfile(code);
    }

    if (provider === AUTH_PROVIDERS.GITHUB) {
      return this.fetchGithubProfile(code);
    }

    throw ErrorFactory.badRequest('Unsupported OAuth provider', 'ERR_UNSUPPORTED_PROVIDER');
  },

  /** Exchanges Google auth code for user profile details. */
  async fetchGoogleProfile(code: string): Promise<OAuthProfile> {
    const cfg = OAUTH_CONFIG.GOOGLE;
    logger.info('Starting Google OAuth token exchange');

    const tokenRes = await fetch(cfg.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.CLIENT_ID,
        client_secret: cfg.CLIENT_SECRET,
        redirect_uri: cfg.CALLBACK_URL,
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!tokenRes.ok) {
      logger.warn('Google token exchange failed', { status: tokenRes.status });
      throw ErrorFactory.unauthorized('Google token exchange failed', 'ERR_GOOGLE_TOKEN');
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      logger.warn('Google token exchange missing access token');
      throw ErrorFactory.unauthorized('Google access token missing', 'ERR_GOOGLE_TOKEN');
    }

    const profileRes = await fetch(cfg.USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      logger.warn('Google profile fetch failed', { status: profileRes.status });
      throw ErrorFactory.unauthorized('Google profile fetch failed', 'ERR_GOOGLE_PROFILE');
    }
    logger.info('Google profile fetched successfully');

    const profile = (await profileRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    return {
      providerUserId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    };
  },

  /** Exchanges GitHub auth code for user profile details. */
  async fetchGithubProfile(code: string): Promise<OAuthProfile> {
    const cfg = OAUTH_CONFIG.GITHUB;
    logger.info('Starting GitHub OAuth token exchange');

    const tokenRes = await fetch(cfg.TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: cfg.CLIENT_ID,
        client_secret: cfg.CLIENT_SECRET,
        redirect_uri: cfg.CALLBACK_URL,
        code,
      }),
    });

    if (!tokenRes.ok) {
      logger.warn('GitHub token exchange failed', { status: tokenRes.status });
      throw ErrorFactory.unauthorized('GitHub token exchange failed', 'ERR_GITHUB_TOKEN');
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      logger.warn('GitHub token exchange missing access token');
      throw ErrorFactory.unauthorized('GitHub access token missing', 'ERR_GITHUB_TOKEN');
    }

    const profileRes = await fetch(cfg.USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!profileRes.ok) {
      logger.warn('GitHub profile fetch failed', { status: profileRes.status });
      throw ErrorFactory.unauthorized('GitHub profile fetch failed', 'ERR_GITHUB_PROFILE');
    }
    logger.info('GitHub profile fetched successfully');

    const profile = (await profileRes.json()) as {
      id: number;
      email: string | null;
      name: string | null;
      login: string;
      avatar_url?: string;
    };

    return {
      providerUserId: String(profile.id),
      email: profile.email ?? `${profile.login}@users.noreply.github.com`,
      name: profile.name ?? profile.login,
      avatarUrl: profile.avatar_url,
    };
  },
};
