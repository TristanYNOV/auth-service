# Étape 1 : Construction de l'application
FROM node:20 AS builder

# Définition du dossier de travail
WORKDIR /usr/src/app

# Copie des fichiers nécessaires
COPY package.json package-lock.json ./

# Installation des dépendances
RUN npm install --legacy-peer-deps

# Copie du code source
COPY . .

# Compilation du projet
RUN npm run build

# Étape 2 : Exécution de l'application en production
FROM node:20 AS runner

WORKDIR /usr/src/app

# Copie du build depuis l’étape précédente
COPY --from=builder /usr/src/app/dist ./dist
COPY package.json package-lock.json ./

# Réinstallation des dépendances en mode production uniquement
RUN npm install --only=production

# Définition de la variable d'environnement
ENV NODE_ENV=production

# Exposition du port de l'API
EXPOSE 3000

# Commande de démarrage de l'application
CMD ["node", "dist/main"]
