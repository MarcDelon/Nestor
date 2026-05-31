# SafeTrip — Guide Complet de Deploiement

Ce guide couvre le deploiement complet du projet **SafeTrip** (frontend Next.js + backend Express.js) en production.

---

## Table des Matieres

1. [Vue d'ensemble de l'architecture](#vue-densemble-de-larchitecture)
2. [Pre-requis](#pre-requis)
3. [Base de donnees — Supabase](#1-base-de-donnees--supabase)
4. [Backend — Render](#2-backend--render)
5. [Frontend — Vercel](#3-frontend--vercel)
6. [Email — Gmail SMTP](#4-email--gmail-smtp)
7. [SMS — Twilio (Optionnel)](#5-sms--twilio-optionnel)
8. [WhatsApp — CallMeBot (Optionnel)](#6-whatsapp--callmebot-optionnel)
9. [Reference des variables d'environnement](#7-reference-des-variables-denvironnement)
10. [Checklist post-deploiement](#8-checklist-post-deploiement)
11. [Identifiants de connexion](#9-identifiants-de-connexion)
12. [Depannage](#10-depannage)

---

## Vue d'ensemble de l'architecture

```
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│   Vercel (Frontend)  │ ───► │  Render (Backend)    │ ───► │   Supabase      │
│   Next.js 16         │ HTTP │  Express + Socket.IO │  SQL │   PostgreSQL    │
│   Port 443 (HTTPS)   │ WS   │  Port 5000           │      │                 │
└─────────────────────┘       └─────────────────────┘       └─────────────────┘
                                       │
                              ┌────────┼────────┐
                              │        │        │
                           Gmail    Twilio  CallMeBot
                           SMTP     SMS     WhatsApp
```

- **Frontend** (Next.js) : Deploye sur **Vercel** (offre gratuite suffisante)
- **Backend** (Express + Socket.IO) : Deploye sur **Render** (offre gratuite suffisante, ou Railway/VPS)
- **Base de donnees** : **Supabase** (offre gratuite — PostgreSQL)
- **Notifications** : Email (Nodemailer/Gmail), SMS (Twilio), WhatsApp (CallMeBot)

> Vercel ne supporte PAS les connexions WebSocket persistantes, c'est pourquoi le backend doit etre heberge separement.

---

## Pre-requis

Avant de commencer, assurez-vous d'avoir :

- Un compte [GitHub](https://github.com) (depot pousse)
- Un compte [Vercel](https://vercel.com) (gratuit)
- Un compte [Render](https://render.com) (gratuit) — ou Railway / VPS
- Un projet [Supabase](https://supabase.com) (gratuit)
- (Optionnel) Un compte Gmail pour le SMTP
- (Optionnel) Un compte [Twilio](https://twilio.com) pour les SMS
- Node.js 18+ installe localement

---

## 1. Base de donnees — Supabase

### 1.1 Creer un projet

1. Allez sur [supabase.com](https://supabase.com) et connectez-vous
2. Cliquez sur **"New Project"**
3. Choisissez un nom (ex : `safetrip`), definissez un mot de passe de base de donnees solide, selectionnez une region proche du Cameroun (ex : `eu-west-1` ou `us-east-1`)
4. Attendez que le projet soit provisionne (~2 minutes)

### 1.2 Executer le schema

1. Dans le tableau de bord Supabase, allez dans **SQL Editor**
2. Ouvrez le fichier `backend/schema.sql` du projet
3. Collez l'integralite du contenu dans l'editeur SQL
4. Cliquez sur **Run** — cela cree les 13 tables :
   - `users`, `clients`, `admins`, `agencies`, `buses`, `journeys`, `passengers`
   - `colis`, `messages`, `service_requests`, `vouchers`, `loyalty_points`, `notifications`

### 1.3 (Optionnel) Donnees de demonstration

Si vous souhaitez des donnees pre-remplies (agences, trajets, bus), executez `backend/seed.sql` dans le meme editeur SQL.

### 1.4 Recuperer vos identifiants

1. Allez dans **Project Settings** > **API**
2. Copiez :
   - **Project URL** — ex : `https://xyzabc.supabase.co`
   - **Service Role Key** (sous `service_role` — la cle secrete, PAS la cle anon)

> Ces valeurs vont dans les variables d'environnement `SUPABASE_URL` et `SUPABASE_SERVICE_KEY`.

---

## 2. Backend — Render

### 2.1 Pousser votre code sur GitHub

Assurez-vous que tout le projet (y compris le dossier `backend/`) est pousse sur GitHub :

```bash
cd C:\Users\PC\Pictures\SALES\safetrip
git add -A
git commit -m "preparation deploiement"
git push origin main
```

### 2.2 Creer un Web Service sur Render

1. Allez sur [render.com](https://render.com) → **Dashboard** → **New** → **Web Service**
2. Connectez votre depot GitHub
3. Configurez :

| Parametre | Valeur |
|---|---|
| **Name** | `safetrip-backend` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (ou Starter a 7$/mois pour un fonctionnement permanent) |

### 2.3 Variables d'environnement

Dans le tableau de bord Render, allez dans **Environment** et ajoutez :

```env
# Obligatoire
PORT=5000
NODE_ENV=production
JWT_SECRET=votre_secret_aleatoire_solide_min_32_caracteres
SUPABASE_URL=https://xyzabc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...votre_cle_service_role

# CORS — URL de votre frontend Vercel (a definir apres le deploiement du frontend)
FRONTEND_ORIGIN=https://safetrip.vercel.app

# Email (Gmail SMTP) — voir Section 4
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_application_gmail

# SMS (Twilio) — optionnel, voir Section 5
# TWILIO_ACCOUNT_SID=ACxxxxx
# TWILIO_AUTH_TOKEN=xxxxx
# TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp (CallMeBot) — optionnel, voir Section 6
# CALLMEBOT_API_KEY=xxxxx
# CALLMEBOT_PHONE_NUMBER=237651529402
```

### 2.4 Deployer

Cliquez sur **Create Web Service**. Render va :
1. Cloner votre depot
2. Executer `npm install && npm run build` dans le dossier `backend/`
3. Demarrer le serveur avec `npm start`

Apres le deploiement, vous obtiendrez une URL du type :
```
https://safetrip-backend.onrender.com
```

### 2.5 Verifier

Visitez `https://safetrip-backend.onrender.com/health` — vous devriez voir :

```json
{
  "status": "success",
  "message": "Le serveur SafeTrip Backend est en pleine forme",
  "supabaseConnected": true,
  "socketIO": true
}
```

> **Remarque** : L'offre gratuite de Render s'eteint apres 15 minutes d'inactivite. La premiere requete apres une periode d'inactivite prend ~30s. Passez au plan Starter (7$/mois) pour un fonctionnement permanent.

---

## 3. Frontend — Vercel

### 3.1 Importer le projet

1. Allez sur [vercel.com](https://vercel.com) → **"Add New..."** → **Project**
2. Importez votre depot GitHub
3. Configurez :

| Parametre | Valeur |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Next.js (detecte automatiquement) |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (par defaut) |
| **Node.js Version** | 18.x ou 20.x |

### 3.2 Variables d'environnement

Ajoutez ceci dans les parametres du projet Vercel → **Environment Variables** :

```env
NEXT_PUBLIC_API_URL=https://safetrip-backend.onrender.com
```

> Remplacez par l'URL reelle de votre backend Render obtenue a l'etape 2.4.

### 3.3 Deployer

Cliquez sur **Deploy**. Vercel va compiler et deployer le frontend Next.js.

Apres le deploiement, vous obtiendrez une URL du type :
```
https://safetrip.vercel.app
```

### 3.4 Mettre a jour le CORS du backend

Retournez sur **Render** → votre service backend → **Environment** → mettez a jour :

```env
FRONTEND_ORIGIN=https://safetrip.vercel.app
```

> Si vous avez un nom de domaine personnalise, incluez les deux :
> ```
> FRONTEND_ORIGIN=https://safetrip.vercel.app,https://www.safetrip.cm
> ```

Render va automatiquement redeployer apres la modification des variables d'environnement.

### 3.5 Nom de domaine personnalise (Optionnel)

1. Dans Vercel → Projet → **Settings** → **Domains**
2. Ajoutez votre domaine (ex : `safetrip.cm`)
3. Suivez les instructions DNS de Vercel (ajoutez un enregistrement CNAME ou A chez votre registrar)

---

## 4. Email — Gmail SMTP

SafeTrip utilise Nodemailer pour envoyer :
- Des emails de bienvenue a l'inscription
- Des emails de confirmation de reservation avec les details du billet
- Des emails de notification de livraison de colis

### 4.1 Creer un mot de passe d'application Gmail

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. **Securite** → **Validation en deux etapes** (activez si ce n'est pas deja fait)
3. **Securite** → **Mots de passe des applications** (ou cherchez "Mots de passe des applications")
4. Selectionnez l'application : **Mail**, Selectionnez l'appareil : **Autre** (tapez "SafeTrip")
5. Cliquez sur **Generer** — copiez le mot de passe de 16 caracteres

### 4.2 Definir les variables d'environnement

Sur Render (backend) :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop    # le mot de passe de 16 caracteres (sans espaces)
```

### 4.3 Tester

Reservez un billet en tant qu'utilisateur connecte — vous devriez recevoir un email de confirmation a l'adresse email de l'utilisateur.

---

## 5. SMS — Twilio (Optionnel)

SafeTrip envoie des SMS pour :
- Les confirmations de reservation
- Les notifications de livraison de colis

### 5.1 Creer un compte Twilio

1. Allez sur [twilio.com](https://www.twilio.com) → Inscrivez-vous
2. Obtenez un **numero de telephone d'essai** (l'offre gratuite vous donne 15$ de credit)
3. Copiez depuis le tableau de bord :
   - **Account SID** (commence par `AC`)
   - **Auth Token**
   - **Numero de telephone** (ex : `+12345678900`)

### 5.2 Definir les variables d'environnement

Sur Render (backend) :

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+12345678900
```

### 5.3 Limitations de l'essai

En mode essai Twilio :
- Vous ne pouvez envoyer des SMS qu'aux **numeros de telephone verifies** (ajoutez-les dans la console Twilio)
- Les messages incluent un prefixe "Sent from your Twilio trial account"
- Passez a un forfait payant (~1$/mois + 0,0079$/SMS) pour la production

> Si Twilio n'est pas configure, les SMS sont ignores silencieusement — l'application fonctionne parfaitement sans.

---

## 6. WhatsApp — CallMeBot (Optionnel)

SafeTrip utilise CallMeBot pour envoyer des messages WhatsApp lors des demandes de devis de location de bus.

### 6.1 Configurer CallMeBot

1. Envoyez ce message WhatsApp au `+34 644 71 83 40` :
   ```
   I allow callmebot to send me messages
   ```
2. Vous recevrez une cle API en reponse
3. Definissez les variables d'environnement :

```env
CALLMEBOT_API_KEY=votre_cle_api
CALLMEBOT_PHONE_NUMBER=237651529402    # votre numero WhatsApp
```

> Si non configure, un lien de secours `wa.me` est retourne a l'utilisateur a la place.

---

## 7. Reference des variables d'environnement

### Backend (Render)

| Variable | Obligatoire | Description |
|---|---|---|
| `PORT` | Oui | Port du serveur (par defaut : `5000`) |
| `NODE_ENV` | Oui | `production` |
| `JWT_SECRET` | Oui | Secret pour les tokens JWT (min 32 caracteres) |
| `SUPABASE_URL` | Oui | URL du projet Supabase |
| `SUPABASE_SERVICE_KEY` | Oui | Cle service role de Supabase |
| `FRONTEND_ORIGIN` | Oui | URL du frontend Vercel (separees par des virgules pour plusieurs) |
| `SMTP_HOST` | Non | Serveur SMTP (par defaut : `smtp.gmail.com`) |
| `SMTP_PORT` | Non | Port SMTP (par defaut : `587`) |
| `SMTP_SECURE` | Non | `true` pour le port 465, `false` pour 587 |
| `SMTP_USER` | Non | Adresse email d'envoi |
| `SMTP_PASS` | Non | Mot de passe email / mot de passe d'application |
| `TWILIO_ACCOUNT_SID` | Non | Account SID Twilio |
| `TWILIO_AUTH_TOKEN` | Non | Auth Token Twilio |
| `TWILIO_PHONE_NUMBER` | Non | Numero de telephone d'envoi Twilio |
| `CALLMEBOT_API_KEY` | Non | Cle API CallMeBot WhatsApp |
| `CALLMEBOT_PHONE_NUMBER` | Non | Numero de telephone WhatsApp destinataire |

### Frontend (Vercel)

| Variable | Obligatoire | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Oui | URL du backend (ex : `https://safetrip-backend.onrender.com`) |

---

## 8. Checklist post-deploiement

Apres le deploiement du frontend et du backend :

- [ ] Visitez `https://votre-backend.onrender.com/health` — devrait afficher `supabaseConnected: true`
- [ ] Visitez votre URL Vercel — la page d'accueil devrait se charger avec les agences
- [ ] **Test de connexion** : Connectez-vous avec `admin@safetrip.cm` / `admin123`
- [ ] **Test de reservation** : Reservez un billet avec `client@safetrip.cm` — verifiez que l'email arrive
- [ ] **Tableau de bord admin** : Verifiez les onglets agences et bons de reduction
- [ ] **Tableau de bord agence** : Connectez-vous avec `agency@safetrip.cm`, verifiez que la messagerie fonctionne
- [ ] **Temps reel** : Ouvrez deux onglets (client + agence), envoyez un message — il devrait apparaitre instantanement via Socket.IO
- [ ] **Mobile** : Testez sur telephone — le design responsive devrait fonctionner
- [ ] **CORS** : Si vous obtenez des erreurs CORS, verifiez que `FRONTEND_ORIGIN` correspond exactement a votre URL Vercel (y compris `https://`)

---

## 9. Identifiants de connexion

### Comptes simules (Developpement/Demo)

| Role | Email | Mot de passe |
|---|---|---|
| Administrateur | `admin@safetrip.cm` | `admin123` |
| Client | `client@safetrip.cm` | `client123` |
| Agence (Touristique Express) | `agency@safetrip.cm` | `agency123` |
| Agence (Buca Voyages) | `buca@safetrip.cm` | `buca123` |
| Agence (Finesse Express) | `finesse@safetrip.cm` | `finesse123` |
| Agence (Vatican Express) | `vatican@safetrip.cm` | `vatican123` |
| Agence (Musango Express) | `musango@safetrip.cm` | `musango123` |

> Ces comptes sont codes en dur dans `backend/src/controllers/authController.ts` pour le developpement. En production, les vrais utilisateurs s'inscrivent via le formulaire d'inscription et sont stockes dans Supabase.

---

## 10. Depannage

### "Not allowed by CORS"
- Assurez-vous que `FRONTEND_ORIGIN` sur Render correspond exactement a votre URL Vercel (ex : `https://safetrip.vercel.app`)
- Pas de slash final
- Doit inclure le protocole (`https://`)

### Le backend retourne 503 / "Base de donnees non disponible"
- Verifiez que `SUPABASE_URL` et `SUPABASE_SERVICE_KEY` sont correctement definis sur Render
- Verifiez que le projet Supabase n'est pas en pause (l'offre gratuite se met en pause apres 7 jours d'inactivite — reactivez depuis le tableau de bord)

### Les emails ne s'envoient pas
- Verifiez que `SMTP_USER` et `SMTP_PASS` sont definis
- Pour Gmail : vous DEVEZ utiliser un **Mot de passe d'application**, pas votre mot de passe habituel
- Consultez les logs Render pour les entrees `[MAILER]`

### Socket.IO ne se connecte pas
- Ouvrez les outils de developpement du navigateur → Onglet Reseau → WS
- Verifiez que le WebSocket se connecte a l'URL de votre backend
- L'offre gratuite de Render peut necessiter un moment pour se reveiller

### L'offre gratuite de Render est lente
- La premiere requete apres une periode d'inactivite prend ~30 secondes (demarrage a froid)
- Passez au plan Starter (7$/mois) pour un fonctionnement permanent
- Alternative : utilisez [Railway](https://railway.app) qui a des demarrages a froid plus rapides

### Le build echoue sur Vercel
- Assurez-vous que le **Root Directory** est defini sur `frontend`
- Verifiez que `NEXT_PUBLIC_API_URL` est defini
- En cas d'erreur turbopack, le `next.config.ts` a deja `turbopack.root: process.cwd()` configure

### Tables Supabase manquantes
- Re-executez `backend/schema.sql` dans l'editeur SQL de Supabase
- Verifiez les messages d'erreur lors de l'execution

---

## Hebergements alternatifs pour le backend

Si Render ne vous convient pas :

| Plateforme | Offre gratuite | WebSocket | Toujours actif |
|---|---|---|---|
| [Render](https://render.com) | Oui (s'eteint) | Oui | 7$/mois |
| [Railway](https://railway.app) | 5$ de credit/mois | Oui | Oui |
| [Fly.io](https://fly.io) | Oui (limite) | Oui | Oui |
| [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform) | Non | Oui | 5$/mois |
| VPS (n'importe quel fournisseur) | Variable | Oui | Oui |

---

## Resume rapide du deploiement

```
1. Supabase  → Creer le projet, executer schema.sql, copier URL + cle service
2. Render    → Deployer backend/, definir les variables d'env, obtenir l'URL du backend
3. Vercel    → Deployer frontend/, definir NEXT_PUBLIC_API_URL avec l'URL du backend
4. Render    → Mettre a jour FRONTEND_ORIGIN avec l'URL Vercel
5. Tester    → Connexion, reservation de billet, verifier l'email, verifier le temps reel
```

Temps total : ~30 minutes.
