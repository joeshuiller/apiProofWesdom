# Diagrama de Contexto - apiProofWesdom

Este documento presenta el **Diagrama de Contexto de Sistema (C4 Model - Nivel 1)** y el **Diagrama de Contenedores (C4 Model - Nivel 2)** para el proyecto **apiProofWesdom**, permitiendo visualizar los límites del sistema, sus actores principales, dependencias y la organización interna de su arquitectura de software.

---

## 1. Contexto del Sistema (Nivel 1)

El diagrama de contexto muestra cómo la API interactúa con usuarios, interfaces de usuario y servicios externos.

```mermaid
graph TB
    User["Cliente Frontend - Usuario Final"]
    Admin["Administrador - Desarrollador"]

    subgraph SystemBoundary ["Límites del Sistema"]
        API["API Proof Wesdom - Express y WebSockets"]
    end

    DB[("Base de Datos - PostgreSQL 15")]
    pgAdmin["pgAdmin 4 - Monitoreo BD"]

    User --> API
    Admin --> API
    Admin --> pgAdmin
    pgAdmin --> DB
    API --> DB
    
    classDef actor fill:#08427B,stroke:#052E56,color:#fff,stroke-width:2px;
    classDef system fill:#1168BD,stroke:#0B4D8C,color:#fff,stroke-width:2px;
    classDef external fill:#999999,stroke:#666666,color:#fff,stroke-width:2px;
    
    class User,Admin actor;
    class API system;
    class DB,pgAdmin external;
```

### Descripción de los Elementos

| Elemento | Tipo | Descripción |
| :--- | :--- | :--- |
| **Cliente Frontend** | Actor | Aplicación cliente (por ejemplo, web en Angular en puerto 4200 o móvil) que interactúa con la API para gestionar billeteras, ver el historial y realizar transacciones en tiempo real. |
| **Administrador / Desarrollador** | Actor | Personal técnico que administra la plataforma, monitorea la base de datos mediante pgAdmin y consulta/prueba la documentación interactiva a través de Swagger. |
| **API Proof Wesdom** | Sistema | El núcleo del backend. Expone servicios HTTP/REST y conexiones WebSocket para procesar la lógica de negocio, transacciones, autenticación y seguridad. |
| **Base de Datos (PostgreSQL)** | Sistema Externo | Motor de base de datos relacional que almacena las entidades persistidas (Usuarios, Roles, Wallets e Historial de transacciones). |
| **pgAdmin 4** | Sistema Externo | Interfaz web para la administración y visualización de la base de datos PostgreSQL. |

---

## 2. Diagrama de Contenedores y Arquitectura Limpia (Nivel 2)

El proyecto está diseñado bajo los principios de **DDD (Domain-Driven Design)** y **Arquitectura Limpia (Clean Architecture)**. Las dependencias se resuelven mediante el contenedor de Inversión de Control (IoC) de **InversifyJS**.

```mermaid
graph TD
    subgraph Cliente ["Capa Cliente"]
        WebClient["App Web / Movil (Port 4200)"]
    end

    subgraph Infrastructure ["Capa de Infraestructura"]
        Server["ExpressServer - HTTP y WebSockets"]
        Routes["Routes.ts - Enrutador de la API"]
        Controllers["Controllers HTTP y Sockets"]
        DBRepo["Repositories - TypeORM Postgres"]
        DI["inversifyConfig - IoC Container"]
    end

    subgraph Application ["Capa de Aplicacion"]
        UseCases["Casos de Uso - Logica de Negocio"]
        DTOs["DTOs de Peticion y Respuesta"]
    end

    subgraph Domain ["Capa de Dominio"]
        Entities["Entidades del Dominio"]
        RepoInterfaces["Interfaces de Repositorio"]
    end

    subgraph Core ["Capa Core / Helpers"]
        Utils["Utilidades y Seguridad"]
    end

    WebClient --> Server
    Server --> Routes
    Routes --> Controllers
    Controllers --> UseCases
    UseCases --> RepoInterfaces
    DBRepo -.-> RepoInterfaces
    DBRepo --> Entities
    UseCases --> DTOs
    UseCases --> Entities
    
    DI -.-> Controllers
    DI -.-> UseCases
    DI -.-> DBRepo

    classDef infra fill:#2B82C9,stroke:#1A5F99,color:#fff;
    classDef app fill:#4CAE4C,stroke:#398439,color:#fff;
    classDef domain fill:#F0AD4E,stroke:#D9534F,color:#fff;
    classDef core fill:#5BC0DE,stroke:#269ABC,color:#fff;

    class Server,Routes,Controllers,DBRepo,DI infra;
    class UseCases,DTOs app;
    class Entities,RepoInterfaces domain;
    class Utils core;
```

### Organización del Código por Capas

1. **Capa de Dominio (`src/domain`)**:
   - **Entidades (`entities/`)**: Modelan los conceptos fundamentales de negocio (ej. [UsersEntity.ts](file:///Users/softsaenz/Documents/pruebas/apiProofWesdom/src/domain/entities/UsersEntity.ts), [WalletEntity.ts](file:///Users/softsaenz/Documents/pruebas/apiProofWesdom/src/domain/entities/WalletEntity.ts)).
   - **Interfaces de Repositorio (`repositories/`)**: Contratos que aíslan el negocio de la tecnología de persistencia (ej. [IUserRepository.ts](file:///Users/softsaenz/Documents/pruebas/apiProofWesdom/src/domain/repositories/IUserRepository.ts)).
2. **Capa de Aplicación (`src/application`)**:
   - **Casos de Uso (`use-cases/`)**: Implementan el flujo de negocio y casos de uso específicos (ej. [WalletUseCase.ts](file:///Users/softsaenz/Documents/pruebas/apiProofWesdom/src/application/use-cases/WalletUseCase.ts)).
   - **DTOs (`dtos/`)**: Objetos planos para estructurar los datos entrantes y salientes de la API.
3. **Capa de Infraestructura (`src/infrastructure`)**:
   - **Servidor y Configuración (`config/`)**: Inicializa Express, carga certificados SSL y levanta el servidor (ej. [ExpressServer.ts](file:///Users/softsaenz/Documents/pruebas/apiProofWesdom/src/infrastructure/config/ExpressServer.ts)).
   - **Inversión de Control (`di/`)**: Módulo InversifyJS que asocia las interfaces de dominio con sus implementaciones de infraestructura (ej. [inversifyConfig.ts](file:///Users/softsaenz/Documents/pruebas/apiProofWesdom/src/infrastructure/di/inversifyConfig.ts)).
   - **Base de Datos (`database/`)**: Data Source y migraciones de TypeORM.
   - **Controladores y Rutas (`https/`)**: Manejadores HTTP y Sockets que reciben las llamadas de red y devuelven respuestas formateadas.
4. **Capa Core/Shared (`src/core`, `src/shared`)**:
   - Funciones utilitarias transversales de encriptación (RSA/AES), hashing de contraseñas (Argon2) y formateadores.
