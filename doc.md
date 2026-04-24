Aqui está a documentação técnica completa e integral, sem resumos, com todas as seções e códigos originais, incorporando as atualizações solicitadas (Markdown, campos de observação/documentação nos eventos, banco de dados em memória no desenvolvimento e testes integrados).

---

# Sistema de Indicadores AD — Documentação Técnica v3.0

| Atributo           | Detalhe                                                       |
| :----------------- | :------------------------------------------------------------ |
| **Versão**         | 3.0 — Especificação completa: fórmulas, dashboard, auditoria, Zod, CI/CD |
| **Data**           | 19/04/2026                                                    |
| **Aplicável a**    | Equipes de Atenção Domiciliar (AD/ID)                         |
| **Autenticação**   | Google OAuth 2.0 via Google Workspace                         |
| **Backend**        | Node.js + TypeScript (+ Python opcional)                      |
| **Frontend**       | React PWA — funciona offline no celular                       |
| **Cache**          | Service Worker + IndexedDB no dispositivo                     |
| **Banco de dados** | PostgreSQL 15 (Produção) / SQLite In-memory (Dev/Test)        |
| **Status**         | Rascunho — Aprovação da Equipe Técnica                        |

---

## 1. Visão Geral e Decisões Técnicas

Esta versão da documentação consolida as decisões técnicas definitivas do projeto. As seções abaixo refletem escolhas que impactam toda a arquitetura e devem ser seguidas durante o desenvolvimento.

**Decisões técnicas confirmadas nesta versão:**

- Autenticação via Google OAuth 2.0 restrito ao Google Workspace da organização.
- Sem Redis — cache implementado no dispositivo do usuário (Service Worker + IndexedDB).
- PWA (Progressive Web App) — instalável no celular, funciona offline.
- Backend: Node.js + TypeScript como linguagem principal; Python como serviço auxiliar.
- Sem soluções low-code — toda a stack é desenvolvida sob medida.
- Logging obrigatório de todas as requisições da API (rota, método, body, tempo, usuário).
- Módulo de pacientes: cadastro por nome (extensível) vinculado a registros e alterações.

### 1.1 Problema Atual

- Planilha Excel exige preenchimento centralizado por um único responsável.
- Sem histórico de alterações, sem identificação de quem editou cada campo.
- Inacessível pelo celular sem sincronização manual.
- Impossível vincular registros de indicadores a pacientes individuais.
- Sem alertas automáticos quando métricas críticas se deterioram.

### 1.2 Escopo — MVP e Fases

| Funcionalidade            | Descrição                                                    | Prioridade |
| :------------------------ | :----------------------------------------------------------- | :--------- |
| **Dashboard**             | Gráficos, KPIs e semáforos atualizados em tempo real         | MVP        |
| **Registro mensal**       | Formulário com os 9 blocos de indicadores                    | MVP        |
| **Autenticação Google**   | Login via conta do Google Workspace da organização           | MVP        |
| **PWA + Offline**         | Instalável no celular, funciona sem internet                 | MVP        |
| **Logging da API**        | Registro de todas as chamadas com método, rota, body e tempo | MVP        |
| **Cadastro de pacientes** | Nome e dados básicos, vinculados a registros e edições       | MVP        |
| **Metas e semáforos**     | Definição de metas por indicador com alerta visual           | MVP        |
| **Auditoria**             | Histórico: quem editou, o quê, quando e de qual dispositivo  | MVP        |
| **Exportação XLSX/PDF**   | Geração do arquivo idêntico à planilha original              | MVP        |
| **Alertas por e-mail**    | Notificação automática ao gestor via Gmail API               | Fase 2     |
| **Análise com Python**    | Serviço Python para calcular tendências e anomalias          | Fase 2     |
| **App nativo (opcional)** | React Native se PWA não suprir as necessidades do time       | Fase 3     |

---

## 2. Arquitetura da Solução

### 2.1 Diagrama de Camadas

**Visão geral da arquitetura — 4 camadas**

- **CAMADA 1 — CLIENTE PWA (Navegador / Celular instalado)**
  - React 18 + TypeScript + Vite + Tailwind CSS
  - Service Worker (cache offline) + IndexedDB (dados locais)
  - Google Sign-In SDK (OAuth 2.0)
- **CAMADA 2 — API REST (Backend principal)**
  - Node.js 20 + TypeScript + Express ou Fastify
  - Google OAuth 2.0 validation (google-auth-library)
  - Middleware de logging (rota + método + body + tempo + usuário)
  - Controladores: pacientes, registros, metas, usuários, exportação
- **CAMADA 3 — SERVIÇOS AUXILIARES (Opcional — Fase 2)**
  - Python 3.12 + FastAPI --> análise estatística, tendências, anomalias
  - Comunicação com Node via HTTP interno (localhost)
- **CAMADA 4 — DADOS**
  - PostgreSQL 15 — dado principal (Produção)
  - SQLite In-memory — testes e desenvolvimento
  - IndexedDB no dispositivo — cache/offline
  - Google Drive API (Fase 2) — backup automático de exportações

### 2.2 Fluxo de Autenticação (Google Workspace)

1. O usuário acessa o app e clica em "Entrar com o Google".
2. O SDK do Google abre o popup de autenticação OAuth 2.0.
3. O Google autentica e retorna um ID Token (JWT assinado pelo Google).
4. O front-end envia o ID Token para a API: `POST /api/auth/google`.
5. A API valida o token via `google-auth-library`, confirma que o e-mail pertence ao domínio da organização (ex: @suaorg.com.br) e verifica se o usuário existe no banco.
6. Se válido, a API cria uma sessão interna e retorna um token de sessão próprio com as permissões (perfil: admin, editor ou visualizador).
7. O token de sessão fica no IndexedDB do dispositivo — nunca em localStorage.
8. Todas as requisições subsequentes enviam o token no header `Authorization`.

> **Importante:** o sistema NÃO usa senha própria. O controle de quem pode acessar é feito em dois lugares: (1) o usuário precisa ter conta ativa no Google Workspace da organização e (2) o administrador precisa ter cadastrado esse e-mail no sistema com um perfil. Um e-mail do Workspace que não foi cadastrado no sistema recebe erro 403.

### 2.3 Stack Tecnológica Definitiva

| Componente                  | Escolha                                       |
| :-------------------------- | :-------------------------------------------- |
| **Front-end framework**     | React 18 + TypeScript + Vite                  |
| **Estilização**             | Tailwind CSS 3                                |
| **Gráficos**                | Recharts                                      |
| **Formulários**             | React Hook Form + Zod (validação)             |
| **Estado global**           | Zustand ou React Context                      |
| **PWA / Offline**           | Workbox (via vite-plugin-pwa)                 |
| **Cache no dispositivo**    | IndexedDB via idb (wrapper leve)              |
| **Autenticação (cliente)**  | Google Identity Services SDK                  |
| **HTTP Client**             | Axios com interceptor de token                |
| **Backend principal**       | Node.js 20 LTS + TypeScript + Express         |
| **Validação no backend**    | Zod (reutilizado do front-end)                |
| **ORM / Query builder**     | Drizzle ORM ou Kysely (type-safe)             |
| **Autenticação (servidor)** | google-auth-library (validar ID Token)        |
| **Geração de XLSX**         | ExcelJS                                       |
| **Geração de PDF**          | Puppeteer (headless Chrome)                   |
| **Logging HTTP**            | Morgan + Winston (estruturado em JSON)        |
| **Serviço Python (Fase 2)** | Python 3.12 + FastAPI + pandas + scikit-learn |
| **Banco de dados (Prod)**   | PostgreSQL 15                                 |
| **Banco de dados (Dev)**    | SQLite (In-memory)                            |
| **Migrations**              | node-pg-migrate ou Drizzle Kit                |
| **Testes**                  | Vitest (front) + Jest + Supertest (back)      |
| **Deploy**                  | Render, Railway ou servidor próprio           |
| **CI/CD**                   | GitHub Actions                                |

---

## 3. Autenticação via Google Workspace

### 3.1 Pré-requisitos no Google Cloud Console

1. Criar um projeto no Google Cloud Console (`console.cloud.google.com`).
2. Ativar a API: Google Identity (OAuth 2.0).
3. Em "Credenciais", criar um OAuth 2.0 Client ID do tipo "Web Application".
4. Adicionar as URIs de redirecionamento autorizadas: `http://localhost:5173` (dev) e `https://seudominio.com.br` (produção).
5. Anotar o Client ID gerado — vai para a variável `GOOGLE_CLIENT_ID` no `.env`.
6. Em "Tela de consentimento OAuth", configurar como "Interno" (somente usuários do Workspace da organização).

> Ao configurar a tela de consentimento como "Interno", apenas contas do Google Workspace da organização conseguem autenticar. Contas Gmail pessoais são bloqueadas automaticamente pelo Google, sem necessidade de validação adicional no código.

### 3.2 Configuração no Front-end

```tsx
// src/components/LoginButton.tsx
import { useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "../stores/authStore";

export function LoginButton() {
  const setSession = useAuthStore((s) => s.setSession);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // Envia o código de autorização para a API validar
      const res = await api.post("/auth/google", {
        code: tokenResponse.code,
      });
      // Guarda o token de sessão no IndexedDB
      await idb.set("session", res.data.sessionToken);
      setSession(res.data);
    },
    flow: "auth-code",
  });

  return <button onClick={() => login()}>Entrar com Google</button>;
}
```

### 3.3 Validação no Back-end

```typescript
// src/controllers/auth.controller.ts
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(req: Request, res: Response) {
  const { idToken } = req.body;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload()!;
  const email   = payload.email!;
  [cite_start]const domain  = email.split('@')[1];

  // Garante que o e-mail pertence ao dominio do Workspace
  if (domain !== process.env.ALLOWED_DOMAIN) {
    return res.status(403).json({ error: 'Dominio nao autorizado' });
  }

  // Busca o usuario no banco (deve ter sido pre-cadastrado pelo admin)
  const usuario = await db.query.usuarios.findFirst({
    where: eq(usuarios.email, email) && eq(usuarios.ativo, true)
  });

  if (!usuario) {
    return res.status(403).json({ error: 'Usuario nao encontrado no sistema' });
  }

  // Gera token de sessao interno
  const sessionToken = jwt.sign(
    { userId: usuario.id, perfil: usuario.perfil, email },
    process.env.SESSION_SECRET!,
    { expiresIn: '10h' },
  );

  await logger.info({ action: 'login', email, ip: req.ip });
  return res.json({ sessionToken, perfil: usuario.perfil, nome: usuario.nome });
}
```

---

## 4. Progressive Web App (PWA)

O aplicativo será distribuído como PWA: funciona no navegador como qualquer site, mas pode ser instalado na tela inicial do celular como um app nativo. Quando não houver internet, o usuário consegue consultar os dados já carregados e rascunhar novos registros — que são sincronizados automaticamente ao reconectar.

### 4.1 O que o usuário ganha com o PWA

- Instalação direta: Chrome/Safari exibem um botão "Instalar" ou "Adicionar à tela inicial" — sem App Store.
- Ícone na tela inicial com aparência de app nativo (sem barra de navegação do browser).
- Funcionamento offline: dashboard e último mês de dados ficam disponíveis sem internet.
- Sincronização em segundo plano: dados rascunhados offline são enviados quando a conexão volta.
- Notificações push (Fase 2): alertas de metas diretamente no celular.

