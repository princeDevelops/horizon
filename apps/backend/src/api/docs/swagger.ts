import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const errorResponseSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', example: 'fail' },
    statusCode: { type: 'integer', example: 401 },
    message: { type: 'string', example: 'Authentication required' },
    timestamp: {
      type: 'string',
      format: 'date-time',
      example: '2026-03-19T10:20:30.000Z',
    },
    code: { type: 'string', example: 'INVALID_TOKEN' },
    field: { type: 'string', example: 'email' },
    resourceType: { type: 'string', example: 'Task' },
    resourceId: { type: 'string', example: '67d8f70f75c6a3e92c62b111' },
    requiredRole: { type: 'string', example: 'ADMIN' },
    retryAfter: { type: 'integer', example: 60 },
    errorId: { type: 'string', example: 'ERR-1742350830000' },
  },
  required: ['status', 'statusCode', 'message', 'timestamp'],
};

const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Horizon API',
    version: '1.0.0',
    description: [
      'Backend-first task management API for recruiter review.',
      '',
      'Authentication model:',
      '- Login and signup return an access token in the JSON response body.',
      '- The backend also sets an HTTP-only refresh token cookie.',
      '- Protected endpoints require `Authorization: Bearer <accessToken>`.',
      '- `POST /auth/refresh` rotates the refresh cookie and returns a new access token.',
      '',
      'Rate limiting:',
      '- `POST /auth/signup`, `POST /auth/login`, and `POST /auth/refresh` use the strict auth limiter.',
      '- `/tasks` endpoints use the global API limiter.',
      '- When limits are exceeded, the API returns `429` and may include `Retry-After`.',
    ].join('\n'),
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Liveness and readiness probes.',
    },
    {
      name: 'Auth',
      description:
        'Password and OAuth authentication. Access tokens are sent as Bearer tokens. Refresh tokens are stored in an HTTP-only cookie scoped to `/api/v1/auth/refresh`.',
    },
    {
      name: 'Tasks',
      description:
        'Authenticated task operations. All task endpoints require Bearer authentication and are covered by the global API rate limiter.',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Paste the access token returned by login, signup, or refresh.',
      },
    },
    schemas: {
      ErrorResponse: errorResponseSchema,
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '67d8f70f75c6a3e92c62b100' },
          name: { type: 'string', example: 'Aman Sharma' },
          email: {
            type: 'string',
            format: 'email',
            example: 'aman@example.com',
          },
          role: { type: 'string', example: 'USER' },
          authProvider: { type: 'string', example: 'LOCAL' },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-18T14:10:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-19T08:40:00.000Z',
          },
        },
        required: ['id', 'name', 'email', 'role'],
      },
      AuthTokensResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
            },
            required: ['user', 'accessToken'],
          },
        },
        required: ['success', 'message', 'data'],
      },
      LogoutResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Logout successful' },
        },
        required: ['success', 'message'],
      },
      MeResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/User' },
        },
        required: ['success', 'data'],
      },
      LoginInput: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'aman@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'StrongPass123',
          },
        },
        required: ['email', 'password'],
      },
      SignUpInput: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Aman Sharma' },
          email: {
            type: 'string',
            format: 'email',
            example: 'aman@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'StrongPass123',
          },
        },
        required: ['name', 'email', 'password'],
      },
      RefreshTokenInput: {
        type: 'object',
        properties: {
          refreshToken: {
            type: 'string',
            description:
              'Fallback for non-browser clients. Browsers should prefer the HTTP-only refresh cookie.',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '67d8f70f75c6a3e92c62b200' },
          userId: { type: 'string', example: '67d8f70f75c6a3e92c62b100' },
          title: { type: 'string', example: 'Ship recruiter-ready backend' },
          description: {
            type: 'string',
            example: 'Add Swagger docs and deployment assets',
          },
          status: { type: 'string', example: 'in-progress' },
          priority: { type: 'string', example: 'high' },
          dueDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-25T18:30:00.000Z',
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-19T09:00:00.000Z',
          },
          finishedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-20T12:00:00.000Z',
          },
          isArchived: { type: 'boolean', example: false },
          isPinned: { type: 'boolean', example: true },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['work'],
          },
          customTags: {
            type: 'array',
            items: { type: 'string' },
            example: ['resume', 'backend'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-19T09:10:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-19T10:10:00.000Z',
          },
        },
        required: [
          'id',
          'userId',
          'title',
          'status',
          'priority',
          'isArchived',
          'createdAt',
        ],
      },
      CreateTaskInput: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Document API for recruiters' },
          description: {
            type: 'string',
            example: 'Expose /api-docs and add auth examples',
          },
          priority: { type: 'string', example: 'high' },
          status: { type: 'string', example: 'pending' },
          dueDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-25T18:30:00.000Z',
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-19T09:00:00.000Z',
          },
          isArchived: { type: 'boolean', example: false },
          isPinned: { type: 'boolean', example: true },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['work'],
          },
          customTags: {
            type: 'array',
            items: { type: 'string' },
            example: ['resume', 'swagger'],
          },
        },
        required: ['title'],
      },
      UpdateTaskInput: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Finalize Swagger docs' },
          description: {
            type: 'string',
            example: 'Add response examples and 429 documentation',
          },
          priority: { type: 'string', example: 'medium' },
          status: { type: 'string', example: 'completed' },
          dueDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-26T18:30:00.000Z',
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-19T09:00:00.000Z',
          },
          finishedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-20T12:00:00.000Z',
          },
          isArchived: { type: 'boolean', example: false },
          isPinned: { type: 'boolean', example: true },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['work'],
          },
          customTags: {
            type: 'array',
            items: { type: 'string' },
            example: ['docs'],
          },
        },
      },
      DeleteSelectedTasksInput: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string' },
            example: [
              '67d8f70f75c6a3e92c62b200',
              '67d8f70f75c6a3e92c62b201',
            ],
          },
        },
        required: ['ids'],
      },
      BulkUpdateTaskFlagsInput: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string' },
            example: [
              '67d8f70f75c6a3e92c62b200',
              '67d8f70f75c6a3e92c62b201',
            ],
          },
          isArchived: { type: 'boolean', example: true },
          isPinned: { type: 'boolean', example: false },
        },
        required: ['ids'],
      },
      TaskResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Task created successfully' },
          data: { $ref: '#/components/schemas/Task' },
        },
        required: ['success', 'data'],
      },
      TaskListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Tasks fetched successfully' },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Task' },
          },
        },
        required: ['success', 'data'],
      },
      HealthLiveResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          status: { type: 'string', example: 'live' },
          uptimeSec: { type: 'number', example: 245.78 },
          startedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-19T09:10:00.000Z',
          },
          now: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-19T09:14:05.000Z',
          },
        },
        required: ['ok', 'status', 'uptimeSec', 'startedAt', 'now'],
      },
      HealthReadyResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          status: { type: 'string', example: 'ready' },
          checks: {
            type: 'object',
            properties: {
              database: { type: 'string', example: 'connected' },
            },
            required: ['database'],
          },
          now: {
            type: 'string',
            format: 'date-time',
            example: '2026-03-19T09:14:05.000Z',
          },
        },
        required: ['ok', 'status', 'checks', 'now'],
      },
    },
    responses: {
      UnauthorizedError: {
        description:
          'Authentication failed or no valid access token was provided.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              status: 'fail',
              statusCode: 401,
              message: 'Missing or invalid Authorization header',
              code: 'INVALID_TOKEN',
              timestamp: '2026-03-19T10:20:30.000Z',
            },
          },
        },
      },
      ValidationError: {
        description: 'Request input failed validation.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              status: 'fail',
              statusCode: 400,
              message: 'Validation failed',
              field: 'email',
              code: 'VALIDATION_FAILED',
              timestamp: '2026-03-19T10:20:30.000Z',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Requested resource was not found.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              status: 'fail',
              statusCode: 404,
              message: 'Task not found',
              resourceType: 'Task',
              resourceId: '67d8f70f75c6a3e92c62b200',
              timestamp: '2026-03-19T10:20:30.000Z',
            },
          },
        },
      },
      ConflictError: {
        description: 'Resource conflict, such as a duplicate unique field.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              status: 'fail',
              statusCode: 409,
              message: 'email already exists',
              code: 'DUPLICATE_FIELD',
              timestamp: '2026-03-19T10:20:30.000Z',
            },
          },
        },
      },
      RateLimitError: {
        description:
          'Too many requests. Auth endpoints use a stricter limiter than task endpoints.',
        headers: {
          'Retry-After': {
            description: 'Seconds until another request should be attempted.',
            schema: { type: 'integer', example: 60 },
          },
        },
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            examples: {
              auth: {
                summary: 'Auth limiter exceeded',
                value: {
                  status: 'fail',
                  statusCode: 429,
                  message: 'Too many requests for auth. Please try again later.',
                  retryAfter: 60,
                  timestamp: '2026-03-19T10:20:30.000Z',
                },
              },
              api: {
                summary: 'Global API limiter exceeded',
                value: {
                  status: 'fail',
                  statusCode: 429,
                  message: 'Too many requests for api. Please try again later.',
                  retryAfter: 120,
                  timestamp: '2026-03-19T10:20:30.000Z',
                },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        description:
          'Returns process liveness data. This endpoint does not verify downstream dependencies.',
        responses: {
          '200': {
            description: 'Process is alive.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthLiveResponse' },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe',
        description:
          'Reports whether the API is ready to serve traffic. It currently checks MongoDB connectivity.',
        responses: {
          '200': {
            description: 'Application is ready.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthReadyResponse' },
              },
            },
          },
          '503': {
            description:
              'Application is not ready because a required dependency is unavailable.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthReadyResponse' },
                example: {
                  ok: false,
                  status: 'not_ready',
                  checks: {
                    database: 'disconnected',
                  },
                  now: '2026-03-19T09:14:05.000Z',
                },
              },
            },
          },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Create a local account',
        description:
          'Creates a user, returns an access token in the response body, and sets the HTTP-only refresh token cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignUpInput' },
            },
          },
        },
        responses: {
          '201': {
            description:
              'Signup successful. Access token returned and refresh cookie set.',
            headers: {
              'Set-Cookie': {
                description:
                  'Sets the `refreshToken` HTTP-only cookie on the `/api/v1/auth/refresh` path.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthTokensResponse' },
                example: {
                  success: true,
                  message: 'Signup successful',
                  data: {
                    user: {
                      id: '67d8f70f75c6a3e92c62b100',
                      name: 'Aman Sharma',
                      email: 'aman@example.com',
                      role: 'USER',
                    },
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': { $ref: '#/components/responses/ConflictError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        description:
          'Returns an access token in the response body and sets the HTTP-only refresh token cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
            },
          },
        },
        responses: {
          '200': {
            description:
              'Login successful. Access token returned and refresh cookie set.',
            headers: {
              'Set-Cookie': {
                description:
                  'Sets the `refreshToken` HTTP-only cookie on the `/api/v1/auth/refresh` path.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthTokensResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh session and issue a new access token',
        description:
          'Reads the refresh token from the HTTP-only cookie when present. Non-browser clients may send `refreshToken` in the request body. On success, the refresh token is rotated and a new cookie is set.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenInput' },
            },
          },
        },
        responses: {
          '200': {
            description:
              'Token refresh successful. A new access token is returned and the refresh cookie is rotated.',
            headers: {
              'Set-Cookie': {
                description:
                  'Replaces the previous refresh token cookie with a rotated token.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthTokensResponse' },
                example: {
                  success: true,
                  message: 'Token refreshed',
                  data: {
                    user: {
                      id: '67d8f70f75c6a3e92c62b100',
                      name: 'Aman Sharma',
                      email: 'aman@example.com',
                      role: 'USER',
                    },
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new...',
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout the active refresh session',
        description:
          'Revokes the session if the refresh cookie is present and clears the refresh cookie from the client.',
        responses: {
          '200': {
            description: 'Logout successful.',
            headers: {
              'Set-Cookie': {
                description: 'Clears the `refreshToken` cookie.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LogoutResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current authenticated user',
        description: 'Requires a valid Bearer access token.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user profile.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MeResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/auth/oauth/{provider}/start': {
      get: {
        tags: ['Auth'],
        summary: 'Start OAuth flow',
        description:
          'Builds the provider authorization URL, stores an HTTP-only OAuth state cookie, and redirects the client to Google or GitHub.',
        parameters: [
          {
            name: 'provider',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['google', 'github'],
            },
          },
        ],
        responses: {
          '302': {
            description:
              'Redirects to the OAuth provider and sets the `oauth_state` cookie.',
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/oauth/{provider}/callback': {
      get: {
        tags: ['Auth'],
        summary: 'Complete OAuth flow',
        description:
          'Validates provider callback parameters, checks the OAuth state cookie, creates or logs in the local user, returns an access token in the response body, and sets the refresh cookie.',
        parameters: [
          {
            name: 'provider',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['google', 'github'],
            },
          },
          {
            name: 'code',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'state',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'OAuth login successful.',
            headers: {
              'Set-Cookie': {
                description:
                  'Sets the refresh token cookie and clears the `oauth_state` cookie.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthTokensResponse' },
                example: {
                  success: true,
                  message: 'OAuth login successful',
                  data: {
                    user: {
                      id: '67d8f70f75c6a3e92c62b100',
                      name: 'Aman Sharma',
                      email: 'aman@example.com',
                      role: 'USER',
                    },
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks for the authenticated user',
        description:
          'Supports filtering, pagination, and sorting. Requires Bearer authentication and is subject to the global API rate limiter.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string' },
            description: 'Single or repeated task status filter.',
          },
          {
            name: 'priority',
            in: 'query',
            schema: { type: 'string' },
            description: 'Single or repeated task priority filter.',
          },
          { name: 'isArchived', in: 'query', schema: { type: 'boolean' } },
          { name: 'isPinned', in: 'query', schema: { type: 'boolean' } },
          {
            name: 'tags',
            in: 'query',
            schema: { type: 'string' },
            description: 'Single or repeated predefined tag filter.',
          },
          {
            name: 'customTags',
            in: 'query',
            schema: { type: 'string' },
            description: 'Single or repeated custom tag filter.',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            example: 'swagger',
          },
          {
            name: 'dueFrom',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'dueTo',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'startFrom',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'startTo',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'createdFrom',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'createdTo',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'updatedFrom',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'updatedTo',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'finishedFrom',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'finishedTo',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'createdAt',
                'updatedAt',
                'dueDate',
                'startDate',
                'priority',
                'status',
                'title',
              ],
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
            },
          },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string' },
            example: 'dueDate:desc',
          },
          { name: 'id', in: 'query', schema: { type: 'string' } },
          {
            name: 'ids',
            in: 'query',
            schema: { type: 'string' },
            description: 'Single or repeated task id filter.',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, example: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, example: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Tasks fetched successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskListResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task',
        description: 'Creates a new task for the authenticated user.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTaskInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Task created successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/tasks/{id}': {
      patch: {
        tags: ['Tasks'],
        summary: 'Update a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateTaskInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task updated successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Task' },
                  },
                  required: ['success', 'data'],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Task deleted successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/tasks/bulk': {
      delete: {
        tags: ['Tasks'],
        summary: 'Delete multiple tasks',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DeleteSelectedTasksInput',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Selected tasks deleted successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: '2 task(s) deleted successfully',
                    },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Task' },
                    },
                  },
                  required: ['success', 'message', 'data'],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/tasks/bulk/flags': {
      patch: {
        tags: ['Tasks'],
        summary: 'Bulk update archive and pin flags',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BulkUpdateTaskFlagsInput',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task flags updated successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: '2 task(s) updated successfully',
                    },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Task' },
                    },
                  },
                  required: ['success', 'message', 'data'],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
  },
};

export const registerSwagger = (app: Express) => {
  app.get('/api/v1/api-docs.json', (_req, res) => {
    res.json(openapiSpec);
  });

  app.use(
    '/api/v1/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      explorer: true,
      customSiteTitle: 'Horizon API Docs',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
};

export { openapiSpec };
