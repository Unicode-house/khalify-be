import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './filter/global-exception.filter';
import { GlobalResponseInterceptor } from './interceptor/global-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ───────────────────────────────────────────────────────────────────────
  // GLOBAL PIPES — Validation with class-validator + class-transformer
  // ───────────────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ───────────────────────────────────────────────────────────────────────
  // GLOBAL FILTERS — Enterprise exception handling (JSON-API spec)
  // ───────────────────────────────────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ───────────────────────────────────────────────────────────────────────
  // GLOBAL INTERCEPTORS — Enterprise response envelope wrapping
  // ───────────────────────────────────────────────────────────────────────
  app.useGlobalInterceptors(new GlobalResponseInterceptor());

  // ───────────────────────────────────────────────────────────────────────
  // SWAGGER / OpenAPI DOCUMENTATION
  // ───────────────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Khalify API')
    .setDescription(
      `## 🏗️ Khalify — Enterprise REST API v2.0

Khalify is a **Content Preview Widget** platform that integrates with Notion databases 
to create embeddable, customizable content widgets for creators and businesses.

### 📐 Architecture
All API responses follow the **JSON-API Envelope Pattern** (Google/Microsoft Standard):
\`\`\`json
{
  "status": { "code": 200, "type": "SUCCESS", "message": "..." },
  "data": { ... },
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601", "apiVersion": "2.0.0" }
}
\`\`\`

### 🔐 Authentication
This API uses **Magic Link** authentication via email. After verifying the magic link token, 
a **JWT Bearer Token** is issued. Include it in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

### 📌 Key Conventions
| Convention | Detail |
|---|---|
| **Naming** | Strict camelCase for all JSON keys |
| **Timestamps** | ISO 8601 extended format with UTC (\`YYYY-MM-DDTHH:mm:ss.sssZ\`) |
| **IDs** | UUID v4 format |
| **Tracing** | Every response includes \`X-Request-Id\` header and \`meta.requestId\` |
| **Errors** | Structured \`errorCode\` + \`errorType\` + optional \`fieldErrors[]\` |

### 🏷️ API Modules
| Module | Description |
|---|---|
| **Auth** | Magic link login, token verification, JWT issuance |
| **Users** | User account management (CRUD) |
| **Profiles** | User profile & PRO subscription management |
| **Widgets** | Notion widget creation, branding, embedding |
| **Orders** | Transaction order management |
| **Midtrans** | Payment gateway integration (Snap API) |
| **Payment** | PRO upgrade link generation & status sync |
`,
    )
    .setVersion('2.0.0')
    .setContact('Khalify Team', 'https://khlasify.com', 'support@khlasify.com')
    .setLicense('UNLICENSED', '')
    .addServer('http://localhost:4545', '🖥️ Local Development')
    .addServer('https://api.khlasify.com', '🌐 Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token obtained from POST /auth/verify-token',
        in: 'header',
      },
      'JWT-Auth',
    )
    .addGlobalParameters({
      name: 'X-Request-Id',
      in: 'header',
      required: false,
      description: 'Optional correlation ID for request tracing. If not provided, one is auto-generated.',
      schema: { type: 'string', format: 'uuid', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Khalify API Documentation',
    customfavIcon: 'https://res.cloudinary.com/dldcpjdoz/image/upload/khlasify_Primary_Logo-transparent_prq4xe.png',
    customCss: `
      .swagger-ui .topbar { background-color: #1a1a2e; }
      .swagger-ui .topbar .link { content: url(''); }
      .swagger-ui .info .title { font-size: 2rem; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  // ───────────────────────────────────────────────────────────────────────
  // CORS CONFIGURATION
  // ───────────────────────────────────────────────────────────────────────
  const allowedOrigins = [
    'https://khalify-notion-widgets.vercel.app',
    'https://khlasify-notion-widget.vercel.app',
    'https://widget.khlasify.com',
    'http://localhost:3000',
  ];  

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });

  await app.listen(process.env.PORT ?? 4545);
}
bootstrap();
