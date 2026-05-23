# PEAK-A

Agent IA de cadrage de projet (Next.js 16, Auth.js, Prisma, Google Gemini).

## Structure du projet

**Une seule racine** : ouvre le dossier `PEAK-A` dans Cursor (pas de sous-dossier `peak-a/`).

```
PEAK-A/                     # ← racine Git + Vercel
├── app/                    # Pages + API Next.js
├── src/lib/                # Logique métier (prisma, gemini, docx…)
├── prisma/                 # Schéma + migrations
├── docs/                   # Documents projet (roadmap, notes…)
├── auth.ts / middleware.ts
└── package.json
```

> `src/app/` est un ancien squelette **exclu du build** — ne pas y ajouter de routes.

## Variables d'environnement

Copie `.env.example` vers `.env` en local. Sur **Vercel**, configure les mêmes clés dans *Settings → Environment Variables*.

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Oui | PostgreSQL (URL **pooler** en prod, ex. Neon/Supabase) |
| `AUTH_SECRET` | Oui (prod) | Secret Auth.js (`openssl rand -base64 32`) |
| `AUTH_URL` ou `NEXTAUTH_URL` | Oui (prod) | URL publique (`https://ton-app.vercel.app`) |
| `GEMINI_API_KEY` | Oui | Clé API Google AI Studio / Gemini |
| `GEMINI_MODEL` | Non | Modèle (défaut : `gemini-2.5-flash`) |

Alias acceptés : `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_GENERATIVE_AI_MODEL`.

## Développement local

```bash
npm install
npx prisma migrate dev
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Déploiement Vercel

1. **Importer** le dépôt GitHub — *Root Directory* : laisser vide (`.` = racine du repo).
2. **Base de données** : créer une base PostgreSQL managée (Neon, Supabase, Vercel Postgres).
   - Utiliser l’URL **pooled** pour `DATABASE_URL`.
3. **Variables** : toutes celles du tableau ci-dessus.
4. **Migrations** (une fois après le premier déploiement) :
   ```bash
   npx prisma migrate deploy
   ```
   Ou en local avec `DATABASE_URL` de prod.
5. **Build** : `npm run build` exécute `prisma generate` puis `next build --webpack` (recommandé avec Next 16 sur Vercel).
6. **Git** : toujours `git push origin main` depuis la racine `PEAK-A` (un seul dépôt).
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