### 4.2 Configuração do Vite + Workbox

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Indicadores AD",
        short_name: "Indicadores",
        description: "Sistema de indicadores de Atenção Domiciliar",
        theme_color: "#1A3A5C",
        background_color: "#FFFFFF",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Cache das paginas e assets do app
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            // Cache das chamadas de API (leitura) por 24h
            urlPattern: /^\/api\/(registros|pacientes|metas)/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-cache",
              expiration: { maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],
});
```

### 4.3 Cache Local com IndexedDB

O IndexedDB substitui completamente o Redis no lado do cliente. É um banco de dados embutido no navegador, persistente entre sessões e com capacidade de dezenas de MB — mais que suficiente para os dados de indicadores.

```typescript
// src/lib/db.ts — wrapper simples com a biblioteca 'idb'
import { openDB } from "idb";

const DB_NAME = "indicadores-ad";
const DB_VERSION = 1;

export const localDb = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Sessao do usuario
    db.createObjectStore("session");

    // Cache de registros mensais (chave: 'AAAA-MM')
    db.createObjectStore("registros", { keyPath: "chave" });

    // Rascunhos nao sincronizados (aguardando internet)
    db.createObjectStore("pendentes", { keyPath: "id", autoIncrement: true });

    // Cache de pacientes
    db.createObjectStore("pacientes", { keyPath: "id" });
  },
});

// Exemplo de uso
const db = await localDb;
await db.put("registros", dados, "2025-03"); // salvar
const mes = await db.get("registros", "2025-03"); // ler
```

### 4.4 Sincronização Offline (Background Sync)

```typescript
// Service Worker: sincroniza rascunhos quando a internet volta
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pendentes") {
    event.waitUntil(sincronizarPendentes());
  }
});

