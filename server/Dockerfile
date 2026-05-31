# --- Backend: Socket.IO + Express (eseguito via tsx) ---
FROM node:20-alpine

WORKDIR /app

# Installa solo le dipendenze di runtime (tsx è tra le dependencies).
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start"]
