import "reflect-metadata";
import { MessageHandler } from "@infra/external-services/middlewares/MessageHandler";
import { WebHookResponseDTO } from "@app/dtos/response/WebHookResponseDTO";

describe("MessageHandler", () => {
    let messageHandler: MessageHandler;
    let whatsappSendUseCaseMock: any;

    const mockWebHook: WebHookResponseDTO = {
        id: 1,
        url: "https://api.whatsapp.com",
        token: "token123",
        idWhatsapp: "123456",
        accessToken: "access_token_mock",
        urlWhatsapp: "https://api.whatsapp.com",
        version: "v1",
        active: true,
        typeProyectsId: 10,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(() => {
        // 1. Mock de todas las funciones del UseCase
        whatsappSendUseCaseMock = {
            sendMessage: jest.fn(),
            sendInteractiveButtons: jest.fn(),
            sendWhatsAppImage: jest.fn(),
            sendWhatsAppDocument: jest.fn(),
            sendWhatsAppVideo: jest.fn(),
            sendWhatsAppAudio: jest.fn(),
            markAsRead: jest.fn(),
            sendContactMessage: jest.fn(),
            sendLocationMessage: jest.fn(),
            saveWhatsAppImage: jest.fn(),
            saveWhatsAppDocument: jest.fn(),
            saveWhatsAppAudio: jest.fn(),
            saveWhatsAppVideo: jest.fn(),
        };

        // 2. Inyectamos el mock manualmente al constructor
        messageHandler = new MessageHandler(whatsappSendUseCaseMock);
    });

    describe("Send Methods (Boolean results)", () => {
        const sendTestCases = [
            { method: 'sendMessage', args: { messaging_product: "whatsapp", to: "123", text: { body: "hi" } } },
            { method: 'sendInteractiveButtons', args: { type: "button" } },
            { method: 'sendWhatsAppImage', args: { image: { link: "url" } } },
            { method: 'sendWhatsAppDocument', args: { document: { link: "url" } } },
            { method: 'sendWhatsAppVideo', args: { video: { link: "url" } } },
            { method: 'sendWhatsAppAudio', args: { audio: { link: "url" } } },
            { method: 'markAsRead', args: { status: "read", message_id: "id1" } },
            { method: 'sendContactMessage', args: { contacts: [] } },
            { method: 'sendLocationMessage', args: { location: { lat: 0, long: 0 } } },
        ];

        sendTestCases.forEach(({ method, args }) => {
            it(`should delegate ${method} to the use case and return true`, async () => {
                whatsappSendUseCaseMock[method].mockResolvedValue(true);

                const result = await (messageHandler as any)[method](args, mockWebHook);

                expect(whatsappSendUseCaseMock[method]).toHaveBeenCalledWith(args, mockWebHook);
                expect(result).toBe(true);
            });
        });
    });

    describe("Save Methods (String results)", () => {
        const saveTestCases = [
            { method: 'saveWhatsAppImage', args: { image: { id: "1" } } },
            { method: 'saveWhatsAppDocument', args: { document: { id: "2" } } },
            { method: 'saveWhatsAppAudio', args: { audio: { id: "3" } } },
            { method: 'saveWhatsAppVideo', args: { video: { id: "4" } } },
        ];

        saveTestCases.forEach(({ method, args }) => {
            it(`should delegate ${method} to the use case and return the file path`, async () => {
                const expectedPath = "/storage/file.ext";
                whatsappSendUseCaseMock[method].mockResolvedValue(expectedPath);

                const result = await (messageHandler as any)[method](args, mockWebHook);

                expect(whatsappSendUseCaseMock[method]).toHaveBeenCalledWith(args, mockWebHook);
                expect(result).toBe(expectedPath);
            });
        });
    });
});