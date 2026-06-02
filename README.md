# Grupo1_TrabalhoDS
Aplicação funcional criada a partir do ficheiro `Trabalho Grupo 1.pdf`, usando Express, SQLite e a organizacao MVC + Service, usando como referência o projeto das aulas `DSS-MVC`.

```text
saudinob-mvc-app/
├── public/                  # View: HTML, CSS e JavaScript do browser
├── src/
│   ├── app.js               # Motor Express da aplicacao
│   ├── routes/              # Portas da API
│   ├── controllers/         # Recebem pedidos e devolvem respostas
│   ├── services/            # Regras de negocio
│   ├── models/              # Modelos e regras de validacao
│   ├── mappers/             # Conversao para recursos FHIR
│   ├── database/            # SQLite store e seed
│   └── utils/               # Helpers HTTP e autenticacao
├── data/saudinob.sqlite     # Base de dados SQLite criada ao arrancar
├── scripts/smoke-test.js    # Teste rapido dos endpoints principais
└── package.json
```

## Como correr

```bash
node src/app.js
```

Depois abrir:

```text
http://localhost:3000
```

Também pode correr o teste rápido:

```bash
node scripts/smoke-test.js
```

## Contas de demonstração

| Perfil | Email | Password |
| --- | --- | --- |
| Utente | `utente@saudinob.pt` | `utente123` |
| Medico | `medico@saudinob.pt` | `medico123` |
| Administrador | `admin@saudinob.pt` | `admin123` |

## PersistÊncia SQLite

A persistência deixou de usar JSON como base de dados. O ficheiro ativo e:

```text
data/saudinob.sqlite
```

A store SQLite cria tabelas relacionais com chaves primérias e estrangeiras para:

- `users`
- `utentes`
- `medicos`
- `administradores`
- `configuracao`
- `caratAvaliacoes`
- `sintomas`
- `alertas`
- `medicacoes`
- `exames`
- `sessions`
- `auditoria`

Se existir um ficheiro legado `data/db.json` e a base SQLite estiver vazia, a aplicação tenta importar esses dados automaticamente na primeira inicialização.

## Funcionalidades implementadas

- Login com JWT, `me` e `logout`.
- Perfis de Utente, Medico e Administrador.
- Dashboard do Utente com histórico CARAT, grafico, alertas, recomendações e perfil editavel.
- Filtros no Dashboard do Utente por datas, interpretação e intervalo de score.
- Submissao real do questionário CARAT com validação, score total, sub-scores e interpretação clínica.
- Registo autónomo de sintomas associados ao utente e, opcionalmente, a uma avaliação CARAT.
- Geração automática de alertas quando o score fica abaixo do limiar ou deteriora face a avaliação anterior.
- Dashboard do Médico com lista de utentes, histórico, alertas, medicação e exames.
- Ciclo de vida do alerta: `NOVO`, `VISTO`, `EM_SEGUIMENTO`, `FECHADO`.
- Consola do Administrador com configuração de limiares, criação de utentes/medicos, auditoria e reset de dados simulados.
- Servidor Express com `express.Router`, `express.json` e frontend estatico em `public`.
- Interoperabilidade FHIR simplificada em JSON, semelhante a referencia DSS-MVC: apenas `GET /api/fhir/observations`.

## Endpoints principais

| Metodo | URL | Descricao |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Iniciar sessao |
| `GET` | `/api/auth/me` | Validar token e obter utilizador atual |
| `POST` | `/api/auth/logout` | Terminar sessao |
| `GET` | `/api/carat/questions` | Obter perguntas CARAT |
| `POST` | `/api/carat/avaliacoes` | Submeter avaliacao CARAT |
| `GET/POST` | `/api/sintomas` | Listar e registar sintomas |
| `PATCH` | `/api/sintomas/:id` | Atualizar sintoma |
| `GET` | `/api/dashboard/utente/:id` | Dashboard do utente |
| `GET` | `/api/dashboard/medico/:id` | Dashboard do medico |
| `GET` | `/api/dashboard/admin` | Dashboard administrativo |
| `GET/PATCH` | `/api/alertas/:id` | Consultar e atualizar alertas |
| `GET/POST` | `/api/utentes` | Listar e criar utentes |
| `GET/POST` | `/api/medicos` | Listar e criar medicos |
| `GET/POST` | `/api/exames` | Listar e prescrever exames |
| `GET/POST` | `/api/medicacoes` | Listar e registar medicacao |
| `GET/PATCH` | `/api/admin/configuracao` | Ver e alterar limiares |
| `GET` | `/api/fhir/observations` | Listar Observations CARAT em formato DTO |
| `GET` | `/api/fhir/observations?patient=utente-1` | Filtrar Observations por utente |
| `GET` | `/api/fhir/observations/carat-1` | Obter uma Observation CARAT |

Os endpoints protegidos usam:

```http
Authorization: Bearer <token devolvido no login>
```

## Autenticacao JWT

O login devolve um JWT assinado com HS256. O token inclui `sub`, `role`, `sid`, `iat` e `exp`.

A tabela SQLite `sessions` guarda os JWT ativos para permitir revogação no logout e invalidação de sessões expiradas.

Para produção, definir um segredo próprio:

```bash
set JWT_SECRET=um-segredo-forte
node src/app.js
```