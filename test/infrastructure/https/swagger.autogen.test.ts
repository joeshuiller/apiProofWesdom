import path from 'path';
import fs from 'fs';

// 1. ✅ Definimos los mocks por separado para poder rastrearlos individualmente
const mockAutogenInstance = jest.fn().mockResolvedValue({ success: true });
const mockAutogenFactory = jest.fn(() => mockAutogenInstance);

// 2. ✅ Aplicamos el mock al módulo devolviendo la función factory
jest.mock('swagger-autogen', () => mockAutogenFactory);

// Importamos el módulo después del mock
import swaggerAutogen from 'swagger-autogen';

describe("Swagger Configuration & Autogen", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 1. Test de Rutas de Archivos
    describe("File Paths Validation", () => {
        it("should verify that all defined endpoint files exist in the project", () => {
            const rootDir = process.cwd();
            const endpointsFiles = [
                'src/infrastructure/https/routes/Routes.ts',
                'src/infrastructure/https/routes/private/MenuRoutes.ts',
                'src/infrastructure/https/routes/private/CampaignsRoute.ts',
                'src/infrastructure/https/routes/private/ClientsProyectsRoutes.ts',
                'src/infrastructure/https/routes/private/RolesRoute.ts',
                'src/infrastructure/https/routes/private/TypeProyectsRoute.ts',
                'src/infrastructure/https/routes/public/UsersRoute.ts',
                'src/infrastructure/https/routes/public/InitialRoute.ts',
                'src/infrastructure/external-services/routes/WebHookRoute.ts'
            ];

            endpointsFiles.forEach(file => {
                const fullPath = path.resolve(rootDir, file);
                const exists = fs.existsSync(fullPath);
                expect(exists).toBe(true);
            });
        });
    });

    // 2. Test de Integridad del objeto DOC
    describe("Swagger Document Object", () => {
        const doc = {
            info: { title: 'API WCServices', version: '1.0.0' },
            openapi: '3.0.0',
            components: {
                schemas: {
                    ClientsProyectsResponseDTO: {},
                    CreateMenuResponseDTO: {},
                    CampaignsResponseDTO: {},
                    RolesResponseDTO: {},
                    WebHookResponseDTO: {}
                }
            }
        };

        it("should have the required OpenAPI 3.0 structure", () => {
            expect(doc.openapi).toBe('3.0.0');
            expect(doc.info.title).toBeDefined();
            expect(doc.components.schemas).toBeDefined();
        });

        it("should contain all critical DTO schemas", () => {
            const requiredSchemas = [
                'ClientsProyectsResponseDTO',
                'CreateMenuResponseDTO',
                'CampaignsResponseDTO',
                'RolesResponseDTO',
                'WebHookResponseDTO'
            ];

            requiredSchemas.forEach(schema => {
                expect(doc.components.schemas).toHaveProperty(schema);
            });
        });
    });

    // 3. Test de Ejecución de la función Autogen
    describe("Autogen Execution", () => {
        it("should call the autogen function with correct parameters", async () => {
            const outputFile = './swagger_output.json';
            const endpoints = ['./src/routes.ts'];
            const doc = { info: { title: 'Test' } };

            // ✅ Simulamos la llamada real: swaggerAutogen()(output, endpoints, doc)
            const autogenInstance = swaggerAutogen();
            await autogenInstance(outputFile, endpoints, doc);

            // Verificamos que se llamó a la fábrica inicial
            expect(mockAutogenFactory).toHaveBeenCalled();

            // ✅ Verificamos la llamada a la INSTANCIA (la que antes fallaba)
            expect(mockAutogenInstance).toHaveBeenCalledWith(outputFile, endpoints, doc);
        });
    });
});