async function sincronizarPendentes() {
  const db = await openDB("indicadores-ad", 1);
  const pendentes = await db.getAll("pendentes");

  for (const item of pendentes) {
    try {
      await fetch("/api/registros", {
        method: item.method,
        body: JSON.stringify(item.body),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${item.token}`,
        },
      });
      await db.delete("pendentes", item.id);
    } catch {
      // Falhou de novo — tenta na proxima conexao
    }
  }
}
```

---

## 5. Sistema de Logging da API

Cada requisição recebida pela API deve ser registrada com as informações abaixo. O logging é obrigatório em todas as rotas, incluindo as que retornam erro. Serve tanto para depuração quanto para auditoria de uso.

### 5.1 O que cada log deve conter

| Campo             | Descrição                                                                  |
| :---------------- | :------------------------------------------------------------------------- |
| **timestamp**     | Data e hora exata em ISO 8601 com timezone                                 |
| **request_id**    | UUID único gerado para cada requisição                                     |
| **method**        | Verbo HTTP: GET, POST, PUT, DELETE                                         |
| **route**         | Caminho da rota com parâmetro normalizado (ex: `/api/registros/:ano/:mes`) |
| **url**           | URL completa recebida (ex: `/api/registros/2025/03`)                       |
| **status_code**   | Código HTTP da resposta                                                    |
| **duration_ms**   | Tempo de processamento em milissegundos                                    |
| **usuario_id**    | UUID do usuário autenticado                                                |
| **usuario_email** | E-mail do usuário autenticado                                              |
| **ip**            | IP de origem da requisição                                                 |
| **user_agent**    | Identificador do navegador/dispositivo                                     |
| **body**          | Corpo da requisição (campos sensíveis omitidos)                            |
| **query_params**  | Parâmetros de query string                                                 |
| **error**         | Mensagem de erro (apenas quando status >= 400)                             |
| **stack**         | Stack trace completo (apenas dev)                                          |

### 5.2 Implementação do Middleware de Logging

```typescript
// src/middleware/logger.middleware.ts
import { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import { logger } from "../lib/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = uuid();
  const startedAt = Date.now();

  // Injeta o ID na requisicao para usar em outros middlewares
  req.requestId = requestId;

  // Sanitiza o body antes de logar (remove campos sensiveis)
  const safeBody = sanitizeBody(req.body);

  // Executa o handler e captura a resposta ao finalizar
  res.on("finish", () => {
    const log = {
      timestamp: new Date().toISOString(),
      request_id: requestId,
      method: req.method,
      route: req.route?.path ?? req.path,
      url: req.originalUrl,
      status_code: res.statusCode,
      duration_ms: Date.now() - startedAt,
      usuario_id: req.user?.id ?? null,
      usuario_email: req.user?.email ?? null,
      ip: req.ip,
      user_agent: req.headers["user-agent"],
      body: safeBody,
      query_params: req.query,
    };

    if (res.statusCode >= 500) logger.error(log);
    else if (res.statusCode >= 400) logger.warn(log);
    else logger.info(log);
  });

  next();
}

// Remove campos que nao devem aparecer nos logs
function sanitizeBody(body: Record<string, unknown>) {
  const OMIT = ["senha", "password", "token", "secret"];
  const safe = { ...body };
  OMIT.forEach((k) => {
    if (k in safe) safe[k] = "[OMITIDO]";
  });
  return safe;
}
```

### 5.3 Configuração do Winston (logger estruturado)

```typescript
// src/lib/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(), // Saida em JSON — facil de indexar
  ),
  transports: [
    // Arquivo separado por nivel
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    // Console no desenvolvimento
    ...(process.env.NODE_ENV !== "production"
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
        ]
      : []),
  ],
});
```

### 5.4 Exemplo de Log em Produção (JSON)

```json
{
  "timestamp": "2025-03-15T14:32:01.842-03:00",
  "level": "info",
  "request_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "method": "PUT",
  "route": "/api/registros/:ano/:mes",
  "url": "/api/registros/2025/03",
  "status_code": 200,
  "duration_ms": 47,
  "usuario_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "usuario_email": "enfermeira@suaorg.com.br",
  "ip": "192.168.1.45",
  "body": {
    "taxa_altas_pct": 22.5,
    "obitos_total": 1,
    "paciente_id": "7d793037-a076-4bf0-a2b5-f9c2a8bcc0d8"
  }
}
```

---

## 6. Módulo de Pacientes

O sistema contempla um cadastro básico de pacientes vinculado aos registros de indicadores. O objetivo inicial é rastrear mudanças — quais eventos adversos, intercorrências ou óbitos estão associados a quais pacientes. O modelo é expansível conforme as necessidades da equipe.

### 6.1 O que o módulo permite no MVP

- Cadastrar pacientes com nome (obrigatório) e campos opcionais.
- Vincular um evento (intercorrência, óbito, evento adverso, internação) a um paciente.
- **Adicionar documentação e observação em texto detalhada no registro de cada evento.**
- Visualizar no histórico do paciente todos os eventos registrados.
- Buscar pacientes por nome no momento de registrar um evento.
- Associar múltiplos eventos ao mesmo paciente no mesmo mês.

### 6.2 Modelo de Dados — Tabela de Pacientes

```sql
CREATE TABLE pacientes (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            VARCHAR(200) NOT NULL,
  data_nascimento DATE,                          -- opcional
  codigo_interno  VARCHAR(50),                   -- codigo do prontuario, se houver
  modalidade      VARCHAR(10) CHECK (modalidade IN ('AD','ID','AD2','AD3')),
  ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
  observacoes     TEXT,
  criado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  criado_por      UUID REFERENCES usuarios(id),
  atualizado_em   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_pacientes_nome ON pacientes USING gin(to_tsvector('portuguese', nome));
```

### 6.3 Tabela de Eventos (vínculo paciente ↔ indicador)

```sql
-- Cada linha = um evento clinico vinculado a um paciente e a um registro mensal
CREATE TABLE eventos_pacientes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id       UUID        NOT NULL REFERENCES pacientes(id),
  registro_id       UUID        REFERENCES registros_mensais(id),
  ano               SMALLINT    NOT NULL,
  mes               SMALLINT    NOT NULL CHECK (mes BETWEEN 1 AND 12),

  tipo_evento       VARCHAR(30) NOT NULL,
  -- Valores possiveis: 'alta_domiciliar' | 'intercorrencia' | 'internacao' | 'obito' | 'evento_adverso' | 'infeccao' | 'alteracao_pad'

  subtipo           VARCHAR(50),
  -- Exemplos por tipo:
  -- internacao      -> 'deterioracao_clinica' | 'nao_aderencia'
  -- obito           -> 'menos_48h' | 'mais_48h'
  -- evento_adverso  -> 'queda' | 'broncoaspiracao' | 'lesao_pressao' | 'decanulacao' | 'saida_gtt'

  data_evento       DATE,

  -- Novos campos para detalhamento e anexos:
  observacao_texto  TEXT,          -- narrativa livre, observações detalhadas
  documentacao_url  VARCHAR(500),  -- documentacao agregada (link/referencia)

  descricao         TEXT,          -- descricao breve original
  registrado_por    UUID REFERENCES usuarios(id),
  registrado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ev_paciente ON eventos_pacientes(paciente_id);
CREATE INDEX idx_ev_mes      ON eventos_pacientes(ano, mes);
CREATE INDEX idx_ev_tipo     ON eventos_pacientes(tipo_evento);
```

### 6.4 Fluxo de Uso — Registro com Paciente

1. O registro de indicadores do mês continua funcionando como antes (preenchimento de totais numéricos).
2. O vínculo com pacientes é opcional e ocorre em paralelo.
3. Ao registrar, por exemplo, "1 óbito" no bloco 04, o profissional pode opcionalmente clicar em "Vincular paciente".
4. Um campo de busca por nome aparece — ele digita o nome e seleciona o paciente da lista.
5. O sistema registra o evento na tabela `eventos_pacientes` com tipo 'obito' e subtipo 'mais_48h', permitindo preencher a `observacao_texto` e a `documentacao_url`.
6. No histórico do paciente, aparece a entrada: "Óbito registrado em março/2025 por fulano@org.com.br".
7. Os totais numéricos dos blocos são independentes — o vínculo é informativo, não substitui o preenchimento dos campos.

> **Decisão de design:** os campos numéricos dos indicadores (ex: obitos_total = 2) são a fonte primária para os gráficos e semáforos. O vínculo com pacientes é uma camada adicional de rastreabilidade. Nunca calcule os totais contando `eventos_pacientes` — isso causaria inconsistências se o profissional esquecer de vincular.

---

## 7. Modelagem Completa do Banco de Dados

### 7.1 Tabela: usuarios

```sql
CREATE TABLE usuarios (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          VARCHAR(120) NOT NULL,
  email         VARCHAR(200) NOT NULL UNIQUE,
  google_sub    VARCHAR(100) UNIQUE,  -- ID unico retornado pelo Google
  perfil        VARCHAR(20)  NOT NULL DEFAULT 'editor'
                CHECK (perfil IN ('admin','editor','visualizador')),
  ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  ultimo_login  TIMESTAMPTZ,
  ultimo_ip     INET
);
```

### 7.2 Tabela: registros_mensais

```sql
CREATE TABLE registros_mensais (
  id                         UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  ano                        SMALLINT NOT NULL,
  mes                        SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  -- Bloco 01
  taxa_altas_pct             NUMERIC(5,2),
  -- Bloco 02
  intercorrencias_total      INTEGER, intercorr_removidas_dom INTEGER,
  intercorr_necessidade_rem  INTEGER,
  -- Bloco 03
  taxa_internacao_pct        NUMERIC(5,2),
  intern_deterioracao        INTEGER, intern_nao_aderencia INTEGER,
  -- Bloco 04
  obitos_total               INTEGER,
  obitos_menos_48h           INTEGER, obitos_mais_48h INTEGER,
  -- Bloco 05
  taxa_alteracao_pad_pct     NUMERIC(5,2),
  -- Bloco 06
  pacientes_total            INTEGER,
  pacientes_ad               INTEGER, pacientes_id INTEGER,
  -- Bloco 07
  pacientes_infectados       INTEGER,
  -- Bloco 08
  eventos_adversos_total     INTEGER,
  ea_quedas                  INTEGER, ea_broncoaspiracao INTEGER,
  ea_lesao_pressao           INTEGER, ea_decanulacao    INTEGER,
  ea_saida_gtt               INTEGER,
  -- Bloco 09
  ouvidorias_total           INTEGER,
  ouv_elogios                INTEGER, ouv_sugestoes    INTEGER,
  ouv_reclamacoes            INTEGER,
  -- Controle
  status                     VARCHAR(20) NOT NULL DEFAULT 'rascunho'
                             CHECK (status IN ('rascunho','confirmado')),
  criado_em                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em              TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por                 UUID REFERENCES usuarios(id),
  atualizado_por             UUID REFERENCES usuarios(id),
  UNIQUE (ano, mes)
);
```

### 7.3 Demais tabelas

```sql
CREATE TABLE metas (
  id               UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_codigo VARCHAR(10) NOT NULL,
  ano              SMALLINT    NOT NULL,
  meta_valor       NUMERIC(10,2),
  limite_alerta    NUMERIC(10,2),
  atualizado_por   UUID        REFERENCES usuarios(id),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (indicador_codigo, ano)
);

CREATE TABLE api_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID        NOT NULL,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
  method        VARCHAR(10) NOT NULL,
  route         VARCHAR(200),
  url           TEXT,
  status_code   SMALLINT,
  duration_ms   INTEGER,
  usuario_id    UUID REFERENCES usuarios(id),
  ip            INET,
  user_agent    TEXT,
  body          JSONB,
  query_params  JSONB,
  error_message TEXT
);

CREATE INDEX idx_logs_ts      ON api_logs(timestamp DESC);
CREATE INDEX idx_logs_usuario ON api_logs(usuario_id);
CREATE INDEX idx_logs_route   ON api_logs(route, method);
```

---

## 8. Especificação da API REST

Base URL: `/api/v1` | Todas as rotas (exceto `/auth`) exigem: `Authorization: Bearer <sessionToken>`

### 8.1 Autenticação

| Método   | Rota           | Descrição                                                      |
| :------- | :------------- | :------------------------------------------------------------- |
| **POST** | `/auth/google` | Recebe idToken do Google, valida domínio, retorna sessionToken |
| **POST** | `/auth/logout` | Invalida o sessionToken atual                                  |
| **GET**  | `/auth/me`     | Retorna dados do usuário logado e perfil                       |

### 8.2 Registros Mensais

| Método     | Rota                             | Descrição                                                |
| :--------- | :------------------------------- | :------------------------------------------------------- |
| **GET**    | `/registros`                     | Lista registros — filtros: `?ano=&mes=&status=`          |
| **GET**    | `/registros/:ano/:mes`           | Busca registro de um mês específico                      |
| **POST**   | `/registros`                     | Cria novo registro mensal (status: rascunho)             |
| **PUT**    | `/registros/:ano/:mes`           | Atualiza parcialmente — registra auditoria campo a campo |
| **PATCH**  | `/registros/:ano/:mes/confirmar` | Muda status de rascunho para confirmado                  |
| **DELETE** | `/registros/:ano/:mes`           | Remove registro — apenas admin                           |
| **GET**    | `/registros/:ano/resumo`         | Acumulado anual — totais e médias de todos os meses      |

### 8.3 Pacientes

| Método     | Rota                             | Descrição                                                          |
| :--------- | :------------------------------- | :----------------------------------------------------------------- |
| **GET**    | `/pacientes`                     | Lista pacientes — filtros: `?nome=&modalidade=&ativo=`             |
| **GET**    | `/pacientes/:id`                 | Busca paciente por ID com histórico de eventos                     |
| **POST**   | `/pacientes`                     | Cadastra novo paciente                                             |
| **PUT**    | `/pacientes/:id`                 | Atualiza dados do paciente                                         |
| **DELETE** | `/pacientes/:id`                 | Desativa paciente (soft delete) — apenas admin                     |
| **GET**    | `/pacientes/:id/eventos`         | Lista todos os eventos vinculados ao paciente                      |
| **POST**   | `/pacientes/:id/eventos`         | Registra novo evento no histórico do paciente (suporta docs e obs) |
| **GET**    | `/registros/:ano/:mes/pacientes` | Lista pacientes com eventos no mês especificado                    |

### 8.4 Metas e Semáforos

| Método  | Rota                  | Descrição                                                     |
| :------ | :-------------------- | :------------------------------------------------------------ |
| **GET** | `/metas/:ano`         | Lista metas de um ano                                         |
| **PUT** | `/metas/:codigo/:ano` | Cria ou atualiza meta de um indicador (upsert)                |
| **GET** | `/semaforo/:ano/:mes` | Retorna status verde/amarelo/vermelho de todos os indicadores |

### 8.5 Usuários (somente admin)

| Método     | Rota            | Descrição                                                      |
| :--------- | :-------------- | :------------------------------------------------------------- |
| **GET**    | `/usuarios`     | Lista todos os usuários                                        |
| **POST**   | `/usuarios`     | Cria pré-cadastro de usuário (fica aguardando 1º login Google) |
| **PUT**    | `/usuarios/:id` | Altera perfil ou ativa/desativa                                |
| **DELETE** | `/usuarios/:id` | Desativa usuário — nunca exclui do banco                       |

### 8.6 Exportações

| Método  | Rota                      | Descrição                                     |
| :------ | :------------------------ | :-------------------------------------------- |
| **GET** | `/exportar/xlsx/:ano`     | Gera XLSX idêntico à planilha original        |
| **GET** | `/exportar/pdf/:ano/:mes` | Gera PDF do dashboard do mês                  |
| **GET** | `/exportar/pdf/:ano`      | Gera PDF do relatório anual consolidado       |
| **GET** | `/exportar/pacientes/:id` | Gera PDF do histórico completo de um paciente |

### 8.7 Logs (somente admin)

| Método  | Rota                 | Descrição                                                              |
| :------ | :------------------- | :--------------------------------------------------------------------- |
| **GET** | `/logs`              | Lista logs paginados — filtros: `?metodo=&rota=&usuario=&inicio=&fim=` |
| **GET** | `/logs/:requestId`   | Detalhe completo de uma requisição específica                          |
| **GET** | `/logs/resumo/:data` | Estatísticas do dia: total de reqs, erros, P95 de tempo                |

---

## 9. Segurança e Controle de Acesso

### 9.1 Perfis de Usuário

| Perfil            | Permissões                                                           | Público Alvo                      |
| :---------------- | :------------------------------------------------------------------- | :-------------------------------- |
| **Administrador** | Acesso total: usuários, metas, logs, exportações, deletar registros. | Gestor / TI                       |
| **Editor**        | Cria e edita registros mensais e pacientes. Não gerencia usuários.   | Assistente / Técnico / Enfermeiro |
| **Visualizador**  | Leitura, semáforos e exportação apenas.                              | Médico / Diretor                  |

### 9.2 Boas Práticas Obrigatórias

- HTTPS obrigatório em produção — HTTP deve ser redirecionado automaticamente para HTTPS.
- O sessionToken nunca pode ser armazenado em localStorage (vulnerável a XSS) — usar IndexedDB ou cookie HttpOnly.
- Todos os endpoints da API devem validar o token antes de processar qualquer dado.
- Rate limiting na rota `/auth/google`: máximo 20 tentativas por IP em 10 minutos.
- O campo body nos logs deve ter tamanho máximo de 10KB — truncar se maior.
- Variáveis sensíveis (`SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `DATABASE_URL`) apenas no `.env`, nunca commitadas no Git.
- Adicionar `.env` no `.gitignore` imediatamente na criação do repositório.
- Logs de `api_logs` não devem armazenar tokens de sessão nem dados de pacientes identificáveis.
- Backup automático do banco: diário com retenção de 30 dias, semanal com 12 semanas.

---

## 10. Serviço Python Auxiliar (Fase 2)

O Node.js com TypeScript cobre todo o MVP. O Python entra como serviço separado para análises estatísticas que são mais naturais com `pandas` e `scikit-learn`. Os dois serviços se comunicam via HTTP interno.

### 10.1 Responsabilidades do Serviço Python

- Calcular tendências mensais usando regressão linear simples.
- Detectar anomalias: valores que fogem da média histórica em mais de 2 desvios padrão.
- Gerar os dados para o gráfico de tendência (sparkling) do dashboard.
- Produzir o resumo estatístico anual para o relatório PDF.

### 10.2 Estrutura do Serviço

```python
# python-service/main.py
from fastapi import FastAPI
import pandas as pd
import numpy as np

app = FastAPI()

@app.post('/tendencia')
def calcular_tendencia(dados: list[dict]):
    df = pd.DataFrame(dados)
    x  = np.arange(len(df))
    coef = np.polyfit(x, df['valor'], 1)   # Regressao linear
    tendencia = 'alta' if coef > 0.5 else 'queda' if coef < -0.5 else 'estavel'
    return {
        'tendencia':    tendencia,
        'inclinacao':   round(float(coef), 4),
        'proximo_mes':  round(float(np.polyval(coef, len(df))), 2)
    }

@app.post('/anomalias')
def detectar_anomalias(dados: list[dict]):
    df     = pd.DataFrame(dados)
    media  = df['valor'].mean()
    desvio = df['valor'].std()
    df['anomalia'] = (df['valor'] - media).abs() > 2 * desvio
    return df[df['anomalia']][['mes', 'valor']].to_dict('records')
```

### 10.3 Comunicação Node ↔ Python

```typescript
// src/services/analytics.service.ts
import axios from "axios";

const PYTHON_URL = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";

export async function calcularTendencia(
  dados: { mes: number; valor: number }[],
) {
  try {
    const res = await axios.post(`${PYTHON_URL}/tendencia`, dados, {
      timeout: 5000,
    });
    return res.data;
  } catch {
    // Servico Python indisponivel — retorna tendencia neutra
    return { tendencia: "estavel", inclinacao: 0, proximo_mes: null };
  }
}
```

---

## 11. Estrutura de Pastas do Projeto

### 11.1 Back-end (Node.js + TypeScript)

```text
backend/
├── src/
│   ├── config/
│   │   ├── database.ts         # Pool de conexoes Postgres / Memória
│   │   └── google-auth.ts      # Instancia do OAuth2Client
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.middleware.ts      # Valida sessionToken
│   │   ├── rbac.middleware.ts      # Controle por perfil
│   │   └── logger.middleware.ts    # Logging de requisicoes
│   ├── routes/
│   ├── services/
│   ├── lib/
│   │   └── logger.ts              # Instancia do Winston
│   ├── schemas/
│   │   └── registros.schema.ts    # Zod schemas
│   └── app.ts
├── migrations/
├── logs/                          # Arquivos de log (nao commitar)
├── .env.example
├── tsconfig.json
└── package.json
```

### 11.2 Front-end (React PWA + TypeScript)

```text
frontend/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── stores/
│   │   ├── authStore.ts         # Zustand
│   │   └── offlineStore.ts      # Gerencia pendentes offline
│   ├── lib/
│   │   ├── api.ts               # Axios com interceptor
│   │   └── db.ts                # IndexedDB helpers (idb)
│   ├── hooks/
│   └── main.tsx
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### 11.3 Serviço Python

```text
python-service/
├── main.py              # FastAPI app
├── routers/
├── requirements.txt     # fastapi, uvicorn, pandas, numpy, scikit-learn
└── Dockerfile
```

---

## 12. Estratégia de Testes e Ambiente de Desenvolvimento

Para garantir a confiabilidade do sistema e velocidade na entrega, a seguinte estratégia será adotada para o banco de dados e testes:

1. **Banco de Dados em Memória (Desenvolvimento):** Durante o desenvolvimento local e na execução das suítes de teste, o sistema não exigirá um container PostgreSQL. Em vez disso, utilizaremos um banco **SQLite em memória** integrado via Drizzle ORM ou `better-sqlite3`. Isso garante isolamento entre as execuções de teste e velocidade máxima.
2. **Testes Integrados:** Toda a API (camada 2) será coberta por testes integrados utilizando **Jest** acoplado ao **Supertest**. Os testes irão simular requisições HTTP validando os _Controllers_, o _Middleware_ de Autenticação/RBAC e a persistência final no banco in-memory.

---

## 13. Setup e Dependências

### 13.1 Variáveis de Ambiente (.env)

```env
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/indicadores_ad

# Google OAuth
GOOGLE_CLIENT_ID=XXXXXXXXXX.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-XXXXXXXXXX
ALLOWED_DOMAIN=suaorganizacao.com.br

# Sessao interna
SESSION_SECRET=string_aleatoria_longa_minimo_64_caracteres
SESSION_EXPIRES_IN=10h

# Servico Python (Fase 2)
PYTHON_SERVICE_URL=http://localhost:8000

# Logging
LOG_LEVEL=info
LOG_MAX_BODY_SIZE_KB=10

# App
PORT=3001
FRONTEND_URL=https://seudominio.com.br
NODE_ENV=development
```

### 13.2 Instalação — Back-end

```bash
# Dependencias de producao
npm install express cors helmet morgan
npm install pg drizzle-orm
npm install google-auth-library jsonwebtoken
npm install zod uuid winston
npm install exceljs puppeteer
npm install axios

# Dependencias de desenvolvimento e Testes Integrados
npm install -D typescript ts-node nodemon
npm install -D @types/express @types/node @types/pg @types/uuid
npm install -D @types/jsonwebtoken
npm install -D jest supertest @types/jest ts-jest
npm install -D drizzle-kit
npm install -D sqlite3 better-sqlite3 # Banco de dados em memoria para Dev/Tests
```

### 13.3 Instalação — Front-end

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend

npm install axios react-router-dom zustand
npm install recharts
npm install react-hook-form zod @hookform/resolvers
npm install @react-oauth/google
npm install idb
npm install @headlessui/react @heroicons/react

npm install -D tailwindcss postcss autoprefixer
npm install -D vite-plugin-pwa
npm install -D vitest @testing-library/react

npx tailwindcss init -p
```

### 13.4 Instalação — Python

```bash
# python-service/requirements.txt
fastapi==0.111.0
uvicorn==0.30.0
pandas==2.2.2
numpy==1.26.4
scikit-learn==1.5.0

# Instalar e rodar
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 13.5 Primeiros Passos após o Setup

1. Criar o banco: `createdb indicadores_ad` (se for rodar o ambiente de Produção/Staging).
2. Rodar todas as migrations: `npm run migrate` (backend).
3. Criar o primeiro administrador via script: `npm run seed:admin -- --email=admin@suaorg.com.br --nome="Administrador"`
4. Configurar o Google Cloud Console com Client ID e domínio autorizado.
5. Iniciar o backend e testes integrados para validação.
6. Acessar o app, clicar em "Entrar com Google" com a conta do administrador.

---

## 14. Plano de Implantação (Roadmap)

| Fase       | Nome / Duração                   | Entregas                                                                            |
| :--------- | :------------------------------- | :---------------------------------------------------------------------------------- |
| **FASE 0** | Infra e Setup (1-2 sem)          | Repositório Git, banco Postgres, setup SQLite in-memory para testes, CI básico.     |
| **FASE 1** | Auth + Logging (1-2 sem)         | Google OAuth integrado, sessionToken, middleware de logging, tabela `api_logs`.     |
| **FASE 2** | Backend — MVP (3-4 sem)          | API completa com Testes Integrados (Jest + Supertest): registros, pacientes, metas. |
| **FASE 3** | Frontend + PWA (3-4 sem)         | Telas React, PWA com Workbox, Cache IndexedDB.                                      |
| **FASE 4** | Integração e Pacientes (1-2 sem) | Módulo de eventos e histórico de pacientes com documentação/observação suportada.   |
| **FASE 5** | Homologação (2 sem)              | Testes com equipe, UX, treinamento, documentação de uso.                            |
| **FASE 6** | Go-Live (1-2 sem)                | Deploy de produção e suporte.                                                       |
| **FASE 7** | Python e alertas (Fase 2)        | Analytics e detecção de anomalias com FastAPI.                                      |

**Duração total do MVP (Fases 0-6):** 12 a 18 semanas com um desenvolvedor full-stack; 8-12 semanas com dois.

### Próximos Passos Recomendados

1. Validar esta documentação revisada com a equipe.
2. Criar o projeto no Google Cloud Console.
3. Iniciar a estrutura do backend e configurar o Jest com SQLite em memória antes de criar os endpoints reais.
4. Implementar Fase 1 (Autenticação + Logs).

---

## 15. Glossário — Linguagem Ubíqua

Definições canônicas dos termos de domínio usados em toda a documentação, código e comunicação da equipe. Qualquer divergência entre código e glossário deve ser corrigida no código.

| Termo | Definição |
| :--- | :--- |
| **AD (Atenção Domiciliar)** | Modalidade de atendimento em que o paciente recebe cuidados de saúde em sua residência, com visitas periódicas da equipe multidisciplinar. Subdivide-se em AD1, AD2 e AD3 conforme a complexidade. |
| **ID (Internação Domiciliar)** | Modalidade de alta complexidade na qual o paciente permanece em regime de cuidados intensivos contínuos no domicílio, com profissionais designados 24 horas. |
| **PAD (Programa de Atenção Domiciliar)** | Programa estruturado que organiza e coordena as ações de atenção domiciliar, englobando AD e ID. |
| **Alta Domiciliar** | Encerramento planejado do acompanhamento domiciliar por melhora clínica ou estabilização suficiente para seguimento ambulatorial. |
| **Intercorrência** | Evento clínico imprevisto durante o acompanhamento domiciliar que demanda intervenção além da rotina de cuidados programada. |
| **Remoção** | Transferência do paciente do domicílio para uma unidade hospitalar em decorrência de intercorrência que não pode ser resolvida em domicílio. |
| **Deterioração Clínica** | Piora progressiva ou súbita do quadro do paciente que motiva a internação hospitalar. |
| **Não Aderência ao Tratamento** | Recusa ou falha persistente do paciente/família em seguir o plano terapêutico prescrito, resultando em internação hospitalar. |
| **Óbito < 48h** | Falecimento ocorrido antes de completar 48 horas da implantação no programa de atenção domiciliar. Indica possível inadequação na triagem de elegibilidade. |
| **Óbito ≥ 48h** | Falecimento ocorrido 48 horas ou mais após a implantação no programa. Indicador de evolução natural ou complicações durante o acompanhamento. |
| **Alteração de PAD** | Mudança na modalidade de atendimento do paciente (ex: de AD para ID ou vice-versa), motivada por mudança no quadro clínico. |
| **Censo Assistencial** | Contagem periódica (mensal) do total de pacientes ativos no programa, discriminada por modalidade (AD e ID). |
| **Evento Adverso** | Incidente que resulta em dano ao paciente durante a prestação do cuidado domiciliar. Classificado por tipo e gravidade. |
| **Queda** | Evento adverso: deslocamento não intencional do corpo para um nível inferior à posição inicial, com incapacidade de correção em tempo hábil. |
| **Broncoaspiração** | Evento adverso: aspiração de conteúdo gástrico ou orofaríngeo para as vias aéreas inferiores. |
| **Lesão por Pressão** | Evento adverso: dano localizado na pele e/ou tecido subjacente, geralmente sobre uma proeminência óssea, resultante de pressão prolongada. |
| **Decanulação** | Evento adverso: saída acidental ou não programada da cânula de traqueostomia. |
| **Saída Acidental da GTT** | Evento adverso: deslocamento não programado da sonda de gastrostomia (GTT). |
| **Foco Infeccioso** | Local anatômico ou sistema orgânico identificado como sede de processo infeccioso ativo no paciente domiciliar. |
| **Ouvidoria** | Canal formal de recebimento de manifestações (elogios, sugestões, reclamações e solicitações) de pacientes, familiares ou responsáveis sobre os serviços prestados. |
| **Semáforo** | Sistema visual de classificação por cores (verde, amarelo, vermelho) que indica se um indicador está dentro da meta, em zona de alerta ou em estado crítico. |
| **Meta** | Valor-alvo definido pela gestão para cada indicador em um determinado ano, usado como referência para cálculo dos semáforos. |
| **Limite de Alerta** | Valor intermediário entre a meta ideal e o estado crítico; ao ser ultrapassado, o semáforo muda para amarelo. |
| **Registro Mensal** | Conjunto de dados numéricos dos 9 blocos de indicadores referente a um mês específico. Possui status "rascunho" ou "confirmado". |
| **Rascunho** | Status inicial de um registro mensal, editável por qualquer editor. Pode ser modificado livremente até ser confirmado. |
| **Confirmado** | Status final do registro mensal. Indica que os dados foram revisados e validados pelo gestor. Alterações posteriores geram registro de auditoria. |
| **Implantação** | Data de admissão/início do acompanhamento do paciente no programa de atenção domiciliar. |

---

## 16. Fórmulas e Cálculos dos 9 Indicadores

Cada bloco de indicador segue a mesma estrutura: definição, fórmula de cálculo, campos-fonte no banco de dados, unidade de medida, sentido ideal (↑ maior é melhor, ↓ menor é melhor) e exemplo numérico.

### Bloco 01 — Taxa de Altas Domiciliares

| Atributo | Valor |
| :--- | :--- |
| **Definição** | Percentual de pacientes que receberam alta do programa por melhora clínica em relação ao total de pacientes ativos no mês. |
| **Fórmula** | `(altas_no_mes / pacientes_total) × 100` |
| **Campos-fonte** | `registros_mensais.taxa_altas_pct` (armazenado diretamente) |
| **Unidade** | Percentual (%) |
| **Sentido ideal** | ↑ Maior é melhor (meta referência: 20%) |
| **Exemplo** | 18 altas / 90 pacientes = 20,0% |

### Bloco 02 — Intercorrências

| Atributo | Valor |
| :--- | :--- |
| **Definição** | Número total de eventos clínicos imprevistos no mês, com detalhamento de resolução (domicílio vs remoção). |
| **Fórmula (total)** | `intercorrencias_total = intercorr_removidas_dom + intercorr_necessidade_rem` |
| **Campos-fonte** | `registros_mensais.intercorrencias_total`, `.intercorr_removidas_dom`, `.intercorr_necessidade_rem` |
| **Unidade** | Contagem absoluta |
| **Sentido ideal** | ↓ Menor é melhor |
| **Subtipos** | 2.1 — Resolvidas em domicílio · 2.2 — Com necessidade de remoção |
| **Exemplo** | Total: 8 → 5 em domicílio + 3 remoções |

### Bloco 03 — Taxa de Internação Hospitalar

| Atributo | Valor |
| :--- | :--- |
| **Definição** | Percentual de pacientes internados em hospital durante o acompanhamento domiciliar, discriminado por motivo. |
| **Fórmula** | `(internacoes_total / pacientes_total) × 100` |
| **Campos-fonte** | `registros_mensais.taxa_internacao_pct`, `.intern_deterioracao`, `.intern_nao_aderencia` |
| **Unidade** | Percentual (%) para a taxa; contagem para subtipos |
| **Sentido ideal** | ↓ Menor é melhor |
| **Subtipos** | 3.1 — Deterioração clínica · 3.2 — Não aderência ao tratamento |
| **Exemplo** | 4 internações / 90 pacientes = 4,4% → 3 deterioração + 1 não aderência |

### Bloco 04 — Óbitos

| Atributo | Valor |
| :--- | :--- |
| **Definição** | Número total de falecimentos no mês, classificados pelo tempo desde a implantação no programa. |
| **Fórmula** | `obitos_total = obitos_menos_48h + obitos_mais_48h` |
| **Campos-fonte** | `registros_mensais.obitos_total`, `.obitos_menos_48h`, `.obitos_mais_48h` |
| **Unidade** | Contagem absoluta |
| **Sentido ideal** | ↓ Menor é melhor |
| **Subtipos** | 4.1 — < 48h de implantação · 4.2 — ≥ 48h de implantação |
| **Regra** | Óbitos < 48h devem gerar alerta automático ao gestor (possível falha na triagem de elegibilidade) |
| **Exemplo** | Total: 2 → 0 menos de 48h + 2 mais de 48h |

### Bloco 05 — Taxa de Alteração de PAD

| Atributo | Valor |
| :--- | :--- |
| **Definição** | Percentual de pacientes que tiveram sua modalidade de atendimento alterada (AD ↔ ID) durante o mês. |
| **Fórmula** | `(alteracoes_pad / pacientes_total) × 100` |
| **Campos-fonte** | `registros_mensais.taxa_alteracao_pad_pct` |
| **Unidade** | Percentual (%) |
| **Sentido ideal** | Neutro (alterações podem indicar tanto melhora quanto piora) |
| **Exemplo** | 3 alterações / 90 pacientes = 3,3% |

### Bloco 06 — Quantitativo de Pacientes AD e ID

| Atributo | Valor |
| :--- | :--- |
| **Definição** | Censo mensal do número total de pacientes ativos, com discriminação por modalidade. |
| **Fórmula** | `pacientes_total = pacientes_ad + pacientes_id` |
| **Campos-fonte** | `registros_mensais.pacientes_total`, `.pacientes_ad`, `.pacientes_id` |
| **Unidade** | Contagem absoluta |
| **Sentido ideal** | Informativo (sem meta direcional) |
| **Exemplo** | Total: 90 → 72 AD + 18 ID |

### Bloco 07 — Pacientes Infectados

| Atributo | Valor |
| :--- | :--- |
| **Definição** | Número de pacientes com infecção ativa identificada durante o mês, com registro do foco infeccioso. |
| **Fórmula (taxa)** | `(pacientes_infectados / pacientes_total) × 100` |
| **Campos-fonte** | `registros_mensais.pacientes_infectados` |
| **Detalhamento** | O foco infeccioso é registrado na tabela `eventos_pacientes` com `tipo_evento = 'infeccao'` |
| **Unidade** | Contagem absoluta + percentual derivado |
| **Sentido ideal** | ↓ Menor é melhor |
| **Exemplo** | 5 infectados / 90 pacientes = 5,6% |

### Bloco 08 — Eventos Adversos

| Atributo | Valor |
| :--- | :--- |
| **Definição** | Número total de eventos adversos notificados no mês, discriminados por tipo específico. |
| **Fórmula** | `eventos_adversos_total = ea_quedas + ea_broncoaspiracao + ea_lesao_pressao + ea_decanulacao + ea_saida_gtt` |
| **Campos-fonte** | `registros_mensais.eventos_adversos_total`, `.ea_quedas`, `.ea_broncoaspiracao`, `.ea_lesao_pressao`, `.ea_decanulacao`, `.ea_saida_gtt` |
| **Unidade** | Contagem absoluta |
| **Sentido ideal** | ↓ Menor é melhor (meta ideal: 0 para cada subtipo) |
| **Subtipos** | 8.1 Quedas · 8.2 Broncoaspiração · 8.3 Lesão por Pressão · 8.4 Decanulação · 8.5 Saída Acidental da GTT |
| **Exemplo** | Total: 4 → 2 quedas + 0 broncoaspiração + 1 lesão por pressão + 0 decanulação + 1 saída GTT |

### Bloco 09 — Ouvidorias

| Atributo | Valor |
| :--- | :--- |
| **Definição** | Número total de manifestações recebidas pela ouvidoria no mês, classificadas por natureza. |
| **Fórmula** | `ouvidorias_total = ouv_elogios + ouv_sugestoes + ouv_reclamacoes` |
| **Campos-fonte** | `registros_mensais.ouvidorias_total`, `.ouv_elogios`, `.ouv_sugestoes`, `.ouv_reclamacoes` |
| **Unidade** | Contagem absoluta |
| **Sentido ideal** | ↑ Elogios · ↓ Reclamações · Sugestões neutro |
| **Subtipos** | 9.1 Elogios · 9.2 Sugestões · 9.3 Reclamações e Solicitações |
| **Exemplo** | Total: 12 → 7 elogios + 3 sugestões + 2 reclamações |

---

## 17. Dashboard — Especificação de Componentes

O dashboard é a tela principal do sistema. Exibe uma visão consolidada de todos os 9 blocos de indicadores para o mês selecionado, com comparação ao mês anterior e à meta anual.

### 17.1 Layout Geral

```text
┌──────────────────────────────────────────────────────────────────┐
│  HEADER: Logo + Nome do Sistema + Seletor de Período + Usuário  │
├──────────────────────────────────────────────────────────────────┤
│  BARRA DE RESUMO: 3 cards grandes                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Pacientes│  │ Eventos  │  │ Taxa de  │                      │
│  │ Ativos   │  │ Adversos │  │ Altas    │                      │
│  │   90     │  │    4     │  │  20.0%   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
├──────────────────────────────────────────────────────────────────┤
│  GRID DE SEMÁFOROS: 9 cards (3×3) — um por bloco de indicador   │
│  Cada card contém:                                              │
│  • Ícone do semáforo (●) com cor verde/amarelo/vermelho         │
│  • Nome do indicador                                            │
│  • Valor atual (destaque grande)                                │
│  • Mini-barra de composição (subtipos)                          │
│  • Variação vs mês anterior (▲ +2.1% ou ▼ -1.3%)              │
├──────────────────────────────────────────────────────────────────┤
│  GRÁFICO DE TENDÊNCIA: Recharts LineChart — 12 meses            │
│  • Série principal: valor do indicador selecionado              │
│  • Linha tracejada: meta anual                                  │
│  • Tooltip com valor exato ao passar o mouse                    │
├──────────────────────────────────────────────────────────────────┤
│  TABELA DETALHADA: Últimos 6 meses lado a lado (compacta)       │
└──────────────────────────────────────────────────────────────────┘
```

### 17.2 Card de Semáforo — Especificação

Cada card segue o seguinte modelo de dados:

```typescript
interface SemaforoCard {
  indicador_codigo: string;          // '01' a '09'
  indicador_nome: string;            // 'Taxa de Altas Domiciliares'
  valor_atual: number;               // 20.0
  unidade: '%' | 'abs';              // percentual ou absoluto
  status: 'verde' | 'amarelo' | 'vermelho';
  meta_valor: number | null;         // 20.0 (se definida)
  variacao_mensal: number | null;    // +2.1 ou -1.3
  subtipos: {
    nome: string;
    valor: number;
  }[];
}
```

### 17.3 Componentes React — Hierarquia

```text
DashboardPage
├── PeriodoSelector          → Dropdown mês/ano + botões ◀ ▶
├── ResumoCards               → 3 cards de destaque (pacientes, EA, altas)
│   └── ResumoCard           → Ícone + valor + label + variação
├── SemaforoGrid              → Grid 3×3 de cards de semáforo
│   └── SemaforoCard         → Status + valor + mini-barra + variação
├── GraficoTendencia          → Recharts LineChart
│   └── CustomTooltip        → Tooltip personalizado
└── TabelaComparativa         → Tabela últimos 6 meses
```

### 17.4 Seletor de Período

- **Padrão:** mês atual ao abrir o dashboard.
- **Intervalo:** mínimo = primeiro registro existente; máximo = mês atual.
- **Navegação:** botões ◀ (mês anterior) e ▶ (mês seguinte) + dropdown para seleção direta.
- **URL:** o período selecionado reflete na URL como query param `?ano=2025&mes=03` para permitir compartilhamento de links.

### 17.5 Gráfico de Tendência — Recharts

```tsx
// Configuração do gráfico de tendência
<LineChart data={dadosMensais} width={800} height={300}>
  <XAxis dataKey="mes" tickFormatter={formatMes} />
  <YAxis domain={[0, 'auto']} />
  <Tooltip content={<CustomTooltip />} />
  <Line
    type="monotone"
    dataKey="valor"
    stroke="#3B82F6"
    strokeWidth={2}
    dot={{ r: 4 }}
    activeDot={{ r: 6 }}
  />
  {meta && (
    <ReferenceLine
      y={meta}
      stroke="#10B981"
      strokeDasharray="6 4"
      label={{ value: `Meta: ${meta}`, position: 'right' }}
    />
  )}
</LineChart>
```

### 17.6 Responsividade

| Viewport | Layout | Colunas de semáforo |
| :--- | :--- | :--- |
| Desktop (≥ 1024px) | Grid completo | 3 colunas |
| Tablet (768–1023px) | Grid adaptado | 2 colunas |
| Mobile (< 768px) | Coluna única | 1 coluna, cards empilhados |

O gráfico de tendência em mobile usa scroll horizontal com `overflow-x: auto`.

---

## 18. Metas e Semáforos — Lógica de Classificação

O sistema de semáforos transforma números brutos em sinais visuais intuitivos. Para cada indicador, o administrador define duas referências: a **meta** (valor ideal) e o **limite de alerta** (limiar de atenção). O algoritmo classifica automaticamente o valor atual em uma das três zonas.

### 18.1 Algoritmo de Classificação

O comportamento do semáforo depende do **sentido ideal** do indicador:

**Indicadores onde ↑ maior é melhor** (ex: Taxa de Altas):

```typescript
function classificar(valor: number, meta: number, alerta: number): Status {
  if (valor >= meta)   return 'verde';
  if (valor >= alerta) return 'amarelo';
  return 'vermelho';
}
```

**Indicadores onde ↓ menor é melhor** (ex: Óbitos, EA, Intercorrências):

```typescript
function classificar(valor: number, meta: number, alerta: number): Status {
  if (valor <= meta)   return 'verde';
  if (valor <= alerta) return 'amarelo';
  return 'vermelho';
}
```

**Indicadores informativos** (ex: Censo, Alteração de PAD): semáforo fixo em azul (neutro).

### 18.2 Tabela de Metas Padrão (Referência Inicial)

Estes são os valores padrão sugeridos, editáveis pelo administrador a qualquer momento:

| Bloco | Indicador | Sentido | Meta (verde) | Alerta (amarelo) | Crítico (vermelho) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| 01 | Taxa de Altas (%) | ↑ | ≥ 20% | ≥ 15% | < 15% |
| 02 | Intercorrências (abs) | ↓ | ≤ 3 | ≤ 6 | > 6 |
| 03 | Taxa Internação (%) | ↓ | ≤ 5% | ≤ 10% | > 10% |
| 04 | Óbitos (abs) | ↓ | ≤ 1 | ≤ 3 | > 3 |
| 05 | Alteração PAD (%) | — | Neutro | — | — |
| 06 | Censo AD/ID (abs) | — | Neutro | — | — |
| 07 | Infectados (abs) | ↓ | ≤ 2 | ≤ 5 | > 5 |
| 08 | Eventos Adversos (abs) | ↓ | 0 | ≤ 2 | > 2 |
| 09 | Ouvidorias — Reclamações (abs) | ↓ | 0 | ≤ 2 | > 2 |

### 18.3 Cores e Significado Visual

| Status | Cor (hex) | Tailwind | Significado |
| :--- | :--- | :--- | :--- |
| **Verde** | `#10B981` | `emerald-500` | Dentro da meta — nenhuma ação necessária |
| **Amarelo** | `#F59E0B` | `amber-500` | Zona de alerta — monitorar e investigar |
| **Vermelho** | `#EF4444` | `red-500` | Crítico — ação corretiva imediata necessária |
| **Azul** | `#3B82F6` | `blue-500` | Informativo — sem meta direcional |

### 18.4 Endpoint `/api/v1/semaforo/:ano/:mes` — Resposta

```json
{
  "ano": 2025,
  "mes": 3,
  "indicadores": [
    {
      "codigo": "01",
      "nome": "Taxa de Altas Domiciliares",
      "valor": 20.0,
      "meta": 20.0,
      "alerta": 15.0,
      "status": "verde",
      "variacao": 2.1
    },
    {
      "codigo": "04",
      "nome": "Óbitos",
      "valor": 2,
      "meta": 1,
      "alerta": 3,
      "status": "amarelo",
      "variacao": -1
    }
  ]
}
```

### 18.5 Implementação do Serviço de Semáforo

```typescript
// src/services/semaforo.service.ts
import { db } from '../config/database';

type Status = 'verde' | 'amarelo' | 'vermelho' | 'neutro';

interface IndicadorComMeta {
  codigo: string;
  nome: string;
  valor: number;
  meta: number | null;
  alerta: number | null;
  sentido: 'maior' | 'menor' | 'neutro';
}

const SENTIDO: Record<string, 'maior' | 'menor' | 'neutro'> = {
  '01': 'maior',  // Altas: maior é melhor
  '02': 'menor',  // Intercorrências: menor é melhor
  '03': 'menor',  // Internação: menor é melhor
  '04': 'menor',  // Óbitos: menor é melhor
  '05': 'neutro', // Alteração PAD: informativo
  '06': 'neutro', // Censo: informativo
  '07': 'menor',  // Infectados: menor é melhor
  '08': 'menor',  // Eventos Adversos: menor é melhor
  '09': 'menor',  // Reclamações: menor é melhor
};

export function calcularStatus(ind: IndicadorComMeta): Status {
  if (ind.sentido === 'neutro' || ind.meta === null) return 'neutro';

  if (ind.sentido === 'maior') {
    if (ind.valor >= ind.meta) return 'verde';
    if (ind.alerta !== null && ind.valor >= ind.alerta) return 'amarelo';
    return 'vermelho';
  }

  // sentido === 'menor'
  if (ind.valor <= ind.meta) return 'verde';
  if (ind.alerta !== null && ind.valor <= ind.alerta) return 'amarelo';
  return 'vermelho';
}
```

---

## 19. Auditoria e Histórico de Alterações

O módulo de auditoria rastreia toda modificação em registros mensais confirmados. O objetivo é manter um histórico imutável de quem alterou o quê, quando e de qual dispositivo — requisito obrigatório para conformidade em saúde.

### 19.1 Tabela: audit_log

```sql
CREATE TABLE audit_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Referência ao registro alterado
  entidade        VARCHAR(50) NOT NULL,   -- 'registro_mensal' | 'paciente' | 'meta' | 'usuario'
  entidade_id     UUID        NOT NULL,   -- ID do registro alterado
  -- Contexto da alteração
  acao            VARCHAR(20) NOT NULL,   -- 'criar' | 'editar' | 'confirmar' | 'excluir'
  campo_alterado  VARCHAR(50),            -- nome do campo (null se acao = 'criar')
  valor_anterior  TEXT,                   -- valor antes da alteração (serializado como string)
  valor_novo      TEXT,                   -- valor depois da alteração
  -- Quem e quando
  usuario_id      UUID        NOT NULL REFERENCES usuarios(id),
  usuario_email   VARCHAR(200) NOT NULL,
  ip              INET,
  user_agent      TEXT,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Observação opcional
  justificativa   TEXT                    -- motivo da alteração (obrigatório em registros confirmados)
);

CREATE INDEX idx_audit_entidade ON audit_log(entidade, entidade_id);
CREATE INDEX idx_audit_usuario  ON audit_log(usuario_id);
CREATE INDEX idx_audit_ts       ON audit_log(timestamp DESC);
```

### 19.2 Quando a auditoria é gerada

| Situação | Auditoria | Justificativa obrigatória? |
| :--- | :--- | :--- |
| Criar registro mensal (rascunho) | ✅ Registra ação `criar` | Não |
| Editar campo em rascunho | ✅ Registra campo, anterior e novo | Não |
| Confirmar registro | ✅ Registra ação `confirmar` | Não |
| Editar campo em registro confirmado | ✅ Registra campo, anterior e novo | **Sim** — obrigatório |
| Excluir registro (admin) | ✅ Registra ação `excluir` com snapshot | **Sim** — obrigatório |
| Alterar dados de paciente | ✅ Registra campos alterados | Não |
| Alterar meta/limite | ✅ Registra meta anterior e nova | Não |

### 19.3 Middleware de Auditoria

```typescript
// src/middleware/audit.middleware.ts
import { db } from '../config/database';

interface AuditEntry {
  entidade: string;
  entidade_id: string;
  acao: 'criar' | 'editar' | 'confirmar' | 'excluir';
  campo_alterado?: string;
  valor_anterior?: string;
  valor_novo?: string;
  justificativa?: string;
}

export async function registrarAuditoria(
  entry: AuditEntry,
  req: Request,
) {
  await db.insert(auditLog).values({
    ...entry,
    usuario_id: req.user!.id,
    usuario_email: req.user!.email,
    ip: req.ip,
    user_agent: req.headers['user-agent'],
  });
}

// Gera diff campo a campo entre dois objetos
export function gerarDiff(
  anterior: Record<string, unknown>,
  novo: Record<string, unknown>,
): { campo: string; de: string; para: string }[] {
  const diffs: { campo: string; de: string; para: string }[] = [];

  for (const campo of Object.keys(novo)) {
    if (String(anterior[campo]) !== String(novo[campo])) {
      diffs.push({
        campo,
        de: String(anterior[campo] ?? ''),
        para: String(novo[campo] ?? ''),
      });
    }
  }

  return diffs;
}
```

### 19.4 API de Auditoria

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| **GET** | `/auditoria/:entidade/:id` | Lista histórico de alterações de um registro específico |
| **GET** | `/auditoria` | Lista paginada — filtros: `?entidade=&usuario=&acao=&inicio=&fim=` |
| **GET** | `/auditoria/:id/detalhe` | Exibe diff completo de uma alteração |

### 19.5 Tela de Auditoria — Requisitos de UI

- Timeline vertical com cada alteração como um card.
- Cada card exibe: data/hora, nome do usuário, ação, campo alterado e diff visual (vermelho = removido, verde = adicionado).
- Filtros laterais: por usuário, tipo de entidade, intervalo de datas, tipo de ação.
- Botão "Exportar auditoria" gera CSV com todos os registros filtrados.

---

## 20. Exportação — XLSX e PDF

O sistema deve gerar exportações idênticas à planilha Excel original utilizada pela equipe, garantindo que a migração não cause perda de formato familiar.

### 20.1 Exportação XLSX — Mapeamento de Colunas

O arquivo Excel gerado pelo endpoint `GET /api/v1/exportar/xlsx/:ano` segue exatamente a estrutura da planilha original:

```text
Planilha "Indicadores {ano}"
┌─────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────┐
│     │ Jan  │ Fev  │ Mar  │ Abr  │ Mai  │ Jun  │ Jul  │ Ago  │ Set  │ Out  │ Nov  │ Dez  │ Acumul. │
├─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼─────────┤
│ 01  │ 20.0 │ 18.5 │ ...  │      │      │      │      │      │      │      │      │      │  19.2   │
│ 02  │   8  │   5  │ ...  │      │      │      │      │      │      │      │      │      │   13    │
│ 2.1 │   5  │   3  │ ...  │      │      │      │      │      │      │      │      │      │    8    │
│ 2.2 │   3  │   2  │ ...  │      │      │      │      │      │      │      │      │      │    5    │
│ ... │      │      │      │      │      │      │      │      │      │      │      │      │         │
│ 09  │  12  │  10  │ ...  │      │      │      │      │      │      │      │      │      │   22    │
│ 9.1 │   7  │   6  │ ...  │      │      │      │      │      │      │      │      │      │   13    │
│ 9.2 │   3  │   2  │ ...  │      │      │      │      │      │      │      │      │      │    5    │
│ 9.3 │   2  │   2  │ ...  │      │      │      │      │      │      │      │      │      │    4    │
└─────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴─────────┘
```

### 20.2 Implementação do Gerador XLSX

```typescript
// src/services/exportar-xlsx.service.ts
import ExcelJS from 'exceljs';

const LINHAS_INDICADORES = [
  { codigo: '01',  campo: 'taxa_altas_pct',        label: '01 - Taxa de Altas (%)' },
  { codigo: '02',  campo: 'intercorrencias_total',  label: '02 - Intercorrências' },
  { codigo: '2.1', campo: 'intercorr_removidas_dom', label: '  2.1 - Resolvidas domicílio' },
  { codigo: '2.2', campo: 'intercorr_necessidade_rem', label: '  2.2 - Necessidade remoção' },
  { codigo: '03',  campo: 'taxa_internacao_pct',    label: '03 - Taxa Internação (%)' },
  { codigo: '3.1', campo: 'intern_deterioracao',    label: '  3.1 - Deterioração clínica' },
  { codigo: '3.2', campo: 'intern_nao_aderencia',   label: '  3.2 - Não aderência' },
  { codigo: '04',  campo: 'obitos_total',           label: '04 - Óbitos' },
  { codigo: '4.1', campo: 'obitos_menos_48h',       label: '  4.1 - Menos de 48h' },
  { codigo: '4.2', campo: 'obitos_mais_48h',        label: '  4.2 - Mais de 48h' },
  { codigo: '05',  campo: 'taxa_alteracao_pad_pct',  label: '05 - Taxa Alteração PAD (%)' },
  { codigo: '06',  campo: 'pacientes_total',        label: '06 - Pacientes Total' },
  { codigo: '6.1', campo: 'pacientes_ad',           label: '  6.1 - Pacientes AD' },
  { codigo: '6.2', campo: 'pacientes_id',           label: '  6.2 - Pacientes ID' },
  { codigo: '07',  campo: 'pacientes_infectados',   label: '07 - Infectados' },
  { codigo: '08',  campo: 'eventos_adversos_total',  label: '08 - Eventos Adversos' },
  { codigo: '8.1', campo: 'ea_quedas',              label: '  8.1 - Quedas' },
  { codigo: '8.2', campo: 'ea_broncoaspiracao',     label: '  8.2 - Broncoaspiração' },
  { codigo: '8.3', campo: 'ea_lesao_pressao',       label: '  8.3 - Lesão por Pressão' },
  { codigo: '8.4', campo: 'ea_decanulacao',         label: '  8.4 - Decanulação' },
  { codigo: '8.5', campo: 'ea_saida_gtt',           label: '  8.5 - Saída GTT' },
  { codigo: '09',  campo: 'ouvidorias_total',       label: '09 - Ouvidorias' },
  { codigo: '9.1', campo: 'ouv_elogios',            label: '  9.1 - Elogios' },
  { codigo: '9.2', campo: 'ouv_sugestoes',          label: '  9.2 - Sugestões' },
  { codigo: '9.3', campo: 'ouv_reclamacoes',        label: '  9.3 - Reclamações' },
];

export async function gerarXLSX(ano: number, registros: RegistroMensal[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Indicadores ${ano}`);

  // Cabeçalho
  const meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Acumulado'];
  sheet.addRow(meses);

  // Estilo do cabeçalho
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern', pattern: 'solid',
    fgColor: { argb: 'FF1A3A5C' },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Linhas de dados
  for (const linha of LINHAS_INDICADORES) {
    const valores = [linha.label];
    for (let mes = 1; mes <= 12; mes++) {
      const reg = registros.find(r => r.mes === mes);
      valores.push(reg ? String(reg[linha.campo] ?? '') : '');
    }
    // Coluna acumulado (soma ou média conforme o tipo)
    const isPercentual = linha.campo.includes('pct');
    const nums = registros.map(r => r[linha.campo]).filter(v => v != null) as number[];
    const acumulado = isPercentual
      ? nums.reduce((a, b) => a + b, 0) / (nums.length || 1)
      : nums.reduce((a, b) => a + b, 0);
    valores.push(String(Math.round(acumulado * 100) / 100));

    sheet.addRow(valores);
  }

  // Ajustar largura das colunas
  sheet.getColumn(1).width = 30;
  for (let i = 2; i <= 14; i++) sheet.getColumn(i).width = 10;

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
```

### 20.3 Exportação PDF — Layout

O PDF é gerado via Puppeteer (headless Chrome), renderizando uma versão print-friendly do dashboard.

```typescript
// src/services/exportar-pdf.service.ts
import puppeteer from 'puppeteer';

export async function gerarPDF(url: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:8px;width:100%;text-align:center;">Indicadores AD — Confidencial</div>',
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
  });
  
  await browser.close();
  return Buffer.from(pdf);
}
```

### 20.4 Tipos de Exportação Disponíveis

| Endpoint | Formato | Conteúdo |
| :--- | :--- | :--- |
| `GET /exportar/xlsx/:ano` | XLSX | Planilha anual com 12 meses + acumulado |
| `GET /exportar/pdf/:ano/:mes` | PDF | Dashboard do mês em formato A4 landscape |
| `GET /exportar/pdf/:ano` | PDF | Relatório anual consolidado (múltiplas páginas) |
| `GET /exportar/pacientes/:id` | PDF | Histórico completo do paciente com timeline de eventos |

---

## 21. Schemas de Validação (Zod)

Todos os schemas são definidos uma única vez no diretório `shared/schemas/` e importados tanto pelo front-end (formulários) quanto pelo back-end (middlewares de validação). Isso garante que a mesma regra de validação seja aplicada nas duas pontas, eliminando inconsistências.

### 21.1 Schema — Registro Mensal

```typescript
// shared/schemas/registro-mensal.schema.ts
import { z } from 'zod';

export const registroMensalSchema = z.object({
  ano: z.number().int().min(2020).max(2099),
  mes: z.number().int().min(1).max(12),

  // Bloco 01
  taxa_altas_pct: z.number().min(0).max(100).nullable().optional(),

  // Bloco 02
  intercorrencias_total: z.number().int().min(0).nullable().optional(),
  intercorr_removidas_dom: z.number().int().min(0).nullable().optional(),
  intercorr_necessidade_rem: z.number().int().min(0).nullable().optional(),

  // Bloco 03
  taxa_internacao_pct: z.number().min(0).max(100).nullable().optional(),
  intern_deterioracao: z.number().int().min(0).nullable().optional(),
  intern_nao_aderencia: z.number().int().min(0).nullable().optional(),

  // Bloco 04
  obitos_total: z.number().int().min(0).nullable().optional(),
  obitos_menos_48h: z.number().int().min(0).nullable().optional(),
  obitos_mais_48h: z.number().int().min(0).nullable().optional(),

  // Bloco 05
  taxa_alteracao_pad_pct: z.number().min(0).max(100).nullable().optional(),

  // Bloco 06
  pacientes_total: z.number().int().min(0).nullable().optional(),
  pacientes_ad: z.number().int().min(0).nullable().optional(),
  pacientes_id: z.number().int().min(0).nullable().optional(),

  // Bloco 07
  pacientes_infectados: z.number().int().min(0).nullable().optional(),

  // Bloco 08
  eventos_adversos_total: z.number().int().min(0).nullable().optional(),
  ea_quedas: z.number().int().min(0).nullable().optional(),
  ea_broncoaspiracao: z.number().int().min(0).nullable().optional(),
  ea_lesao_pressao: z.number().int().min(0).nullable().optional(),
  ea_decanulacao: z.number().int().min(0).nullable().optional(),
  ea_saida_gtt: z.number().int().min(0).nullable().optional(),

  // Bloco 09
  ouvidorias_total: z.number().int().min(0).nullable().optional(),
  ouv_elogios: z.number().int().min(0).nullable().optional(),
  ouv_sugestoes: z.number().int().min(0).nullable().optional(),
  ouv_reclamacoes: z.number().int().min(0).nullable().optional(),
}).refine(
  (data) => {
    // Validação cruzada: subtotais devem somar ao total (quando informados)
    if (data.obitos_total != null && data.obitos_menos_48h != null && data.obitos_mais_48h != null) {
      return data.obitos_total === data.obitos_menos_48h + data.obitos_mais_48h;
    }
    return true;
  },
  { message: 'obitos_total deve ser igual a obitos_menos_48h + obitos_mais_48h', path: ['obitos_total'] }
);

// Tipo inferido — nunca declarar manualmente
export type RegistroMensal = z.infer<typeof registroMensalSchema>;
```

### 21.2 Schema — Paciente

```typescript
// shared/schemas/paciente.schema.ts
import { z } from 'zod';

export const modalidadeSchema = z.enum(['AD', 'ID', 'AD2', 'AD3']);

export const pacienteSchema = z.object({
  nome: z.string().min(3).max(200),
  data_nascimento: z.string().date().nullable().optional(),
  codigo_interno: z.string().max(50).nullable().optional(),
  modalidade: modalidadeSchema.nullable().optional(),
  observacoes: z.string().max(2000).nullable().optional(),
});

export type Paciente = z.infer<typeof pacienteSchema>;
```

### 21.3 Schema — Evento de Paciente

```typescript
// shared/schemas/evento-paciente.schema.ts
import { z } from 'zod';

export const tipoEventoSchema = z.enum([
  'alta_domiciliar', 'intercorrencia', 'internacao',
  'obito', 'evento_adverso', 'infeccao', 'alteracao_pad',
]);

export const subtipoEventoSchema = z.string().max(50).nullable().optional();

export const eventoPacienteSchema = z.object({
  tipo_evento: tipoEventoSchema,
  subtipo: subtipoEventoSchema,
  data_evento: z.string().date().nullable().optional(),
  descricao: z.string().max(500).nullable().optional(),
  observacao_texto: z.string().max(5000).nullable().optional(),
  documentacao_url: z.string().url().max(500).nullable().optional(),
});

export type EventoPaciente = z.infer<typeof eventoPacienteSchema>;
```

### 21.4 Schema — Meta

```typescript
// shared/schemas/meta.schema.ts
import { z } from 'zod';

export const metaSchema = z.object({
  indicador_codigo: z.string().regex(/^(0[1-9])$/),
  ano: z.number().int().min(2020).max(2099),
  meta_valor: z.number().min(0).nullable(),
  limite_alerta: z.number().min(0).nullable(),
});

export type Meta = z.infer<typeof metaSchema>;
```

### 21.5 Middleware de Validação no Back-end

```typescript
// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).json({
          error: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            campo: e.path.join('.'),
            mensagem: e.message,
            codigo: e.code,
          })),
        });
      }
      next(error);
    }
  };
}

