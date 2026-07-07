/**
 * Utility class for converting and validating string representations of dates into native Date objects.
 */
export class DateConverter {

    /**
     * Convierte un string en formato ISO 8601 (ej. "2026-06-13T15:00:00Z" o "2026-06-13") a Date.
     * Lanza un error o retorna null si el formato no es válido.
     * * @param dateStr Cadena de texto que representa la fecha.
     * @returns Objeto Date o null si es inválida.
     */
    public fromISO(dateStr: string): Date | null {
        if (!dateStr) return null;

        const date = new Date(dateStr);

        // El constructor de JS retorna "Invalid Date" (un Date cuyo getTime() es NaN) si el string no es parseable.
        if (isNaN(date.getTime())) {
            return null;
        }

        return date;
    }

    /**
     * Convierte una fecha en formato latino común "DD/MM/YYYY" o "DD-MM-YYYY" a un objeto Date.
     * Muy útil para inputs manuales del usuario.
     * * @param dateStr Cadena con formato "DD/MM/YYYY" o "DD-MM-YYYY".
     * @param timeStr Opcional: Cadena de tiempo "HH:mm:ss" (ej: "18:30:00").
     * @returns Objeto Date o null si la fecha es inválida.
     */
    public fromLatinFormat(dateStr: string, timeStr: string = '00:00:00'): Date | null {
        if (!dateStr) return null;

        // Limpiar y separar componentes
        const cleanDate = dateStr.replace(/-/g, '/');
        const parts = cleanDate.split('/');

        if (parts.length !== 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // En JS los meses van de 0 a 11
        const year = parseInt(parts[2], 10);

        const timeParts = timeStr.split(':');
        const hours = timeParts[0] ? parseInt(timeParts[0], 10) : 0;
        const minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
        const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

        // Construir la fecha localmente
        const date = new Date(year, month, day, hours, minutes, seconds);

        // Validar desbordamientos de días (ej. 31 de Febrero se convierte automáticamente a Marzo si no se controla)
        if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
            return null;
        }

        return date;
    }

    /**
     * Convierte un timestamp o ISO String a Date (Con blindaje de tipos)
     */
    public fromTimestamp(timestamp: any): Date {
        // RADAR DE DIAGNÓSTICO: Esto imprimirá en la consola de PM2 exactamente qué está entrando
        console.log("🕵️‍♂️ [DEBUG FROM-TIMESTAMP] Entrada real:", {
            valor: timestamp,
            tipo: typeof timestamp,
            esInstanciaDate: timestamp instanceof Date
        });

        // 1. Si TypeORM o MySQL ya lo convirtieron en un objeto Date en secreto, lo devolvemos intacto.
        if (timestamp instanceof Date) {
            return timestamp;
        }

        // 2. Forzamos a que todo sea texto para evitar trampas de tipos (ej. objetos envoltorio)
        const strVal = String(timestamp);

        // 3. Si tiene guiones, barras o la letra 'T', es inequívocamente una fecha legible
        if (strVal.includes('-') || strVal.includes('T') || strVal.includes('/')) {
            return new Date(strVal);
        }

        // 4. Si llegamos aquí, asumimos que es un Timestamp Unix puro (solo números)
        const ts = Number(timestamp);

        if (isNaN(ts)) {
            throw new Error(`[Seguridad] El valor no pudo ser parseado como fecha o timestamp: ${strVal}`);
        }

        // 5. Detectar segundos (10 dígitos) vs milisegundos (13 dígitos)
        const isSeconds = ts.toString().length === 10;
        return new Date(isSeconds ? ts * 1000 : ts);
    }

    /**
     * Verifica si un objeto Date es válido y no corresponde a un "Invalid Date".
     */
    public isValid(date: any): boolean {
        return date instanceof Date && !isNaN(date.getTime());
    }
}