# API Gateway

Gateway HTTP para rotear requisicoes para os servicos de dominio.

## Scripts

- npm run dev
- npm run build
- npm run start

## Variaveis de ambiente

- PORT (default 3333)
- AUTH_SERVICE_PORT (default 3334)
- CLIENTS_SERVICE_PORT (default 3335)
- PETITIONS_SERVICE_PORT (default 3336)
- SESSION_SECRET
- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (store de sessao)
- FRONTEND_URL

## Publicar como novo repositorio

1. git init
2. git add .
3. git commit -m "init api-gateway"
4. git branch -M main
5. git remote add origin <URL_DO_REPO>
6. git push -u origin main
