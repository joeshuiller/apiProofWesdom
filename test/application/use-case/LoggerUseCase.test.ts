import { LoggerUseCase } from '@app/use-cases/LoggerUseCase'; // Ajusta la ruta a tu archivo real
import { ILoggerRepository, LogMetadata } from '@domain/repositories/ILoggerRepository';

describe('LoggerUseCase', () => {
    let loggerUseCase: LoggerUseCase;
    let mockLoggerRepository: jest.Mocked<ILoggerRepository>;

    // Variables reutilizables para los tests
    const testMessage = 'Mensaje de prueba';
    const testService = 'AuthService';
    const testMeta: LogMetadata = { userId: '123', action: 'login' }; // Ajusta las propiedades a lo que acepte tu LogMetadata

    beforeEach(() => {
        // 1. Creamos el mock simulando todas las funciones de la interfaz
        mockLoggerRepository = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };

        // 2. Instanciamos el caso de uso inyectando nuestro mock
        loggerUseCase = new LoggerUseCase(mockLoggerRepository);
    });

    afterEach(() => {
        jest.clearAllMocks(); // Limpiamos para que un test no afecte a otro
    });

    describe('info', () => {
        it('debería llamar a logger.info con el mensaje, el servicio y la metadata', () => {
            loggerUseCase.info(testMessage, testService, testMeta);

            expect(mockLoggerRepository.info).toHaveBeenCalledTimes(1);
            expect(mockLoggerRepository.info).toHaveBeenCalledWith(testMessage, testService, testMeta);
        });

        it('debería llamar a logger.info sin metadata si no se proporciona', () => {
            loggerUseCase.info(testMessage, testService);

            expect(mockLoggerRepository.info).toHaveBeenCalledTimes(1);
            expect(mockLoggerRepository.info).toHaveBeenCalledWith(testMessage, testService, undefined);
        });
    });

    describe('error', () => {
        it('debería llamar a logger.error con el mensaje, el servicio y la metadata', () => {
            loggerUseCase.error(testMessage, testService, testMeta);

            expect(mockLoggerRepository.error).toHaveBeenCalledTimes(1);
            expect(mockLoggerRepository.error).toHaveBeenCalledWith(testMessage, testService, testMeta);
        });
    });

    describe('warn', () => {
        it('debería llamar a logger.warn con el mensaje, el servicio y la metadata', () => {
            loggerUseCase.warn(testMessage, testService, testMeta);

            expect(mockLoggerRepository.warn).toHaveBeenCalledTimes(1);
            expect(mockLoggerRepository.warn).toHaveBeenCalledWith(testMessage, testService, testMeta);
        });
    });

    describe('debug', () => {
        it('debería llamar a logger.debug con el mensaje, el servicio y la metadata', () => {
            loggerUseCase.debug(testMessage, testService, testMeta);

            expect(mockLoggerRepository.debug).toHaveBeenCalledTimes(1);
            expect(mockLoggerRepository.debug).toHaveBeenCalledWith(testMessage, testService, testMeta);
        });
    });
});