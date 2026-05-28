# RAPPORT D'AUDIT COMPLET — SafeTrip
> Date : 27 Mai 2026 | Analysé par Claude Code | Version du projet : MVP/Demo

---

## RÉSUMÉ EXÉCUTIF

| Catégorie | Nombre |
|---|---|
| Bugs critiques | 5 |
| Bugs modérés | 8 |
| Fonctionnalités manquantes | 23 |
| Problèmes de sécurité | 6 |
| Problèmes d'architecture | 9 |
| **TOTAL** | **51 points à traiter** |

---

## PARTIE 1 — BUGS (ERREURS DE CODE)

### 🔴 BUGS CRITIQUES

---

#### BUG-01 — Collision de clé localStorage `safetrip_journeys`
**Fichiers :** `frontend/src/app/reserver/confirmer/page.tsx:154` et `frontend/src/app/reserver/page.tsx:333`  
**Sévérité :** CRITIQUE — provoque un crash silencieux de la page réservation

La même clé localStorage `safetrip_journeys` est utilisée pour deux structures de données complètement différentes :

- Dans `reserver/page.tsx:333` : stocke un **tableau de trajets** (`Journey[]`) comme cache de l'API
- Dans `confirmer/page.tsx:154` : stocke un **tableau de billets** (`Billet[]`) comme historique d'achats

```ts
// reserver/page.tsx:333 — écrit des Journey[] dans safetrip_journeys
localStorage.setItem("safetrip_journeys", JSON.stringify(formatted));

// confirmer/page.tsx:154 — ÉCRASE avec des Billet[] dans la même clé
localStorage.setItem("safetrip_journeys", JSON.stringify([newTicket, ...currentHist]));
```

**Conséquence :** Après une réservation, si l'API est offline, `reserver/page.tsx:339` relit cette clé et essaie d'afficher des objets `Billet` comme des `Journey`. L'interface des résultats devient vide ou crashe.

---

#### BUG-02 — PDF étiquette bagage : toutes les variables sont échappées (non interpolées)
**Fichier :** `frontend/src/app/client/dashboard/page.tsx:426–491`  
**Sévérité :** CRITIQUE — le PDF généré affiche du texte brut `${colis.id}` au lieu des vraies données

La fonction `handleDownloadColisPDF` construit un template HTML avec `\${}` au lieu de `${}` :

```ts
// ❌ Bug — rendu littéral : "${colis.id}"
`<td>...\${colis.id}</td>`
`\${colis.agency}`
`\${colis.trip}`
`\${colis.weight}`

// ✅ Correct dans handleDownloadPDF (billets) — ligne 328 :
`<div>${billet.id}</div>`
```

**Conséquence :** L'étiquette PDF bagage affiche littéralement `${colis.id}`, `${colis.trip}`, etc. — entièrement inutilisable.

---

#### BUG-03 — Aucun middleware d'authentification sur les routes backend
**Fichier :** `backend/src/routes/agencyRoutes.ts`, `backend/src/routes/clientRoutes.ts`  
**Sévérité :** CRITIQUE — n'importe qui peut lire/modifier toutes les données sans être connecté

Aucune vérification JWT n'est effectuée sur les routes protégées :

```ts
// Exemple — n'importe qui peut ajouter un bus sans token :
router.post('/buses', addBus);  // Aucun middleware auth
router.get('/passengers/:journeyId', getPassengers);  // Aucun middleware auth
router.put('/profile', updateProfile);  // Aucun middleware auth
```

**Conséquence :** Toute l'API est publiquement accessible. Un attaquant peut lire les passagers, modifier les profils, scanner les colis.

---

#### BUG-04 — `isAgencyLoggedIn` utilise une ancienne clé localStorage inexistante
**Fichier :** `frontend/src/app/reserver/page.tsx:306`  
**Sévérité :** CRITIQUE — le lien "Admin" dans la page réservation ne s'affiche jamais

```ts
// reserver/page.tsx:306 — lit une clé jamais écrite par le nouveau système
const loginStatus = localStorage.getItem("safetrip_agency_logged_in") === "true";
setIsAgencyLoggedIn(loginStatus);
```

Le nouveau système de login (depuis `login/page.tsx`) écrit `safetrip_user_role` et `safetrip_logged_in`, mais jamais `safetrip_agency_logged_in`. Cette clé est obsolète — `isAgencyLoggedIn` sera toujours `false`.

