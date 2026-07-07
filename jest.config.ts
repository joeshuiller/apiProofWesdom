/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  // Fuerza a Jest a cargar reflect-metadata antes que cualquier otra cosa
  setupFilesAfterEnv: ['reflect-metadata'],
  testEnvironment: 'node',

  // --- Configuración de Cobertura ---
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.ts',                // Archivos a medir
    '!src/**/*.d.ts',             // Ignorar archivos de tipos
    '!src/**/index.ts',           // Ignorar barriles de exportación
    '!src/infrastructure/https/routes/**',  // Ejemplo: ignorar rutas o controladores si prefieres
    '!src/**/dtos/**',                      // Ignorar toda la carpeta dtos y su contenido
    '!src/**/models/**',                    // Ignorar la carpeta models
    '!src/**/entities/**',                  // Ignorar la carpeta entities
    '!src/**/interfaces/**',                // Ignorar carpetas de interfaces (si tienes)
    '!src/domain/repositories/I*.ts',       // Ignorar archivos que empiecen con 'I' (ej: IUsersRepository.ts)
    '!src/domain/services/mappers/Mapper.ts',    // Ignorar archivos de mapeo
    '!src/infrastructure/database/migrations/**',
  ],
  // Umbrales mínimos (opcional): si no se cumplen, el test falla
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  maxWorkers: 1,
  // Aquí le enseñamos a Jest a leer los alias (CORREGIDO):
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@app/(.*)$': '<rootDir>/src/application/$1',     // <-- Cambiado de app a application
    '^@infra/(.*)$': '<rootDir>/src/infrastructure/$1', // <-- Cambiado de @infrastructure a @infra
    '^@core/(.*)$': '<rootDir>/src/core/$1',           // <-- Añadido
    '^@shared/(.*)$': '<rootDir>/src/shared/$1'        // <-- Añadido
  },
  clearMocks: false,
  // Evita procesar archivos compilados en dist
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/', "node_modules/reflect-metadata"],
  logHeapUsage: true,
  workerIdleMemoryLimit: '512MB',
};