# API Proof Wesdom

API de integración con WhatsApp, desarrollada en Node.js, Express y TypeORM, con soporte para inteligencia artificial generativa a través de Gemini y WebSockets.

## Instrucciones de ejecución

### Prerrequisitos
- **Node.js** (v18 o superior recomendado)
- **Docker** y **Docker Compose** (para levantar la infraestructura fácilmente)
- Configurar el archivo `.env` basado en las variables del entorno requeridas (ver el `docker-compose.yml` para los valores por defecto).

### Ejecución usando Docker (Recomendado)
El proyecto incluye un entorno preconfigurado con PostgreSQL y pgAdmin.

1. Levantar los servicios (base de datos y API):
   ```bash
   docker-compose up -d
   ```
2. Ejecutar las migraciones de TypeORM para inicializar las tablas:
   ```bash
   docker exec -it api_proof_wesdom npm run migration:run
   ```

### Ejecución Local en modo Desarrollo
Si prefieres ejecutar la API directamente en tu máquina anfitriona (necesitarás tener tu propia base de datos Postgres en funcionamiento o levantar solo el servicio `db` de Docker):

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar la base de datos (por ejemplo, vía Docker):
   ```bash
   docker-compose up -d db
   ```
3. Correr las migraciones:
   ```bash
   npm run migration:run
   ```
4. Iniciar el entorno de desarrollo (con autorecarga y generación de Swagger):
   ```bash
   npm run dev
   ```

### Construcción para Producción
1. Generar el build de producción usando Webpack:
   ```bash
   npm run build
   ```
2. Ejecutar la aplicación compilada:
   ```bash
   npm run start:prod
   ```

## Limitaciones conocidas

- **WebSockets y estado en memoria**: Al utilizar WebSockets (`socket.io`), si se escala la aplicación a múltiples instancias horizontalmente sin usar un adaptador como Redis, se perderá la sincronización de eventos entre diferentes clientes conectados a distintos nodos.
- **Procesamiento Síncrono de Webhooks**: Actualmente, los webhooks que llegan desde WhatsApp podrían estar procesando la respuesta de IA de manera síncrona. En escenarios de alta concurrencia o tiempos de respuesta largos del modelo de IA (Gemini), esto puede bloquear el hilo principal y generar timeouts en la respuesta a la API de WhatsApp, pudiendo causar reintentos innecesarios.
- **Manejo de archivos grandes**: Almacenar o procesar imágenes, PDFs o documentos enviados por WhatsApp localmente en memoria o en disco puede llevar rápidamente a problemas de espacio o `OutOfMemory` bajo tráfico intenso.
- **Limitaciones de cuota (Rate Limiting)**: La aplicación no implementa por defecto mecanismos de rate limiting sofisticados, lo que podría llevar a sobrepasar las cuotas de la API de Meta si un chatbot entra en un bucle o recibe ataques de spam.

## Cómo escalaría esto

Para llevar esta arquitectura a un siguiente nivel capaz de soportar millones de usuarios y alta disponibilidad, se deben implementar las siguientes mejoras:

1. **Arquitectura Orientada a Eventos (Message Brokers)**:
   - Desacoplar la recepción de webhooks del procesamiento. Usar herramientas como **RabbitMQ**, **Apache Kafka** o **Redis Streams**.
   - La API solo debería confirmar la recepción del webhook (HTTP 200) y encolar el evento. Múltiples *workers* asíncronos leerían de la cola, consultarían a la IA y finalmente harían el HTTP request a WhatsApp para responder.
   
2. **Caché y Adaptadores (Redis)**:
   - Utilizar **Redis** para almacenar el estado de las conversaciones, contextos recientes para la IA y límites de tasa (Rate Limiting).
   - Implementar el adaptador de Redis para `socket.io` (`@socket.io/redis-adapter`) para permitir que los WebSockets funcionen correctamente a través de múltiples instancias balanceadas.

3. **Almacenamiento en la Nube (Object Storage)**:
   - Integrar AWS S3, Google Cloud Storage o similares para que todo contenido multimedia entrante o generado se suba inmediatamente a la nube, devolviendo solo URLs públicas (o firmadas) al cliente, evitando sobrecargar el disco local y facilitando la persistencia.

4. **Orquestación de Contenedores y Autoescalado**:
   - Desplegar los servicios en un clúster como **Kubernetes (K8s)** o usar **Google Cloud Run** / **AWS ECS**.
   - Separar el servicio "receptor de Webhooks" del servicio "procesador de IA" para escalar el procesamiento de inteligencia artificial independientemente de la capa de API.

5. **Monitoreo y Observabilidad**:
   - Incorporar APMs (DataDog, New Relic) y sistemas centralizados de logs (ELK Stack, Promtail/Loki) para trazar cada mensaje desde que entra hasta que se envía, permitiendo una rápida identificación de cuellos de botella en la comunicación con APIs de terceros.
