import swaggerAutogen from 'swagger-autogen';
import path from 'path';
import { configEnv } from '../config/env';

const host = configEnv.HOST || 'localhost';
const httpPort = configEnv.PORT || 3000;
const httpsPort = configEnv.PORT_HTTPS || 3443;
console.log(host, httpPort, httpsPort);
const doc = {
  info: {
    title: 'API WCServices',
    version: '1.0.0',
    description: 'Documentación técnica de la API WCServices con soporte HTTP/HTTPS e InversifyJS.',
  },
  // 1. Definimos los servidores para que Swagger permita alternar entre ellos
  servers: [
    {
      url: `http://${host}:${httpPort}`,
      description: 'Servidor Local (HTTP)'
    },
    {
      url: `https://${host}:${httpsPort}`,
      description: 'Servidor Seguro (HTTPS / Local con Certificados)'
    },
    {
      url: `https://${host}`,
      description: 'Servidor de Producción'
    }
  ],
  // 2. Esquemas permitidos
  schemes: ['http', 'https'],

  // 3. Seguridad para JWT
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Introduce el token JWT: Bearer <token>'
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      // 📥 Lo que el cliente envía para crear/editar
      RolesRequestDTO: {
        type: "object",
        required: ["name", "active"],
        properties: {
          name: { type: "string", example: "Administrador", description: "Nombre único del rol" },
          active: { type: "boolean", example: true, description: "Estado del rol en el sistema" }
        }
      },
      // 📤 Lo que el servidor devuelve
      RolesResponseDTO: {
        type: "object",
        properties: {
          id: { type: "number", example: 1 },
          name: { type: "string", example: "Administrador" },
          active: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },

    }
  }
};
// 1. Usa la raíz del proyecto para evitar errores de ../../
const rootDir = process.cwd();

const outputFile = path.resolve(rootDir, 'src/infrastructure/swagger_output.json');

// 2. 🚩 LA SOLUCIÓN DEFINITIVA: Lista TODOS los archivos de rutas explícitamente
const endpointsFiles = [
  // El archivo de rutas principal
  path.resolve(rootDir, 'src/infrastructure/https/routes/Routes.ts'),

  // Si tus rutas están en subcarpetas, agrégalas todas así:
  path.resolve(rootDir, 'src/infrastructure/https/routes/private/RolesRoute.ts'),
  path.resolve(rootDir, 'src/infrastructure/https/routes/public/UsersRoute.ts'),
  path.resolve(rootDir, 'src/infrastructure/https/routes/private/WalletRoutes.ts'),
  path.resolve(rootDir, 'src/infrastructure/https/routes/private/WalletHistoryRoutes.ts'),
];

// 3. Activa los LOGS para ver qué archivos SÍ está encontrando
const options = {
  openapi: '3.0.0',
  disableLogs: false,
  disableWarnings: false
};

const autogen = swaggerAutogen(options);

//console.log("🔍 Iniciando escaneo de archivos en:", endpointsFiles);

autogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("✅ swagger_output.json generado en:", outputFile);
});