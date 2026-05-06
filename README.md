# Livr'O — Système de gestion des livraisons

> **Version:** 1.1.0  
> **Stack:** React 18 · FastAPI · PostgreSQL

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Installation](#4-installation)
5. [Variables d'environnement](#5-variables-denvironnement)
6. [Rôles & permissions](#6-rôles--permissions)
7. [Endpoints API](#7-endpoints-api)
8. [Flux des statuts](#8-flux-des-statuts)
9. [Tarification](#9-tarification)
10. [Facture & QR Code](#10-facture--qr-code)
11. [Carte & Localisation](#11-carte--localisation)
12. [Notifications](#12-notifications)
13. [Profil utilisateur](#13-profil-utilisateur)
14. [Migrations SQL](#14-migrations-sql)
15. [Changelog](#15-changelog)

---

## 1. Présentation

**Livr'O** est une application web complète de gestion de livraisons avec interface responsive (desktop + mobile). Elle permet à quatre types d'utilisateurs d'interagir avec un système de commandes, de tarification, de suivi en temps réel et de localisation précise.

**Fonctionnalités principales :**
- Création et suivi des commandes de livraison
- Système de rôles avec accès différenciés (Admin, Manager, Livreur, Client)
- Tarification automatique par ville avec ajustement manuel
- Facture HTML téléchargeable avec QR code unique par commande
- Scanner QR via caméra pour identification rapide du colis
- Carte interactive (Leaflet + OpenStreetMap) avec pins exacts via Google Maps
- Localisation précise expéditeur/destinataire depuis un lien Google Maps
- Notifications automatiques client à chaque changement de statut
- Page profil : modifier nom, téléphone, mot de passe
- Interface 100% responsive — desktop, tablette et mobile
- Logo SVG personnalisé et branding Livr'O

---

## 2. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React + Vite | 18 / 5 |
| Frontend | React Router DOM | 6.x |
| Frontend | Axios | 1.7 |
| Frontend | Leaflet.js | 1.9.4 |
| Backend | FastAPI | 0.111 |
| Backend | SQLAlchemy | 2.0 |
| Backend | python-jose | 3.3 |
| Backend | passlib bcrypt | 1.7 |
| Base de données | PostgreSQL | 14+ |
| Carte | Leaflet + OpenStreetMap | 1.9.4 |
| QR Code | qrcodejs (CDN) | 1.0 |
| QR Scanner | jsQR (CDN) | 1.4 |

---

## 3. Structure du projet

```
deliveros/
├── README.md
├── backend/
│   ├── main.py                          # Point d'entrée FastAPI — v1.1.0
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/
│       │   ├── dependencies.py          # get_current_user, require_role()
│       │   └── routes/
│       │       ├── auth.py              # Auth + profil + stats admin
│       │       ├── client_orders.py     # CRUD commandes client
│       │       ├── manager_orders.py    # Gestion + assignation + prix
│       │       ├── livreur_orders.py    # Commandes assignées + statuts
│       │       ├── invoice.py           # Données facture
│       │       └── notifications.py     # Notifications client
│       ├── core/
│       │   ├── config.py                # Settings .env
│       │   ├── database.py              # Engine SQLAlchemy + get_db
│       │   └── security.py             # JWT + bcrypt
│       ├── models/
│       │   ├── user.py                  # User + UserRole
│       │   ├── order.py                 # Order + localisation + pricing
│       │   └── notification.py          # Notification
│       ├── schemas/
│       │   ├── user.py                  # Pydantic schemas auth + profil
│       │   └── order.py                 # Pydantic schemas commandes
│       ├── services/
│       │   ├── auth_service.py          # Auth + update profil
│       │   ├── order_service.py         # Commandes + tarification
│       │   └── notification_service.py  # Notifications automatiques
│       └── utils/
│           └── seed.py                  # Création admin initial
│
└── frontend/
    ├── public/
    │   ├── index.html                   # Viewport mobile + Leaflet CSS
    │   └── logo.svg                     # Logo Livr'O SVG
    ├── package.json                     # v1.1.0
    └── src/
        ├── main.jsx
        ├── App.jsx                      # Router + AuthProvider
        ├── index.css                    # Variables CSS + responsive
        ├── context/
        │   └── AuthContext.jsx          # Auth state + updateUser()
        ├── services/
        │   ├── api.js                   # Axios + JWT intercepteurs
        │   ├── authService.js           # Appels auth
        │   ├── orderService.js          # Appels commandes
        │   ├── invoiceService.js        # Facture + prix suggéré
        │   └── profileService.js        # Profil + notifications
        ├── utils/
        │   └── geocode.js               # Extraction coords Google Maps
        ├── components/
        │   ├── layout/
        │   │   ├── AuthLayout.jsx       # Wrapper auth avec logo
        │   │   ├── DashboardLayout.jsx  # Sidebar + topbar + nav mobile
        │   │   └── ProtectedRoute.jsx   # Guard routes par rôle
        │   └── ui/
        │       ├── Input.jsx
        │       ├── Button.jsx
        │       ├── Alert.jsx
        │       ├── DashboardUI.jsx      # Card, StatCard, Table, Badge
        │       ├── OrderUI.jsx          # StatusBadge, Stepper, Parties
        │       ├── DeliveryMap.jsx      # Carte Leaflet avec pins exacts
        │       ├── QRScanner.jsx        # Lecteur QR caméra
        │       ├── ProfilePage.jsx      # Modifier profil + mot de passe
        │       ├── NotificationsPage.jsx
        │       └── NotificationBell.jsx # Cloche avec compteur non lues
        └── pages/
            ├── auth/
            │   ├── LoginPage.jsx
            │   ├── RegisterPage.jsx
            │   └── AdminCreateUserPage.jsx
            ├── admin/AdminDashboard.jsx
            ├── manager/ManagerDashboard.jsx
            ├── livreur/LivreurDashboard.jsx  # + onglet carte
            ├── client/ClientDashboard.jsx     # + localisation Maps
            └── shared/FacturePage.jsx         # Facture HTML + QR
```

---

## 4. Installation

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### Base de données

```bash
psql -U postgres
CREATE DATABASE deliveros;
\q
```

### Backend

```bash
cd deliveros/backend
pip install -r requirements.txt
cp .env.example .env        # Remplir les variables
uvicorn main:app --reload   # http://localhost:8000
```

> Au premier démarrage, un compte **Admin** est créé automatiquement avec les identifiants définis dans `.env`.

### Frontend

```bash
cd deliveros/frontend
npm install
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:8000/api/v1
npm run dev                  # http://localhost:5173
```

---

## 5. Variables d'environnement

### Backend — `.env`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/deliveros
SECRET_KEY=votre-cle-secrete-longue-et-aleatoire
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
FIRST_ADMIN_EMAIL=admin@livro.com
FIRST_ADMIN_PASSWORD=Admin@1234
```

### Frontend — `.env`

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 6. Rôles & permissions

| Rôle | Création | Accès |
|------|----------|-------|
| **Admin** | Auto-créé au démarrage | Tout — stats, users, logs, factures, toggle actif/inactif |
| **Manager** | Créé par l'Admin | Commandes, assignation livreurs, tarification |
| **Livreur** | Créé par l'Admin | Commandes assignées, statuts, QR scan, carte |
| **Client** | Auto-inscription `/register` | Créer commandes, suivre, facture, profil, notifications |

---

## 7. Endpoints API

Base URL : `http://localhost:8000/api/v1`

### Authentification & Profil — `/auth`

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| POST | `/auth/login` | Public | Connexion — retourne JWT |
| POST | `/auth/register` | Public | Inscription client |
| POST | `/auth/refresh` | Public | Renouveler le token |
| GET | `/auth/me` | Tous | Profil de l'utilisateur connecté |
| PATCH | `/auth/me` | Tous | Modifier nom et téléphone |
| POST | `/auth/me/change-password` | Tous | Changer le mot de passe |
| POST | `/auth/create-user` | Admin | Créer un compte manager ou livreur |
| GET | `/auth/list-users` | Admin/Manager | Lister les utilisateurs (filtre rôle) |
| PATCH | `/auth/toggle-user/{id}` | Admin | Activer ou désactiver un compte |
| GET | `/auth/stats` | Admin | Statistiques globales de la plateforme |
| GET | `/auth/recent-orders` | Admin | Dernières commandes |

### Commandes Client — `/client/orders`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/client/orders` | Créer une commande (avec liens Google Maps) |
| GET | `/client/orders` | Mes commandes |
| GET | `/client/orders/{id}` | Détail commande |
| PATCH | `/client/orders/{id}/cancel` | Annuler (statut pending uniquement) |

### Commandes Manager — `/manager/orders`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/manager/orders` | Toutes les commandes (filtres statut/ville) |
| GET | `/manager/orders/{id}` | Détail commande |
| PATCH | `/manager/orders/{id}/assign` | Assigner livreur + définir prix |
| PATCH | `/manager/orders/{id}/cancel` | Annuler une commande |
| GET | `/manager/orders/price-suggestion` | Prix suggéré selon trajet |

### Commandes Livreur — `/livreur/orders`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/livreur/orders` | Commandes assignées au livreur |
| GET | `/livreur/orders/{id}` | Détail d'une commande |
| PATCH | `/livreur/orders/{id}/status` | Mettre à jour le statut |

### Facture & Notifications

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| GET | `/invoice/{order_id}` | Admin / Client | Données de la facture |
| GET | `/notifications` | Tous | Liste des notifications |
| GET | `/notifications/unread-count` | Tous | Nombre de non lues |
| PATCH | `/notifications/{id}/read` | Tous | Marquer comme lue |
| POST | `/notifications/read-all` | Tous | Tout marquer comme lu |

---

## 8. Flux des statuts

```
Client crée        →  pending
Manager assigne    →  assigned     (notification client)
Livreur récupère   →  picked_up    (notification client)
Livreur en route   →  in_transit   (notification client)
Livreur confirme   →  delivered    (notification client 🎉)

Client annule      →  cancelled    (pending uniquement)
Manager annule     →  cancelled    (tout statut actif)
Livreur annule     →  cancelled    (si bloqué)
```

---

## 9. Tarification

Le prix est calculé en deux étapes par le Manager au moment de l'assignation :

1. **Prix de base** — suggéré automatiquement selon le trajet (ville à ville)
2. **Ajustement manuel** — le manager peut ajouter ou déduire un montant
3. **Total** = Prix de base + Ajustement

| Trajet | Prix de base |
|--------|-------------|
| Casablanca → Rabat | 80 MAD |
| Casablanca → Fès | 150 MAD |
| Casablanca → Marrakech | 120 MAD |
| Casablanca → Tanger | 180 MAD |
| Rabat → Fès | 100 MAD |
| Rabat → Marrakech | 160 MAD |
| Fès → Marrakech | 200 MAD |
| Même ville | 50 MAD |
| Trajet inconnu | 100 MAD (défaut) |

---

## 10. Facture & QR Code

- La facture est disponible une fois que le manager a défini le prix
- Téléchargement automatique en fichier `.html` autonome
- Pour obtenir un PDF : ouvrir le fichier → `Ctrl+P` → Enregistrer en PDF
- Chaque facture contient un QR code unique : `LIVRO:ORDER:{id}`
- Le livreur scanne le QR via son dashboard → la commande s'ouvre automatiquement

---

## 11. Carte & Localisation

### Carte dans le dashboard Livreur

- Onglet **🗺 Carte** dans le dashboard livreur
- Affiche toutes les commandes actives assignées au livreur
- **📦 Pin** pour l'expéditeur — **🏠 Pin** pour le destinataire
- Ligne de trajet entre les deux points (pointillée = assignée, pleine = en transit)
- Cliquer sur un pin → popup avec détails de la commande
- Cliquer sur une commande dans la liste → sélection sur la carte
- **Responsive** : carte en haut, liste horizontale en bas sur mobile

### Localisation précise

Le client peut coller un lien Google Maps dans le formulaire de commande :
- Les coordonnées GPS sont extraites automatiquement du lien
- Le pin apparaît à l'adresse exacte (pas seulement la ville)
- Formats supportés : `@lat,lng`, `!3dlat!4dlng`, `?q=lat,lng`
- Sans lien → fallback sur le centre de la ville

### Comment obtenir le bon lien Google Maps

**Sur mobile :**
1. Ouvrir Google Maps → maintenir appuyé sur l'emplacement
2. Appuyer sur les coordonnées en bas → Partager → Copier le lien

**Sur desktop :**
1. Clic droit sur l'emplacement → copier les coordonnées
2. Ou : chercher l'adresse → copier l'URL du navigateur (doit contenir `@lat,lng`)

---

## 12. Notifications

Les clients reçoivent automatiquement une notification à chaque changement de statut :

| Événement | Titre de la notification |
|-----------|--------------------------|
| Commande assignée | Commande assignée |
| Colis récupéré | Colis récupéré |
| En route | En route |
| Livré | Colis livré ! 🎉 |
| Annulé | Commande annulée |

- La cloche 🔔 dans la topbar affiche le nombre de non lues
- Polling automatique toutes les 30 secondes
- Filtre "Toutes" / "Non lues"
- Marquer une ou toutes comme lues

---

## 13. Profil utilisateur

Tous les rôles peuvent modifier leur profil depuis leur dashboard :

- **Nom complet** — modifié en temps réel dans la topbar
- **Téléphone**
- **Mot de passe** — avec indicateur de force (8+ car., majuscule, chiffre, spécial)
- L'email n'est pas modifiable

---

## 14. Migrations SQL

Exécuter ces commandes si la base de données existait avant v1.1.0 :

```sql
-- v1.0.1 — Tarification
ALTER TABLE orders ADD COLUMN IF NOT EXISTS base_price FLOAT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_adjustment FLOAT DEFAULT 0.0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price FLOAT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- v1.1.0 — Localisation Google Maps
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sender_location VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receiver_location VARCHAR(500);

-- v1.1.0 — Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id),
    title      VARCHAR(120) NOT NULL,
    message    TEXT NOT NULL,
    is_read    BOOLEAN DEFAULT FALSE,
    order_id   INTEGER REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- v1.1.0 — Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
```

---

## 15. Changelog

### v1.1.0 — Carte, Localisation & Mobile
- Carte interactive Leaflet dans le dashboard Livreur (onglet 🗺)
- Pins exacts via extraction des coordonnées depuis les liens Google Maps
- Champs localisation Google Maps dans le formulaire de commande client
- Interface entièrement responsive — mobile, tablette, desktop
- Navigation mobile : sidebar overlay + barre de navigation en bas
- Fix iOS : `font-size: 16px` sur les inputs pour éviter le zoom automatique
- Branding Livr'O : logo SVG personnalisé, nom dans topbar et factures
- Page profil pour tous les rôles (nom, téléphone, mot de passe)
- Système de notifications automatiques avec cloche 🔔 dans la topbar
- `updateUser()` dans AuthContext — la topbar se met à jour sans rechargement

### v1.0.1 — Tarification & Facture
- Prix de base automatique selon le trajet + ajustement manuel par le manager
- Facture HTML téléchargeable avec QR code (format `LIVRO:ORDER:{id}`)
- Scanner QR caméra dans le dashboard Livreur
- Contrôle complet des statuts de livraison pour le Livreur
- Notifications client automatiques sur chaque changement de statut

### v1.0.0 — Version initiale
- Authentification JWT avec 4 rôles (Admin, Manager, Livreur, Client)
- CRUD commandes avec informations expéditeur / destinataire / trajet / colis
- Dashboard Admin : statistiques, gestion utilisateurs, journaux, rôles
- Dashboard Manager : commandes, assignation livreurs
- Dashboard Livreur : commandes assignées, mise à jour statuts
- Dashboard Client : créer commandes, suivre, annuler

---

*Livr'O v1.1.0 — Tous droits réservés*