---

#### BUG-05 — Bouton "Réserver" sans action dans la liste des trajets
**Fichier :** `frontend/src/app/reserver/page.tsx:781`  
**Sévérité :** CRITIQUE pour l'UX — le principal CTA de la page ne fait rien

```tsx
// ❌ Pas de onClick — le bouton est mort
<button className={styles.bookBtn}>Réserver</button>
```

La sélection d'un trajet se fait en cliquant sur la carte entière, puis un panneau de confirmation apparaît. Mais le bouton "Réserver" visible en permanence n'a aucun gestionnaire d'événement.

---

### 🟡 BUGS MODÉRÉS

---

#### BUG-06 — Compteurs d'équipements utilisent les données statiques, pas l'API
**Fichier :** `frontend/src/app/reserver/page.tsx:612`

```ts
// ❌ Utilise le tableau statique hardcodé "journeys", pas journeysState (données live)
const count = journeys.filter(j => j.amenityKeys?.includes(amenity.key)).length;
```

**Conséquence :** Les compteurs dans le panneau "Services et équipements" (ex: "Wi-Fi — 1") sont basés sur les 8 trajets hardcodés dans le code, et non sur les trajets réels de la base de données.

---

#### BUG-07 — Champs "MM/AA" et "CVV" non contrôlés dans le paiement carte
**Fichier :** `frontend/src/app/reserver/confirmer/page.tsx:562–565`

```tsx
// ❌ Aucune liaison state, jamais lus, jamais validés
<input type="text" placeholder="MM/AA" style={{ flex: 1 }} />
<input type="text" placeholder="CVV" style={{ flex: 1 }} />
```

L'utilisateur peut saisir n'importe quoi (ou rien) dans ces champs — la validation ne porte que sur `cardNumber`. Ces champs sont collectés visuellement mais ignorés.

---

#### BUG-08 — Bouton "Télécharger le billet PDF" utilise `window.print()` au lieu d'un vrai PDF
**Fichier :** `frontend/src/app/reserver/confirmer/page.tsx:233`

```ts
const handleDownload = () => {
  window.print(); // Ouvre la boîte de dialogue d'impression du navigateur
};
```

Le libellé dit "Télécharger le billet (PDF)" mais déclenche l'impression système. La fonction `handleDownloadPDF` avec jsPDF dans le dashboard client est correcte, mais pas cette version.

---

#### BUG-09 — Nom passager hardcodé "Marc Nzenang" dans l'étiquette bagage
**Fichier :** `frontend/src/app/client/dashboard/page.tsx:455`

```ts
`<td>Marc Nzenang</td>` // ❌ Hardcodé — devrait utiliser la variable du passager connecté
```

L'étiquette bagage PDF affiche toujours "Marc Nzenang" comme voyageur, peu importe l'utilisateur connecté.

---

#### BUG-10 — Import Supabase après les routes dans `index.ts`
**Fichier :** `backend/src/index.ts:22`

```ts
app.use('/api/auth', authRoutes);    // ligne 18
app.use('/api/agency', agencyRoutes); // ligne 19
app.use('/api/client', clientRoutes); // ligne 20

import { supabase } from './config/supabase'; // ligne 22 ← import après usage
```

Ne provoque pas de crash (Node.js résout les imports au chargement), mais c'est du code invalide structurellement et peut perturber certains outils d'analyse statique.

---

#### BUG-11 — Données colis localStorage non fusionnées avec l'API dans le dashboard client
**Fichier :** `frontend/src/app/client/dashboard/page.tsx:240–254`

Après une réservation, `confirmer/page.tsx` écrit les colis dans `safetrip_colis_db`. Mais le dashboard client ne lit jamais cette clé — il appelle uniquement l'API (`/api/client/colis`). Si l'API est offline ou si le colis n'a pas été persisté en DB, il n'apparaît pas.

---

#### BUG-12 — Les constantes `MOCK_BILLETS` et `MOCK_COLIS` sont définies mais jamais utilisées
**Fichier :** `frontend/src/app/client/dashboard/page.tsx:29–161`

Ces deux constantes volumineuses occupent ~130 lignes de code mort. Elles ont été remplacées par les appels API mais jamais supprimées.

