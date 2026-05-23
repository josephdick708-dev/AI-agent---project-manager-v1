# PEAK-A

Agent IA de cadrage de projet (Next.js 16, Auth.js, Prisma, Google Gemini).

## Structure du projet

```
peak-a/
├── app/                    # App Router (pages + API)
│   ├── api/                # Routes API (chat, sessions, auth…)
│   ├── components/         # UI client (PeakChat)
│   ├── login/ register/    # Auth
│   └── page.tsx            # Accueil (chat)
├── src/lib/                # Logique métier (prisma, agent, docx…)
├── auth.ts / auth.config.ts # NextAuth (credentials + JWT)
├── middleware.ts           # Protection pages + API privées
├── prisma/                 # Schéma + migrations
└── types/                  # Types NextAuth
```

> Le dossier `src/app/` est un ancien squelette **exclu du build** — ne pas y ajouter de routes.

## Variables d'environnement

Copie `.env.example` vers `.env` en local. Sur **Vercel**, configure les mêmes clés dans *Settings → Environment Variables*.

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Oui | PostgreSQL (URL **pooler** en prod, ex. Neon/Supabase) |
| `AUTH_SECRET` | Oui (prod) | Secret Auth.js (`openssl rand -base64 32`) |
| `AUTH_URL` ou `NEXTAUTH_URL` | Oui (prod) | URL publique (`https://ton-app.vercel.app`) |
| `GEMINI_API_KEY` | Oui | Clé API Google AI Studio / Gemini |
| `GEMINI_MODEL` | Non | Modèle (défaut : `gemini-2.0-flash`) |

Alias acceptés : `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_GENERATIVE_AI_MODEL`.

## Développement local

```bash
cd peak-a
npm install
npx prisma migrate dev
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Déploiement Vercel

1. **Importer** le dossier `peak-a` comme racine du projet (ou monorepo avec *Root Directory* = `peak-a`).
2. **Base de données** : créer une base PostgreSQL managée (Neon, Supabase, Vercel Postgres).
   - Utiliser l’URL **pooled** pour `DATABASE_URL`.
3. **Variables** : toutes celles du tableau ci-dessus.
4. **Migrations** (une fois après le premier déploiement) :
   ```bash
   npx prisma migrate deploy
   ```
   Ou en local avec `DATABASE_URL` de prod.
5. **Build** : `npm run build` exécute `prisma generate` puis `next build --webpack` (recommandé avec Next 16 sur Vercel).
6. **Racine Vercel** : définir *Root Directory* = `peak-a` si le dépôt contient aussi un `package-lock.json` à la racine parente.
7. **Durées** : `vercel.json` configure `maxDuration` pour le chat et les routes d’analyse.
8. **Santé** : `GET /api/health` (public) — vérifie DB + auth + clé Gemini sans exposer de secrets.

### Sécurité (déjà en place)

- Middleware : pages privées + **API protégées** (sauf `/api/auth`, `/api/register`, `/api/health`).
- Cookies sécurisés en production (`useSecureCookies`).
- En-têtes HTTP (X-Frame-Options, nosniff, Referrer-Policy…).
- Routes Prisma en **runtime Node.js** (pas Edge).
- Limites de taille sur les requêtes et les conversations.
- Mots de passe hashés (bcrypt, cost 12).

## Scripts utiles

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de dev (webpack) |
| `npm run build` | Build production |
| `npm run db:migrate` | Appliquer les migrations |
| `npm run db:studio` | Interface Prisma |
