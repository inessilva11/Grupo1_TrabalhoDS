# Grupo1_TrabalhoDS
O presente README.md apresenta sucintamente as principais informações sobre a aplicação desenvolvida na Unidade Curricular de Desenvolvimento de Software. Esta aplicação tem como base a arquitetura e design criadas na fase anterior do projeto, usando Express, SQLite e a organização MVC + Service, usando como referência o projeto das aulas `MEDCIDS/DSS-MVC`.

```text
saudinob-mvc-app/
├── public/                                             # View: HTML, CSS e JavaScript do browser
|   ├── index.html                                      # Estrutura base da interface web
|   ├── css/                                            # Definição de aspeto visual da aplicação
|   ├── js/                                             # Ponte entre interface HTML e a API do backend         
├── src/              
│   ├── server.js                                       # Motor Express da aplicação
│   ├── routes/                                         # Portas da API
│   ├── controllers/                                    # Recebem pedidos e devolvem respostas
│   ├── services/                                       # Regras de negócio
│   ├── models/                                         # Modelos e regras de validação
│   ├── mappers/                                        # Conversão para recursos FHIR
│   ├── database/                                       # SQLite store e seed
│   └── utils/                                          # Helpers HTTP e autenticação
├── data/saudinob.sqlite                                # Base de dados SQLite criada ao arrancar
├── SauDInoB API.postman_collection.json                # Coleção de testes Postman para funcionalidades da aplicação
├── .gitignore                                          # Impede ficheiros desnecessários no Git
├── README.md                                           
├── package-lock.json                                   # Guarda versões das dependências para garantir reprodutibilidade 
└── package.json                                        # Configuração principal do projeto Node.js
```

## Como correr

```bash
node src/server.js
```

Depois abrir:

```text
http://localhost:3000
```

## Contas de demonstração

| Perfil | Email | Password |
| --- | --- | --- |
| Utente | `utente@saudinob.pt` | `utente123` |
| Medico | `medico@saudinob.pt` | `medico123` |
| Administrador | `admin@saudinob.pt` | `admin123` |

## Persistência SQLite

O ficheiro ativo é:

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

A aliacação utiliza SQLite como base de dados local. Na priemira inicialização, caso a base ainda não exista, o sistema cria automaticamente as tabelas e os dados iniciais.

## Funcionalidades implementadas

- Login com JWT, `me` e `logout`.
- Perfis de Utente, Medico e Administrador.
- Dashboard do Utente com histórico CARAT, gráfico, alertas, recomendações e perfil editável.
- Filtros no Dashboard do Utente por datas, interpretação e intervalo de score.
- Submissão real do questionário CARAT com validação, score total, sub-scores e interpretação clínica.
- Registo autónomo de sintomas associados ao utente e, opcionalmente, a uma avaliação CARAT.
- Geração automática de alertas quando o score fica abaixo do limiar ou deteriora face a avaliação anterior.
- Dashboard do Médico com lista de utentes, histórico, alertas, medicação e exames.
- Gestão pelo Médico do ciclo de vida do alerta: `NOVO`, `VISTO`, `EM_SEGUIMENTO`, `FECHADO`.
- Consola do Administrador com configuração de limiares, criação de utentes/medicos, auditoria e reset de dados simulados.
- Servidor Express com rotas organizadas através de `express.Router`, `express.json` e frontend estático em `public`.
- Interoperabilidade FHIR simplificada em JSON.

## Endpoints principais

| Metodo | URL | Descricao |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Iniciar sessão |
| `GET` | `/api/auth/me` | Validar token e obter utilizador atual |
| `POST` | `/api/auth/logout` | Terminar sessão |
| `GET` | `/api/carat/questions` | Obter perguntas CARAT |
| `POST` | `/api/carat/avaliacoes` | Submeter avaliação CARAT |
| `GET/POST` | `/api/sintomas` | Listar e registar sintomas |
| `PATCH` | `/api/sintomas/:id` | Atualizar sintoma |
| `GET` | `/api/dashboard/utente/:id` | Dashboard do utente |
| `GET` | `/api/dashboard/medico/:id` | Dashboard do medico |
| `GET` | `/api/dashboard/admin` | Dashboard administrativo |
| `PATCH` | `/api/alertas/:id` | Atualizar alertas |
| `GET/POST` | `/api/utentes` | Listar e criar utentes |
| `GET/POST` | `/api/medicos` | Listar e criar medicos |
| `GET/POST` | `/api/exames` | Listar e prescrever exames |
| `GET/POST` | `/api/medicacoes` | Listar e registar medicação |
| `GET/PATCH` | `/api/admin/configuracao` | Ver e alterar limiares |
| `GET` | `/api/fhir/observations` | Listar Observations CARAT - representação simplificada de Observation |
| `GET` | `/api/fhir/observations?patient=utente-1` | Filtrar Observations por utente |
| `GET` | `/api/fhir/observations/carat-1` | Obter uma Observation CARAT |

Os endpoints protegidos usam:

```http
Authorization: Bearer <token devolvido no login>
```

## Autenticacao JWT

O login devolve um JWT assinado com HS256. O token inclui `email`, `sub`, `role`, `sid`, `iat` e `exp`.

A tabela SQLite `sessions` guarda os JWT ativos para permitir revogação no logout e invalidação de sessões expiradas.