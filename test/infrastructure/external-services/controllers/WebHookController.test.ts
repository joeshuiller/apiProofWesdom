// 1. Mockeamos el contenedor ANTES de importar nada
jest.mock("@infra/di/inversifyConfig", () => ({
    container: {
        get: jest.fn(),
        snapshot: jest.fn(),
        restore: jest.fn()
    }
}));

import { Request, Response, NextFunction } from "express";
import WebHookController from "@infra/external-services/controllers/WebHookController";

describe("WebHookController", () => {
    let controller: WebHookController;

    const mocks = {
        webHookUseCase: { create: jest.fn(), findByIdWhatsapp: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findByToken: jest.fn() },
        loggerUseCase: { info: jest.fn(), error: jest.fn() },
        usersWhatsapp: { findByIdWhatsapp: jest.fn(), create: jest.fn() },
        messagesUseCase: { create: jest.fn() },
        usersWhatsappRelationships: { findByIdWhatsapp: jest.fn(), create: jest.fn() },
        registerUserUseCase: { findAll: jest.fn() },
        campaignsUseCase: { getCampaignById: jest.fn() },
        messageHandler: { saveWhatsAppImage: jest.fn(), markAsRead: jest.fn() }
    };

    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            sendStatus: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
        };
        next = jest.fn();

        controller = new WebHookController(
            mocks.webHookUseCase as any,
            mocks.loggerUseCase as any,
            mocks.usersWhatsapp as any,
            mocks.messagesUseCase as any,
            mocks.usersWhatsappRelationships as any,
            mocks.registerUserUseCase as any,
            mocks.campaignsUseCase as any,
            mocks.messageHandler as any
        );
    });

    describe("handleIncoming (Webhook Core)", () => {

        it("should process a text message successfully", async () => {
            const req = {
                // ✅ Añadimos headers para que getTraceId no explote
                headers: {},
                body: {
                    object: "whatsapp_business_account",
                    entry: [{
                        id: "WHATSAPP_ID",
                        changes: [{
                            field: "messages",
                            value: {
                                messaging_product: "whatsapp",
                                metadata: { phone_number_id: "123", display_phone_number: "12345" },
                                contacts: [{ wa_id: "57300", profile: { name: "User" } }],
                                messages: [{
                                    type: "text",
                                    text: { body: "Hola" },
                                    from: "57300",
                                    id: "wamid.ID_TEST",
                                    timestamp: "1623456"
                                }]
                            }
                        }]
                    }]
                }
            } as any;

            // Mocks necesarios para que el flujo no se detenga
            mocks.webHookUseCase.findByIdWhatsapp.mockResolvedValue({ id: 1, typeProyectsId: 10 });
            mocks.usersWhatsapp.findByIdWhatsapp.mockResolvedValue({ id: 50 });
            mocks.usersWhatsappRelationships.findByIdWhatsapp.mockResolvedValue({ id: 1 });
            mocks.registerUserUseCase.findAll.mockResolvedValue([{ id: 100 }]);
            mocks.campaignsUseCase.getCampaignById.mockResolvedValue({ id: 5 });
            mocks.messagesUseCase.create.mockResolvedValue({ id: 1 });
            mocks.messageHandler.markAsRead.mockResolvedValue(true);

            await controller.handleIncoming(req, res as Response, next);

            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        it("should handle error during message processing without crashing", async () => {
            const req = {
                headers: {}, // ✅ Requerido para getTraceId
                body: {
                    object: "whatsapp_business_account",
                    entry: [{ changes: [{ value: { messages: [{ type: "text", from: "123", text: { body: "err" } }] } }] }]
                }
            } as any;

            mocks.webHookUseCase.findByIdWhatsapp.mockRejectedValue(new Error("Database Down"));

            await controller.handleIncoming(req, res as Response, next);

            expect(res.sendStatus).toHaveBeenCalledWith(200);
            expect(mocks.loggerUseCase.error).toHaveBeenCalled();
        });
    });

    describe("CRUD Methods", () => {
        it("should create webhook with 201", async () => {
            // ✅ También aquí, si el método create usa getTraceId internamente
            const req = {
                headers: {},
                body: { url: "http://webhook.url", typeProyectsId: 1 }
            } as any;

            mocks.webHookUseCase.create.mockResolvedValue({ id: 1 });

            await controller.create(req, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });
});