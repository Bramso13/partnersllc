# Partners LLC - Application de Gestion de Dossiers

Application Next.js pour la gestion de dossiers et paiements pour Partners LLC.

## Prérequis

- Node.js 18+ 
- pnpm 8.x (gestionnaire de paquets)

## Installation

1. Cloner le repository
2. Installer les dépendances :

```bash
pnpm install
```

3. Configurer les variables d'environnement :

```bash
cp .env.example .env.local
```

Puis éditer `.env.local` avec vos valeurs réelles pour :
- Supabase (URL, clés anon et service role)
- Stripe (clés API)
- Configuration email/SMS/WhatsApp (pour les notifications)

## Scripts Disponibles

- `pnpm dev` - Démarrer le serveur de développement sur http://localhost:3000
- `pnpm build` - Construire l'application pour la production
- `pnpm start` - Démarrer le serveur de production
- `pnpm lint` - Vérifier le code avec ESLint
- `pnpm lint:fix` - Corriger automatiquement les erreurs ESLint
- `pnpm format` - Formater le code avec Prettier
- `pnpm format:check` - Vérifier le formatage sans modifier les fichiers
- `pnpm type-check` - Vérifier les types TypeScript sans compiler

## Structure du Projet

```
partnersllc-app/
├── app/                    # Routes Next.js (App Router)
│   ├── (public)/          # Routes publiques (login, register)
│   ├── (protected)/       # Routes protégées (dashboard, dossiers)
│   ├── api/               # API routes
│   ├── layout.tsx         # Layout racine
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React réutilisables
│   ├── ui/               # Composants UI de base
│   └── features/         # Composants spécifiques aux features
├── lib/                   # Utilitaires et helpers
│   ├── supabase/         # Clients Supabase (server/client)
│   └── utils/            # Fonctions utilitaires
├── types/                 # Définitions TypeScript
├── styles/                # Styles globaux additionnels
└── public/                # Assets statiques
```

## Stack Technique

- **Framework:** Next.js 16.x avec App Router
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4.x avec design tokens personnalisés
- **Base de données:** Supabase (PostgreSQL)
- **Authentification:** Supabase Auth
- **Paiements:** Stripe
- **Package Manager:** pnpm 8.x
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky (pre-commit: lint + type-check)

## Design System

### Couleurs

- **Background principal:** `#191A1D`
- **Surface:** `#2D3033`
- **Bordure:** `#363636`
- **Texte primaire:** `#F9F9F9`
- **Texte secondaire:** `#B7B7B7`
- **Accent (Cyan):** `#00F0FF`
- **Succès (Vert):** `#4ADE80`
- **Avertissement (Jaune):** `#FACC15`
- **Danger (Rouge):** `#F95757`

### Typographie

- **Police:** Inter (Google Fonts)
- **Icônes:** Font Awesome 6.4.0

## Développement

Le projet utilise des hooks Git (Husky) pour s'assurer que le code est linté et typé avant chaque commit.

Pour désactiver temporairement les hooks :
```bash
git commit --no-verify
```

## Déploiement

L'application est déployée sur Vercel. Les variables d'environnement doivent être configurées dans le dashboard Vercel.

## Support

Pour toute question, contactez l'équipe de développement.
