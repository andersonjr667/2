# Sistema de Gerenciamento de Membros

Sistema web para gerenciamento de membros da igreja, com recursos de controle de presença e notificações via WhatsApp.

## Funcionalidades

- ✅ Autenticação de usuários (admin/comum)
- ✅ Gerenciamento de membros (CRUD)
- ✅ Controle de presenças
- ✅ Registro de ausências e justificativas
- ✅ Notificações via WhatsApp
- ✅ Dashboard com estatísticas
- ✅ Exportação de dados
- ✅ Painel administrativo

## Requisitos

- Node.js 18+
- MongoDB 6+
- WhatsApp ativo no celular (para notificações)

## Configuração

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd [nome-da-pasta]
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com:
```env
MONGO_URI=sua-uri-do-mongodb
JWT_SECRET=seu-segredo-jwt
PORT=3000
```

4. Inicialize o banco de dados:
```bash
npm run init-db
```
- Isso criará um usuário admin padrão:
  - Email: admin@church.com
  - Senha: admin123

⚠️ Importante: Troque a senha do admin após o primeiro login!

## Executando o Projeto

Desenvolvimento:
```bash
npm run dev
```

Produção:
```bash
npm start
```

## Estrutura do Projeto

```
├── models/          # Modelos do MongoDB
├── public/          # Arquivos estáticos
│   ├── js/         # Scripts do frontend
│   ├── styles/     # Arquivos CSS
│   └── pages/      # Páginas HTML
├── routes/         # Rotas da API
└── utils/          # Utilitários
```

## Integração WhatsApp

Ao iniciar o servidor pela primeira vez:
1. Um QR Code será exibido no terminal
2. Escaneie com o WhatsApp do número que enviará as notificações
3. Aguarde a mensagem de confirmação

## Agendamento de Notificações

- As notificações são enviadas automaticamente aos domingos às 20h
- São notificados membros ausentes por 2+ semanas consecutivas
- O sistema registra todas as tentativas de notificação

## Segurança

- Autenticação via JWT
- Senhas criptografadas com bcrypt
- Proteção contra CSRF e XSS
- Validação de dados em todas as rotas

## Contato

Para suporte ou dúvidas, entre em contato através do email: [seu-email]
