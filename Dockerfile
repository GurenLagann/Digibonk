# Ambiente de desenvolvimento do DigiBonk: Vite com hot reload.
# O código entra por bind mount (docker-compose.yml); só o node_modules fica na imagem.
FROM node:24-alpine

WORKDIR /app

# Usuário node (uid 1000) = mesmo dono dos arquivos no host.
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json .npmrc ./
RUN npm ci

EXPOSE 5173

# --host 0.0.0.0 sobrescreve o host 127.0.0.1 do vite.config.ts para o Traefik alcançar o servidor.
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