// Uso na rota:
// router.post('/registros', validate(registroMensalSchema), registrosController.criar);
```

---

## 22. Tratamento de Erros

Toda camada do sistema (domínio, aplicação, infraestrutura, apresentação) tem uma estratégia explícita de tratamento de erros. Erros nunca são ignorados silenciosamente.

### 22.1 Hierarquia de Erros do Domínio

```typescript
// src/errors/app-error.ts

// Erro base — todas as exceções do sistema estendem desta
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Erros de validação (422)
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 422, details);
  }
}

// Recurso não encontrado (404)
export class NotFoundError extends AppError {
  constructor(entidade: string, id: string) {
    super(`${entidade} não encontrado: ${id}`, 'NOT_FOUND', 404);
  }
}

// Acesso negado (403)
export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 'FORBIDDEN', 403);
  }
}

// Não autenticado (401)
export class UnauthorizedError extends AppError {
  constructor(message = 'Token inválido ou expirado') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

// Conflito de dados (409)
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

// Regra de negócio violada (400)
export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION', 400);
  }
}
```

### 22.2 Middleware Global de Erros

```typescript
// src/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../lib/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Erros conhecidos do sistema
  if (err instanceof AppError) {
    logger.warn({
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
      requestId: req.requestId,
    });

    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
    });
  }

  // Erros inesperados — logar stack completo, retornar genérico
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
  });

  return res.status(500).json({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
```

### 22.3 Tratamento no Front-end

```typescript
// src/lib/api.ts — Interceptor de erros do Axios
import axios from 'axios';
import { localDb } from './db';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 15000,
});

