# Supabase Database Setup

Ce dossier contient les migrations et scripts nécessaires pour configurer la base de données Supabase.

## Déploiement du schéma

### 1. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Noter l'URL du projet et les clés API (anon key et service role key)
4. Ajouter ces valeurs dans `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 2. Déployer le schéma principal

1. Ouvrir le SQL Editor dans le dashboard Supabase
2. Copier le contenu de `database-v2.sql` (à la racine du projet)
3. Exécuter le script complet
4. Vérifier que toutes les tables sont créées (23 tables au total)

### 3. Déployer les migrations supplémentaires

1. Exécuter le fichier `migrations/001_rls_policies_and_triggers.sql` dans le SQL Editor
2. Ce fichier ajoute :
   - Le trigger `on_profile_status_change`
   - Les politiques RLS pour le rôle AGENT
   - Les données de seed (produits, étapes, types de documents)

3. Exécuter le fichier `migrations/003_users_can_create_dossiers.sql` dans le SQL Editor
4. Ce fichier ajoute :
   - La politique RLS permettant aux utilisateurs de créer leurs propres dossiers
   - La politique RLS permettant aux utilisateurs de mettre à jour leurs dossiers
   - La politique RLS permettant aux utilisateurs de créer des step_instances

### 4. Créer un compte agent de test

1. Aller dans Authentication > Users dans le dashboard Supabase
2. Créer un nouvel utilisateur avec email et mot de passe
3. Noter l'UUID de l'utilisateur créé
4. Exécuter dans le SQL Editor :
   ```sql
   -- Créer l'agent dans la table agents
   INSERT INTO agents (id, email, name, active)
   VALUES (
     'UUID_DE_L_UTILISATEUR',
     'agent@example.com',
     'Agent Test',
     true
   );
   ```

### 5. Vérifier la connexion

1. Démarrer le serveur de développement : `pnpm dev`
2. Accéder à `http://localhost:3000/api/test-db`
3. Vérifier que la réponse indique "Database connection successful"

## Structure des migrations

- `001_rls_policies_and_triggers.sql` : Politiques RLS pour AGENT, trigger profile status, seed data
- `002_handle_new_user.sql` : Gestion des nouveaux utilisateurs
- `003_users_can_create_dossiers.sql` : Politiques RLS pour permettre aux utilisateurs de créer leurs dossiers

## Notes importantes

- Les politiques RLS sont activées sur toutes les tables utilisateur
- Le service role (SUPABASE_SERVICE_ROLE_KEY) contourne toutes les politiques RLS
- Les utilisateurs normaux ne peuvent voir que leurs propres données
- Les agents peuvent voir toutes les données et créer des reviews
