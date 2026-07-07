import { RoleAlreadyExists } from '../../../src/core/errors/type/RoleAlreadyExists'; // Ajusta la ruta a tu archivo real
import { DomainError } from '../../../src/core/errors/DomainError';

describe('RoleAlreadyExists', () => {
    it('debería crear la instancia con el mensaje de error formateado correctamente', () => {
        // Arrange
        const testRole = 'ADMIN';
        const expectedMessage = `El rol ${testRole} ya existe en el sistema.`;

        // Act
        const errorInstance = new RoleAlreadyExists(testRole);

        // Assert
        expect(errorInstance.message).toBe(expectedMessage);
        expect(errorInstance).toBeInstanceOf(RoleAlreadyExists);
        expect(errorInstance).toBeInstanceOf(DomainError);
        expect(errorInstance).toBeInstanceOf(Error);
    });
});