---

#### BUG-13 — Inputs "Départ" et "Destination" de la page d'accueil non contrôlés
**Fichier :** `frontend/src/app/page.tsx:345–353`

```tsx
// ❌ Pas de value, pas de onChange — impossible de lire ces valeurs
<input type="text" placeholder="Départ" className={styles.capsuleInput} />
<input type="text" placeholder="Destination" className={styles.capsuleInput} />
```

Le bouton "Rechercher" redirige vers `/reserver` sans passer les termes saisis. La recherche est perdue lors de la navigation.

---

## PARTIE 2 — FONCTIONNALITÉS MANQUANTES

### 🔐 Authentification & Sécurité

| # | Fonctionnalité manquante | Impact |
|---|---|---|
| F-01 | **Middleware JWT sur les routes backend** — aucune vérification de token | Données exposées publiquement |
| F-02 | **Inscription agence** — la page `/login` n'a qu'un formulaire d'inscription client | Les agences ne peuvent pas s'inscrire seules |
| F-03 | **Mot de passe oublié / réinitialisation** — aucun flow de récupération | Utilisateur bloqué si mot de passe oublié |
| F-04 | **Déconnexion sur le dashboard agence et admin** — bouton logout visible uniquement sur le dashboard client | Session impossible à terminer sur les autres dashboards |
| F-05 | **Expiration de session** — le token JWT expire en 24h mais n'est jamais vérifié côté frontend | Sessions fantômes après expiration |
| F-06 | **Création de compte admin** — aucune interface pour créer un admin | Seul l'admin simulé `admin-uuid-1` est utilisable |

---

### 🔎 Recherche & Réservation

| # | Fonctionnalité manquante | Impact |
|---|---|---|
| F-07 | **Transmission des paramètres de recherche en URL** — `/?dep=Douala&arr=Yaounde` non implémenté | La recherche sur la homepage est perdue à la navigation |
| F-08 | **Filtrage par date réel** — la date est fixée à "Aujourd'hui" et non utilisée en filtre | Impossible de réserver pour une autre date |
| F-09 | **Nombre de passagers dynamique** — la capsule de recherche permet de sélectionner 1–10 passagers mais cette valeur est ignorée, 1 seul billet est toujours généré | Réservations groupées impossibles |
| F-10 | **Disponibilité des sièges en temps réel** — les 40 sièges sont hardcodés avec un set fixe d'occupés | Deux clients peuvent réserver le même siège |
| F-11 | **Filtrage par agence** — aucun filtre par opérateur sur la page `/reserver` | |

---

### 💳 Paiement

| # | Fonctionnalité manquante | Impact |
|---|---|---|
| F-12 | **Intégration passerelle de paiement réelle** — seulement une saisie manuelle de référence USSD | Aucun paiement réel possible |
| F-13 | **Validation de la référence de transaction** — la référence SMS est acceptée telle quelle sans vérification | Fraude possible |
| F-14 | **Email de confirmation** — aucun email envoyé après réservation | Mauvaise expérience utilisateur |
| F-15 | **Annulation & remboursement** — aucun bouton d'annulation pour les billets actifs | Client bloqué |

---

### 📦 Traçabilité & Bagages

| # | Fonctionnalité manquante | Impact |
|---|---|---|
| F-16 | **QR codes réels** — tous les QR codes sont des SVG décoratifs non scannables | La fonctionnalité principale de traçabilité ne fonctionne pas réellement |
| F-17 | **Scanner QR code** — aucune interface de scan (caméra) pour les agents | Les statuts "Scanné en gare" doivent être mis à jour manuellement depuis le dashboard agence |
| F-18 | **Envoi de colis sans billet** — impossible d'enregistrer un colis sans réserver un billet | Cas d'usage important non couvert |

---

### 📱 Dashboard Client

| # | Fonctionnalité manquante | Impact |
|---|---|---|
| F-19 | **Messagerie fonctionnelle** — l'onglet "Messageries" affiche "Aucun message" avec un bouton "Démarrer une conversation" qui ne fait rien | |
| F-20 | **Synchronisation profil avec la base de données** — les modifications du profil (nom, téléphone, ville) sont sauvegardées en localStorage uniquement, jamais envoyées au backend | Les modifications sont perdues si le localStorage est effacé |
| F-21 | **Notifications** — aucun système de notification (SMS, email, push) pour les mises à jour de statut bagage | |