// Interceptor de request — injeta token
api.interceptors.request.use(async (config) => {
  const db = await localDb;
  const session = await db.get('session', 'current');
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

// Interceptor de response — trata erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado — limpar sessão e redirecionar para login
      const db = await localDb;
      await db.delete('session', 'current');
      window.location.href = '/login';
    }

    // Propaga erro com mensagem legível
    const message = error.response?.data?.error ?? 'Erro de conexão com o servidor';
    return Promise.reject(new Error(message));
  },
);

export { api };
```

### 22.4 Códigos de Erro Padronizados

| Código | HTTP | Descrição |
| :--- | :---: | :--- |
| `VALIDATION_ERROR` | 422 | Dados enviados não passaram na validação Zod |
| `NOT_FOUND` | 404 | Registro, paciente ou meta não encontrado |
| `FORBIDDEN` | 403 | Perfil do usuário não tem permissão para esta ação |
| `UNAUTHORIZED` | 401 | Token inválido, expirado ou ausente |
| `CONFLICT` | 409 | Registro duplicado (ex: mesmo ano/mês já existe) |
| `BUSINESS_RULE_VIOLATION` | 400 | Regra de negócio violada (ex: confirmar registro incompleto) |
| `INTERNAL_ERROR` | 500 | Erro inesperado no servidor |
| `SERVICE_UNAVAILABLE` | 503 | Serviço Python ou banco de dados indisponível |

---

## 23. CI/CD e Deploy

O pipeline de integração contínua roda em **GitHub Actions** e cobre desde o lint até o deploy em produção. Cada push para `main` aciona o pipeline completo; PRs executam apenas as etapas de verificação.

### 23.1 Pipeline — Visão Geral

```text
┌────────┐    ┌────────┐    ┌────────┐    ┌─────────┐    ┌─────────┐
│  Lint  │───▶│  Test  │───▶│ Build  │───▶│ Staging │───▶│  Prod   │
│ (30s)  │    │ (2min) │    │ (1min) │    │ (auto)  │    │(manual) │
└────────┘    └────────┘    └────────┘    └─────────┘    └─────────┘
```

### 23.2 GitHub Actions — Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.12'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter backend run lint
      - run: pnpm --filter frontend run lint
      - run: pnpm --filter backend run typecheck
      - run: pnpm --filter frontend run typecheck

  test-backend:
    name: Backend Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter backend run test -- --coverage
        env:
          NODE_ENV: test
          DATABASE_URL: ':memory:'

      - uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/coverage/

  test-frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter frontend run test -- --coverage

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter backend run build
      - run: pnpm --filter frontend run build

      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: |
            backend/dist/
            frontend/dist/

  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
      # Deploy para ambiente de staging (Render / Railway)
      - run: echo "Deploy to staging environment"

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://indicadores.suaorg.com.br
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
      # Deploy manual — requer aprovação
      - run: echo "Deploy to production environment"
```

