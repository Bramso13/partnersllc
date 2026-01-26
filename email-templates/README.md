# Templates d'emails Supabase

Ce dossier contient les templates d'emails pour l'authentification Supabase.

## Configuration dans Supabase

### 1. Accéder aux templates d'emails

1. Connectez-vous à votre projet Supabase
2. Allez dans **Authentication** → **Email Templates**

### 2. Configurer le template "Reset Password"

1. Sélectionnez **"Reset Password"** dans la liste des templates
2. Copiez le contenu du fichier `reset-password.html`
3. Collez-le dans l'éditeur de template Supabase
4. Cliquez sur **Save**

### Variables disponibles

Supabase fournit automatiquement ces variables dans les templates :

- `{{ .ConfirmationURL }}` - URL de confirmation avec le token de réinitialisation
- `{{ .Token }}` - Token de réinitialisation (si vous voulez construire votre propre URL)
- `{{ .TokenHash }}` - Hash du token
- `{{ .SiteURL }}` - URL de votre site configurée dans Supabase
- `{{ .Email }}` - Email de l'utilisateur

### Configuration de l'URL de redirection

Dans **Authentication** → **URL Configuration**, assurez-vous que :

- **Site URL** : `https://votredomaine.com` (ou `http://localhost:3000` pour le dev)
- **Redirect URLs** : Ajoutez `https://votredomaine.com/reset-password` dans la liste des URLs autorisées

### Personnalisation

Pour personnaliser le template :

1. Modifiez les couleurs dans les styles inline
2. Changez le logo/texte "PartnersLLC" par votre marque
3. Adaptez le texte selon vos besoins
4. Modifiez l'email de support

### Tester l'email

1. Allez sur `/forgot-password` dans votre application
2. Entrez votre email
3. Vérifiez votre boîte de réception
4. Cliquez sur le bouton pour tester le flux complet

## Autres templates disponibles

Vous pouvez créer d'autres templates dans ce dossier pour :

- **Confirm Signup** - Email de confirmation d'inscription
- **Invite User** - Email d'invitation utilisateur
- **Magic Link** - Email de lien magique pour connexion sans mot de passe
- **Change Email** - Email de confirmation de changement d'email

## Support

Pour toute question sur la configuration des emails Supabase :
- [Documentation Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
