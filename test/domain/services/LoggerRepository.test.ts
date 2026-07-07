import { LoggerRepository } from '@domain/services/LoggerRepository'; // Ajusta esta ruta a tu archivo real
import winston from 'winston';

// 1. Mockeamos las variables de entorno
jest.mock('@infra/config/env', () => ({
    configEnv: {
        NODE_ENV: 'test',
        LOG_LEVEL: 'debug',
    },
}));

// 2. Mockeamos Winston completo para que no cree archivos ni imprima en consola
jest.mock('winston', () => {
    const mLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };
    return {
        createLogger: jest.fn(() => mLogger),
        format: {
            combine: jest.fn(),
            timestamp: jest.fn(),
            errors: jest.fn(),
            json: jest.fn(),
            colorize: jest.fn(),
            simple: jest.fn(),
        },
        transports: {
            File: jest.fn(),
            Console: jest.fn(),
        },
    };
});

describe('LoggerRepository', () => {
    let loggerRepository: LoggerRepository;
    let mockWinstonLogger: any;

    beforeEach(() => {
        // Limpiamos los mocks antes de cada test para que no se mezclen
        jest.clearAllMocks();

        // Instanciamos nuestro repositorio
        loggerRepository = new LoggerRepository();

        // Recuperamos la instancia falsa de winston que se creó en el constructor
        mockWinstonLogger = (winston.createLogger as jest.Mock).mock.results[0].value;
    });

    it('debería inicializar Winston con la configuración correcta', () => {
        expect(winston.createLogger).toHaveBeenCalled();
        // Como estamos en 'test' (diferente a 'production'), debería usar Console
        expect(winston.transports.Console).toHaveBeenCalled();
    });

    it('debería registrar un mensaje INFO con los metadatos y servicio correctos', () => {
        const meta = { userId: 123, action: 'login' };
        loggerRepository.info('Usuario logueado', 'AuthService', meta);

        expect(mockWinstonLogger.info).toHaveBeenCalledWith(
            '[EVENT]: Usuario logueado',
            {
                userId: 123,
                action: 'login',
                env: 'test',
                service: 'AuthService'
            }
        );
    });

    it('debería registrar un mensaje ERROR correctamente', () => {
        loggerRepository.error('Fallo en la base de datos', 'DBService');

        expect(mockWinstonLogger.error).toHaveBeenCalledWith(
            '[EVENT]: Fallo en la base de datos',
            {
                env: 'test',
                service: 'DBService'
            }
        );
    });

    it('debería registrar un mensaje WARN correctamente', () => {
        loggerRepository.warn('Uso de CPU alto', 'MonitorService');

        expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
            '[EVENT]: Uso de CPU alto',
            {
                env: 'test',
                service: 'MonitorService'
            }
        );
    });

    it('debería registrar un mensaje DEBUG correctamente', () => {
        loggerRepository.debug('Variables cargadas', 'ConfigService');

        expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
            '[EVENT]: Variables cargadas',
            {
                env: 'test',
                service: 'ConfigService'
            }
        );
    });
});