### 23.3 Ambientes

| Ambiente | URL | Deploy | Banco |
| :--- | :--- | :--- | :--- |
| **Local** | `localhost:5173` (front) / `:3001` (back) | Manual (`pnpm dev`) | SQLite in-memory |
| **Staging** | `staging.indicadores.suaorg.com.br` | Auto (push main) | PostgreSQL staging |
| **Produção** | `indicadores.suaorg.com.br` | Manual (aprovação) | PostgreSQL produção |

### 23.4 Scripts npm

```json
{
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/app.js",
    "lint": "eslint src/ --ext .ts",
    "typecheck": "tsc --noEmit",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "migrate": "drizzle-kit push",
    "migrate:generate": "drizzle-kit generate",
    "seed:admin": "tsx scripts/seed-admin.ts"
  }
}
```

---

## 24. Diagramas de Arquitetura (Mermaid)

### 24.1 Diagrama ER — Banco de Dados

```mermaid
erDiagram
    USUARIOS {
        uuid id PK
        varchar nome
        varchar email UK
        varchar google_sub UK
        varchar perfil
        boolean ativo
        timestamptz criado_em
        timestamptz ultimo_login
        inet ultimo_ip
    }

    REGISTROS_MENSAIS {
        uuid id PK
        smallint ano
        smallint mes
        numeric taxa_altas_pct
        integer intercorrencias_total
        integer intercorr_removidas_dom
        integer intercorr_necessidade_rem
        numeric taxa_internacao_pct
        integer intern_deterioracao
        integer intern_nao_aderencia
        integer obitos_total
        integer obitos_menos_48h
        integer obitos_mais_48h
        numeric taxa_alteracao_pad_pct
        integer pacientes_total
        integer pacientes_ad
        integer pacientes_id
        integer pacientes_infectados
        integer eventos_adversos_total
        integer ea_quedas
        integer ea_broncoaspiracao
        integer ea_lesao_pressao
        integer ea_decanulacao
        integer ea_saida_gtt
        integer ouvidorias_total
        integer ouv_elogios
        integer ouv_sugestoes
        integer ouv_reclamacoes
        varchar status
        uuid criado_por FK
        uuid atualizado_por FK
    }

    PACIENTES {
        uuid id PK
        varchar nome
        date data_nascimento
        varchar codigo_interno
        varchar modalidade
        boolean ativo
        text observacoes
        uuid criado_por FK
    }

    EVENTOS_PACIENTES {
        uuid id PK
        uuid paciente_id FK
        uuid registro_id FK
        smallint ano
        smallint mes
        varchar tipo_evento
        varchar subtipo
        date data_evento
        text observacao_texto
        varchar documentacao_url
        text descricao
        uuid registrado_por FK
    }

    METAS {
        uuid id PK
        varchar indicador_codigo
        smallint ano
        numeric meta_valor
        numeric limite_alerta
        uuid atualizado_por FK
    }

    AUDIT_LOG {
        uuid id PK
        varchar entidade
        uuid entidade_id
        varchar acao
        varchar campo_alterado
        text valor_anterior
        text valor_novo
        uuid usuario_id FK
        varchar usuario_email
        inet ip
        text user_agent
        timestamptz timestamp
        text justificativa
    }

    API_LOGS {
        uuid id PK
        uuid request_id
        timestamptz timestamp
        varchar method
        varchar route
        text url
        smallint status_code
        integer duration_ms
        uuid usuario_id FK
        inet ip
        text user_agent
        jsonb body
        jsonb query_params
        text error_message
    }

    USUARIOS ||--o{ REGISTROS_MENSAIS : "cria/atualiza"
    USUARIOS ||--o{ PACIENTES : "cadastra"
    USUARIOS ||--o{ EVENTOS_PACIENTES : "registra"
    USUARIOS ||--o{ AUDIT_LOG : "gera"
    USUARIOS ||--o{ API_LOGS : "origina"
    USUARIOS ||--o{ METAS : "define"
    PACIENTES ||--o{ EVENTOS_PACIENTES : "possui"
    REGISTROS_MENSAIS ||--o{ EVENTOS_PACIENTES : "referencia"
```

