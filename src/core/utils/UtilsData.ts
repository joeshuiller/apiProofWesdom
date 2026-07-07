import * as fs from "node:fs";
import * as path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { injectable } from "inversify";

const CAMPAIGN_CONFIG = {
    ISSUER_NAME: 'SODIMAC COLOMBIA',
    ISSUER_TAX_ID: '800242106-2',
    MIN_PURCHASE_AMOUNT: 300000,
    VALID_YEAR: 26,
    VALID_MONTHS: { MIN: 3, MAX: 6 }
};
/**
 * Clase de utilidades para el manejo de datos binarios, Base64 y MimeTypes.
 * Se ha removido el modificador 'abstract' para permitir que Inversify
 * pueda instanciarla y vincularla correctamente.
 */
@injectable()
export class UtilsData {
    private readonly rootUploadPath = "public/uploads";
    /**
     * Valida si una cadena tiene un formato Base64 válido.
     */
    public validateBase64(str: string): void {
        const regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
        const cleanStr = str.replace(/^data:image\/\w+;base64,/, "");
        if (!regex.test(cleanStr)) {
            throw new Error("Formato Base64 inválido.");
        }
    }

    /**
     * Convierte una cadena Base64 en un Buffer de Node.js.
     */
    public base64ToBuffer(base64String: string): Buffer {
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
        return Buffer.from(base64Data, "base64");
    }

    /**
     * Detecta el MimeType de un buffer basándose en sus Magic Numbers.
     */
    public detectMimeType(buffer: Buffer): string {
        const signatures: { [key: string]: string } = {
            "89504e47": "image/png",
            "ffd8ffe0": "image/jpeg",
            "ffd8ffe1": "image/jpeg",
            "ffd8ffe2": "image/jpeg",
        };
        const header = buffer.toString("hex", 0, 4);
        return signatures[header] || "image/jpeg";
    }

    /**
     * Limpia y parsea de forma segura una respuesta JSON proveniente de una IA.
     */
    public safeParseJson<T>(text: string): T {
        try {
            const cleanJson = text.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanJson) as T;
        } catch (error) {
            throw new Error(`Error al procesar la respuesta de la IA: JSON inválido.`);
        }
    }

    public async saveImages(base64String: string, targetFolder: string): Promise<string> {
        // 1. Extraer el Mime-Type (ej: "image/png") y los datos puros Base64
        const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error("Formato Base64 inválido o corrupto.");
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const extension = mimeType.split("/")[1]; // ej: "png"

        // 2. Construir las rutas del sistema
        const uploadDirectory = path.join(process.cwd(), this.rootUploadPath, targetFolder);

        // Asegurar que las carpetas existan de forma recursiva
        if (!fs.existsSync(uploadDirectory)) {
            fs.mkdirSync(uploadDirectory, { recursive: true });
        }

        // 3. Generar un identificador único por archivo para evitar colisiones
        const uniqueFileName = `${uuidv4()}.${extension}`;
        const fullPhysicalPath = path.join(uploadDirectory, uniqueFileName);
        const dbRelativePath = `/uploads/${targetFolder}/${uniqueFileName}`;

        // 4. Convertir a binario y escribir en disco
        const imageBuffer = Buffer.from(base64Data, "base64");
        await fs.promises.writeFile(fullPhysicalPath, imageBuffer);

        return dbRelativePath;
    }
}