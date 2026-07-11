# Registro de Decisiones de Arquitectura (ADRs)

En este documento se registran las decisiones clave de implementación adoptadas durante el desarrollo de la API de integración con WhatsApp.

---

## ADR 001: Adopción de Arquitectura Limpia (Clean Architecture / Hexagonal)

**Fecha:** Julio 2026  
**Estado:** Aceptado

### Contexto
La API necesita interactuar con servicios externos (WhatsApp Meta API, Google Gemini, Bases de datos relacionales PostgreSQL) y proveer interfaces de entrada (Webhooks, WebSockets). Mezclar la lógica de negocio con la lógica de enrutamiento HTTP o las librerías de infraestructura llevaría a un código difícil de mantener, acoplado y frágil ante cambios de proveedores.

### Decisión
Se decidió implementar una Arquitectura Limpia / Hexagonal, separando el código en tres capas principales:
- **Domain (Dominio)**: Entidades puras y definiciones de interfaces (repositorios) sin dependencias externas.
- **Application (Casos de Uso)**: Lógica de orquestación de la aplicación, que utiliza las interfaces del dominio.
- **Infrastructure (Infraestructura)**: Implementaciones concretas de la base de datos (TypeORM), controladores HTTP (Express), WebSockets (Socket.io) y llamadas a servicios de terceros.

### Justificación y Consecuencias
- **Desacoplamiento**: Permite cambiar la base de datos o el proveedor de mensajería en el futuro sin modificar el dominio central ni los casos de uso.
- **Testabilidad**: Es mucho más fácil escribir pruebas unitarias para los casos de uso aislando las dependencias a través de mocks.
- **Consecuencia**: Añade una capa de complejidad inicial (boilerplate) para mapear DTOs y organizar los archivos, pero beneficia enormemente el mantenimiento a largo plazo.

---

## ADR 002: Uso de PostgreSQL y TypeORM para Persistencia Relacional

**Fecha:** Julio 2026  
**Estado:** Aceptado

### Contexto
El sistema necesita almacenar registros de campañas, proyecciones, relacionar usuarios, administrar menús y almacenar trazas de mensajes entrantes/salientes de WhatsApp. Estos datos tienen relaciones estructuradas (ej. un usuario pertenece a un tipo de proyecto, tiene roles, etc.).

### Decisión
Se eligió **PostgreSQL** como motor de base de datos relacional y **TypeORM** como el ORM (Object-Relational Mapper) en la capa de infraestructura.

### Justificación y Consecuencias
- **Integridad Referencial**: Postgres garantiza la integridad transaccional requerida para el manejo de campañas y usuarios.
- **Ecosistema TypeScript**: TypeORM utiliza decoradores que se integran a la perfección con clases TypeScript, acelerando el desarrollo y manteniendo el tipado estricto.
- **Mantenibilidad**: TypeORM provee un excelente sistema de migraciones que versiona la estructura de la base de datos, lo cual es crítico al desplegar en contenedores Docker y flujos de CI/CD.
- **Consecuencia**: Se requiere cuidado al diseñar relaciones pesadas (Eager vs Lazy loading) para evitar consultas N+1 que degraden el rendimiento bajo carga.

---

## Nota sobre el uso de Inteligencia Artificial

### ¿Qué se usó para la IA?
Se optó por el SDK oficial `@google/generative-ai` para interactuar con los modelos fundacionales de Google (Gemini).

### ¿En qué parte del proceso se utilizó?
La IA se integró en la capa de aplicación, específicamente en los casos de uso encargados de procesar la entrada de los usuarios. Actúa como el "cerebro" del chatbot:
1. Recibe el texto extraído del Webhook de WhatsApp.
2. Analiza la intención del usuario basándose en instrucciones del sistema predefinidas (system prompts).
3. Estructura una respuesta en texto enriquecido o decide qué acción en el sistema debe invocarse.

### ¿Cómo se validó que la salida era correcta?
1. **Pruebas Unitarias (Jest)**: Se mockearon (simularon) las respuestas del SDK de Gemini para validar que la capa de Casos de Uso paraseara correctamente la estructura esperada, asegurando el comportamiento esperado frente a salidas en formato JSON, textos planos y casos de error (timeouts o filtros de seguridad).
2. **Validación de Estructura**: Para cualquier salida de la IA que el sistema deba usar de forma programática (clasificación de intents), se usan esquemas fuertes (e.g. Zod o Class-Validator) para verificar que el JSON devuelto por la IA cumpla estrictamente con la estructura esperada antes de procesarlo. Si la validación falla, el sistema provee una respuesta de "fallback" estándar y registra el error.
3. **Pruebas Manuales E2E**: Se realizaron flujos de conversación reales conectando un número de prueba en WhatsApp (vía Meta for Developers) para probar el tono, la latencia real de la API de Gemini, y el manejo correcto de carácteres especiales y emojis generados por la IA en la ventana de chat.