### 24.2 Diagrama de Sequência — Fluxo de Autenticação

```mermaid
sequenceDiagram
    actor U as Usuário
    participant F as Frontend PWA
    participant G as Google OAuth
    participant A as API Backend
    participant D as PostgreSQL

    U->>F: Clica "Entrar com Google"
    F->>G: Abre popup OAuth 2.0
    G->>U: Exibe tela de login do Workspace
    U->>G: Autentica com credenciais Google
    G->>F: Retorna auth-code
    F->>A: POST /api/v1/auth/google { code }
    A->>G: Valida ID Token (google-auth-library)
    G-->>A: Payload { email, sub, name }
    A->>A: Verifica domínio (@suaorg.com.br)
    A->>D: SELECT usuario WHERE email AND ativo
    D-->>A: Dados do usuário + perfil
    A->>A: Gera sessionToken (JWT 10h)
    A->>D: INSERT api_logs (login)
    A-->>F: { sessionToken, perfil, nome }
    F->>F: Salva token no IndexedDB
    F-->>U: Redireciona para Dashboard
```

### 24.3 Diagrama de Sequência — Sincronização Offline

```mermaid
sequenceDiagram
    actor U as Usuário
    participant F as Frontend PWA
    participant IDB as IndexedDB
    participant SW as Service Worker
    participant A as API Backend

    Note over U,A: Cenário: sem internet

    U->>F: Preenche registro mensal
    F->>F: Detecta navigator.onLine === false
    F->>IDB: Salva em "pendentes" (método + body + token)
    F-->>U: Mostra badge "1 pendente"

    Note over U,A: Internet volta

    SW->>SW: Evento "sync" disparado pelo browser
    SW->>IDB: Busca todos os "pendentes"
    loop Para cada pendente
        SW->>A: fetch(método, body, token)
        A-->>SW: 200 OK
        SW->>IDB: Remove item da fila
    end
    SW-->>F: Notifica: pendentes sincronizados
    F-->>U: Remove badge, atualiza dados
```

