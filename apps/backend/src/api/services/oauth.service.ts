import {
  AUTH_PROVIDERS,
  USER_ROLES,
  type AuthProvider,
} from '@horizon/shared';
import { ErrorFactory } from '../errors/errors';
import { OAUTH_CONFIG } from '../config/oauth';
import { authService } from './auth.service';
import { UserModel } from '../models/user.model';

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

const randomState = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const oauthService = {
  buildAuthorizationUrl(provider: AuthProvider, state?: string) {
    const nextState = state ?? randomState();

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

  async handleCallback(provider: AuthProvider, code: string, meta?: RequestMeta) {
    const profile = await this.fetchProviderProfile(provider, code);

    const email = profile.email.trim().toLowerCase();
    let user = await UserModel.findOne({ email });

    if (!user) {
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
        user.providers.push({
          provider,
          providerUserId: profile.providerUserId,
        });
      }

      if (!user.name && profile.name) user.name = profile.name;
      if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
      await user.save();
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

  async fetchProviderProfile(provider: AuthProvider, code: string): Promise<OAuthProfile> {
    if (provider === AUTH_PROVIDERS.GOOGLE) {
      return this.fetchGoogleProfile(code);
    }

    if (provider === AUTH_PROVIDERS.GITHUB) {
      return this.fetchGithubProfile(code);
    }

    throw ErrorFactory.badRequest('Unsupported OAuth provider', 'ERR_UNSUPPORTED_PROVIDER');
  },

  async fetchGoogleProfile(code: string): Promise<OAuthProfile> {
    const cfg = OAUTH_CONFIG.GOOGLE;

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
      throw ErrorFactory.unauthorized('Google token exchange failed', 'ERR_GOOGLE_TOKEN');
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw ErrorFactory.unauthorized('Google access token missing', 'ERR_GOOGLE_TOKEN');
    }

    const profileRes = await fetch(cfg.USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      throw ErrorFactory.unauthorized('Google profile fetch failed', 'ERR_GOOGLE_PROFILE');
    }

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

  async fetchGithubProfile(code: string): Promise<OAuthProfile> {
    const cfg = OAUTH_CONFIG.GITHUB;

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
      throw ErrorFactory.unauthorized('GitHub token exchange failed', 'ERR_GITHUB_TOKEN');
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw ErrorFactory.unauthorized('GitHub access token missing', 'ERR_GITHUB_TOKEN');
    }

    const profileRes = await fetch(cfg.USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!profileRes.ok) {
      throw ErrorFactory.unauthorized('GitHub profile fetch failed', 'ERR_GITHUB_PROFILE');
    }

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