---

### 🏢 Dashboard Agence

| # | Fonctionnalité manquante | Impact |
|---|---|---|
| F-22 | **Modifier / Supprimer un bus** — seule l'ajout est disponible, aucun endpoint DELETE ni interface d'édition | |
| F-23 | **Modifier / Supprimer un trajet** — seule la création est disponible | Impossible de corriger une erreur d'horaire |

---

### 🛠️ Pages & Fichiers manquants

| Fichier manquant | Rôle |
|---|---|
| `frontend/src/app/not-found.tsx` | Page 404 personnalisée |
| `frontend/src/app/error.tsx` | Boundary d'erreur global Next.js |
| `frontend/src/app/loading.tsx` | Indicateur de chargement global |
| `backend/.env` | Variables d'environnement (Supabase non connecté sans ce fichier) |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` — URL API non paramétrée |
| Route `DELETE /api/agency/buses/:id` | Suppression d'un bus |
| Route `DELETE /api/agency/journeys/:id` | Suppression d'un trajet |
| Route `PUT /api/agency/buses/:id` | Modification d'un bus |
| Route `PUT /api/client/billets/:id/annuler` | Annulation d'un billet |
| Route `GET /api/admin/*` | Endpoints spécifiques admin (actuellement partage l'API agence) |
| Route `PUT /api/client/profile` | Sauvegarde profil client en base |

---

## PARTIE 3 — PROBLÈMES DE SÉCURITÉ

| # | Problème | Fichier | Sévérité |
|---|---|---|---|
| S-01 | **Secret JWT hardcodé en fallback** — si `.env` absent, tous les tokens sont signés avec `'safetrip_super_secret_key_2026'` connu publiquement | `authController.ts:6` | 🔴 HAUTE |
| S-02 | **Aucun middleware auth sur les routes API** — toutes les routes `/api/agency` et `/api/client` sont publiques | `agencyRoutes.ts`, `clientRoutes.ts` | 🔴 HAUTE |
| S-03 | **Login de simulation par pattern d'email** — si le backend est offline, tout email contenant "admin" donne accès admin | `login/page.tsx:94–100` | 🔴 HAUTE |
| S-04 | **CORS entièrement ouvert** — `app.use(cors())` sans restriction d'origine | `backend/src/index.ts:14` | 🟡 MOYENNE |
| S-05 | **JWT stocké en localStorage** — vulnérable aux attaques XSS | `login/page.tsx:67` | 🟡 MOYENNE |
| S-06 | **Numéros USSD de paiement exposés dans le code source frontend** — `#150*11*655462642#` visible dans le bundle JS public | `confirmer/page.tsx:506` | 🟡 MOYENNE |

---

## PARTIE 4 — PROBLÈMES D'ARCHITECTURE

| # | Problème | Localisation |
|---|---|---|
| A-01 | **URL API hardcodée `http://localhost:5000`** dans 5 fichiers frontend — impossible de déployer sans modifier le code | `login/page.tsx`, `reserver/page.tsx`, `confirmer/page.tsx`, `agence/dashboard/page.tsx`, `admin/dashboard/page.tsx`, `client/dashboard/page.tsx` |
| A-02 | **Données de trajets dupliquées** — les mêmes 8 trajets sont définis dans `agencyController.ts` (sim data) ET `reserver/page.tsx` (static array) — peuvent diverger | Les deux fichiers |
| A-03 | **Clé localStorage `safetrip_journeys` partagée** entre cache trajets et historique billets (structures différentes) | Voir BUG-01 |
| A-04 | **Fichier `.env` backend absent** — Supabase ne se connecte jamais, tout est simulation | `backend/` |
| A-05 | **Fichier `.env.local` frontend absent** — `NEXT_PUBLIC_API_URL` non défini | `frontend/` |
| A-06 | **`import` Supabase après `app.use()`** dans index.ts | `backend/src/index.ts:22` |
| A-07 | **Aucun versionnement d'API** — `/api/auth/login` au lieu de `/api/v1/auth/login` — difficile d'évoluer | Toutes les routes |
| A-08 | **Protection des pages frontend manquante** — `/reserver` et `/reserver/confirmer` accessibles sans connexion | Les deux pages |
| A-09 | **Profil client sauvegardé uniquement en localStorage** — pas de persistence en base de données | `client/dashboard/page.tsx:514` |

---

## PARTIE 5 — PLAN DE CORRECTION PRIORISÉ

### Priorité 1 — À corriger avant tout demo/présentation

| # | Action | Fichier(s) |
|---|---|---|
| 1 | Renommer `safetrip_journeys` → `safetrip_journeys_cache` (page réservation) et `safetrip_tickets_history` (page confirmer) | `reserver/page.tsx`, `confirmer/page.tsx` |
| 2 | Corriger les `\${}` → `${}` dans `handleDownloadColisPDF` | `client/dashboard/page.tsx:440–480` |
| 3 | Ajouter un `onClick` sur le bouton "Réserver" pour sélectionner le trajet | `reserver/page.tsx:781` |
| 4 | Corriger "Marc Nzenang" hardcodé → utiliser le nom du client connecté | `client/dashboard/page.tsx:455` |
| 5 | Corriger les inputs non contrôlés sur la homepage (départ/destination) | `page.tsx:345–353` |
| 6 | Créer `backend/.env` avec les vrais credentials Supabase | `backend/` |

### Priorité 2 — Avant une version beta

| # | Action |
|---|---|
| 7 | Ajouter un middleware JWT sur toutes les routes backend protégées |
| 8 | Changer le secret JWT fallback → lancer une erreur si `JWT_SECRET` absent |
| 9 | Supprimer la simulation de login par pattern d'email |
| 10 | Créer `frontend/.env.local` avec `NEXT_PUBLIC_API_URL` |
| 11 | Remplacer `http://localhost:5000` par `process.env.NEXT_PUBLIC_API_URL` partout |
| 12 | Implémenter la transmission des paramètres de recherche en URL |
| 13 | Ajouter page 404 (`not-found.tsx`) et error boundary (`error.tsx`) |
| 14 | Implémenter la suppression de bus et de trajets (DELETE routes + UI) |

### Priorité 3 — Avant lancement production

| # | Action |
|---|---|
| 15 | Intégrer une vraie passerelle de paiement (CinetPay, PayDunya) |
| 16 | Générer de vrais QR codes (bibliothèque `qrcode` ou `react-qr-code`) |
| 17 | Synchroniser le profil client avec le backend |
| 18 | Implémenter la messagerie client-agence fonctionnelle |
| 19 | Restreindre CORS aux domaines autorisés uniquement |
| 20 | Migrer les tokens JWT vers des cookies HttpOnly |

---

## ANNEXE — Inventaire des fichiers analysés

```
backend/
├── src/
│   ├── config/supabase.ts          ✅ analysé
│   ├── controllers/
│   │   ├── authController.ts       ✅ analysé (307 lignes)
│   │   ├── agencyController.ts     ✅ analysé (390 lignes)
│   │   └── clientController.ts     ✅ analysé (272 lignes)
│   ├── routes/
│   │   ├── authRoutes.ts           ✅ analysé
│   │   ├── agencyRoutes.ts         ✅ analysé
│   │   └── clientRoutes.ts         ✅ analysé
│   └── index.ts                    ✅ analysé
├── schema.sql                      ✅ analysé
└── package.json                    ✅ analysé

frontend/
├── src/app/
│   ├── page.tsx                    ✅ analysé (947 lignes)
│   ├── layout.tsx                  ✅ analysé
│   ├── login/page.tsx              ✅ analysé (320 lignes)
│   ├── reserver/
│   │   ├── page.tsx                ✅ analysé (830 lignes)
│   │   └── confirmer/page.tsx      ✅ analysé (729 lignes)
│   ├── client/dashboard/page.tsx   ✅ analysé (1383 lignes)
│   ├── agence/dashboard/page.tsx   ✅ analysé partiellement (80 premières lignes)
│   └── admin/dashboard/page.tsx    ✅ analysé partiellement (100 premières lignes)
└── package.json                    ✅ analysé
```

> **Note :** Les dashboards agence et admin sont très volumineux et n'ont été analysés que partiellement. Des bugs supplémentaires peuvent exister dans leurs parties non lues.

---

*SafeTrip © 2026 — Rapport généré le 27 Mai 2026*