### 24.4 Diagrama de Componentes — Camadas

```mermaid
graph TB
    subgraph "Camada 1 — Cliente PWA"
        React["React 18 + TypeScript"]
        RHF["React Hook Form + Zod"]
        Recharts["Recharts (gráficos)"]
        SW["Service Worker (Workbox)"]
        IDB["IndexedDB (cache offline)"]
    end

    subgraph "Camada 2 — API REST"
        Express["Express + TypeScript"]
        AuthMW["Middleware Auth"]
        RBAC["Middleware RBAC"]
        LogMW["Middleware Logging"]
        ValidMW["Middleware Validação (Zod)"]
        AuditMW["Middleware Auditoria"]
        Controllers["Controllers"]
        Services["Services"]
    end

    subgraph "Camada 3 — Serviços Auxiliares"
        Python["FastAPI + pandas"]
    end

    subgraph "Camada 4 — Dados"
        PG["PostgreSQL 15"]
        SQLite["SQLite in-memory (dev)"]
    end

    React --> Express
    RHF --> Express
    SW --> IDB
    Express --> AuthMW --> RBAC --> LogMW --> ValidMW --> Controllers
    Controllers --> Services
    Controllers --> AuditMW
    Services --> PG
    Services --> Python
    Services --> SQLite
```

---

## 25. Performance e Escalabilidade

### 25.1 Paginação

Todos os endpoints que retornam listas implementam paginação cursor-based ou offset-based:

```typescript
// Padrão para todos os endpoints de listagem
interface PaginacaoQuery {
  pagina?: number;     // default: 1
  por_pagina?: number; // default: 20, max: 100
}

interface RespostaPaginada<T> {
  dados: T[];
  paginacao: {
    pagina_atual: number;
    por_pagina: number;
    total_registros: number;
    total_paginas: number;
  };
}
```

### 25.2 Limites do IndexedDB

| Navegador | Limite de armazenamento | Observação |
| :--- | :--- | :--- |
| Chrome / Edge | Até 80% do disco | Eviction automático pelo browser se > 60% |
| Firefox | Até 50% do disco | Prompt ao usuário se > 50MB |
| Safari (iOS) | ~1 GB | Dados expiram após 7 dias sem acesso |

**Estratégia de cache no IndexedDB:**
- Manter no máximo os últimos 12 meses de registros em cache.
- Limpar cache de meses com mais de 1 ano automaticamente ao abrir o app.
- Tamanho estimado de 1 ano de dados: < 500KB (muito abaixo de qualquer limite).

### 25.3 Otimizações de Query (PostgreSQL)

```sql
-- Índices já criados nas tabelas (seção 7):
-- idx_pacientes_nome: GIN full-text para busca por nome
-- idx_ev_paciente: B-tree para histórico do paciente
-- idx_ev_mes: B-tree para filtros por período
-- idx_ev_tipo: B-tree para filtros por tipo de evento
-- idx_logs_ts: B-tree DESC para logs recentes
-- idx_audit_ts: B-tree DESC para auditoria recente

-- Query otimizada para o dashboard (usa índice ano/mes UNIQUE)
SELECT * FROM registros_mensais
WHERE ano = $1 AND mes = $2;

-- Busca de pacientes com full-text search
SELECT * FROM pacientes
WHERE to_tsvector('portuguese', nome) @@ plainto_tsquery('portuguese', $1)
  AND ativo = TRUE
ORDER BY nome
LIMIT 10;
```

### 25.4 Estratégia de Cache da API (Service Worker)

| Tipo de recurso | Estratégia | TTL | Justificativa |
| :--- | :--- | :--- | :--- |
| Assets estáticos (JS, CSS, imagens) | Cache First | Indefinido (versionado) | Nunca mudam sem rebuild |
| GET /registros | Stale While Revalidate | 24h | Dados mudam raramente |
| GET /pacientes | Stale While Revalidate | 24h | Lista estável |
| GET /metas | Stale While Revalidate | 7 dias | Mudam anualmente |
| GET /semaforo | Network First | 1h | Precisa ser atual |
| POST / PUT / DELETE | Network Only | — | Nunca cacheado |

### 25.5 Limites e Proteções

| Proteção | Valor | Onde |
| :--- | :--- | :--- |
| Rate limit em `/auth/google` | 20 req / 10 min por IP | Backend (express-rate-limit) |
| Rate limit geral da API | 100 req / min por usuário | Backend |
| Tamanho máximo do body nos logs | 10 KB | Middleware de logging |
| Tamanho máximo do body em requisições | 1 MB | Express `json({ limit })` |
| Timeout de sessão | 10 horas | JWT `expiresIn` |
| Timeout de requisição ao Python | 5 segundos | Axios timeout |
| Máximo de resultados por página | 100 | Middleware de paginação |
| Máximo de registros em exportação XLSX | 120 (10 anos × 12 meses) | Service de exportação |

### 25.6 Monitoramento

- **Health check:** `GET /api/v1/health` retorna `{ status: 'ok', uptime, version, db: 'connected' }`.
- **Métricas de uso:** tabela `api_logs` permite gerar dashboards de uso via queries SQL.
- **Alertas:** configurar alertas no provedor (Render/Railway) para CPU > 80%, memória > 90%, disco > 85%.
- **Logs estruturados:** JSON indexável para integração futura com ELK, Datadog ou similar.
