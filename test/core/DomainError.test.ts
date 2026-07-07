import { DomainError } from '../../src/core/errors/DomainError'; // Ajusta la ruta a tu archivo real

// 1. Creamos una clase concreta solo para el test, ya que DomainError es abstracta
class MockDomainError extends DomainError {
    constructor(message: string) {
        super(message);
        // (Opcional) Es buena práctica darle nombre a los errores custom
        this.name = 'MockDomainError';
    }
}

describe('DomainError', () => {
    it('debería heredar de Error y guardar el mensaje correctamente', () => {
        // Arrange
        const testMessage = 'Este es un error de prueba del dominio';

        // Act
        const errorInstance = new MockDomainError(testMessage);

        // Assert
        // Verificamos que realmente es un Error nativo de JS (para que el stack trace funcione)
        expect(errorInstance).toBeInstanceOf(Error);

        // Verificamos que sea reconocido como tu DomainError base
        expect(errorInstance).toBeInstanceOf(DomainError);

        // Verificamos que el mensaje se guardó correctamente
        expect(errorInstance.message).toBe(testMessage);
    });
});