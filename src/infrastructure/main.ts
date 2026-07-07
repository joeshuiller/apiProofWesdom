// 🔑 CRÍTICO: 'reflect-metadata' DEBE ser siempre la primera línea de ejecución 
// antes de importar cualquier clase decorada con @injectable() o el contenedor IoC.
import 'reflect-metadata';

import { TYPES } from '@app/dtos/models/types';
// Usamos alias de ruta estándar de Webpack para evitar problemas de resolución de módulos
import { container } from '@infra/di/inversifyConfig';
import { ServerExpress } from '@infra/config/ExpressServer';

/**
 * Función bootstrap para inicializar y arrancar el servidor Express de forma segura.
 */
export const bootstrap = async () => {
    // Manejo global de promesas rechazadas no capturadas
    process.removeAllListeners('unhandledRejection');
    process.on('unhandledRejection', (reason, promise) => {
        console.error('🔴 Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Manejo global de excepciones no capturadas
    process.on('uncaughtException', (error) => {
        console.error('🔴 Uncaught Exception arrojada:', error);
    });

    // 🚀 Inyección/Resolución de la dependencia de nivel superior 'ServerExpress'
    // Al estar 'reflect-metadata' cargado en la línea 1, la resolución de dependencias 
    // mediante container.get ya no lanzará el error "TypeError: Reflect.getOwnMetadata"
    const server = container.get<ServerExpress>(TYPES.ServerExpress);

    // Obligamos a Node a esperar ordenadamente a que la base de datos y Express inicialicen
    await server.start();
    return server;
};

if (require.main === module) {
    // Capturamos cualquier error fatal durante la fase de arranque (handshake, db, etc.)
    bootstrap().catch(err => {
        console.error("💥 Error fatal al arrancar el bootstrap:", err);
    });
}