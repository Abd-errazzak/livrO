# Livr'O — Système de gestion des livraisons

> **Stack:** React 18 · FastAPI · PostgreSQL  
> **Version:** 1.0.1

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
11. [Notifications](#12-notifications)
12. [Migrations SQL](#13-migrations-sql)
13. [Changelog](#14-changelog)

---

## 1. Présentation

**Livr'O** est une application web complète de gestion de livraisons. Elle permet à quatre types d'utilisateurs d'interagir avec un système de commandes, de tarification et de suivi en temps réel.

**Fonctionnalités principales :**
- Création et suivi des commandes de livraison
- Système de rôles avec accès différenciés (Admin, Manager, Livreur, Client)
- Tarification automatique par ville avec ajustement manuel
- Facture HTML téléchargeable avec QR code unique par commande
- Scanner QR via caméra pour identification rapide du colis
- Authentification JWT avec access token + refresh token
- Notifications en temps réel pour le client à chaque changement de statut
- Profil utilisateur modifiable (nom, téléphone, mot de passe)
- Interface responsive (desktop + mobile)

---

## 2. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React + Vite | 18 / 5 |
| Frontend | React Router DOM | 6.x |
| Frontend | Axios | 1.7 |
| Backend | FastAPI | 0.111 |
| Backend | SQLAlchemy | 2.0 |
| Backend | Alembic | 1.13 |
| Backend | python-jose | 3.3 |
| Backend | passlib bcrypt | 1.7 |
| Base de données | PostgreSQL | 14+ |
| QR Code | qrcodejs (CDN) | 1.0 |
| QR Scanner | jsQR (CDN) | 1.4 |

---

## 3. Structure du projet

```
deliveros/
├── backend/
│   ├── main.py                        # Point d'entrée FastAPI
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/
│       │   ├── dependencies.py        # get_current_user, require_role()
│       │   └── routes/
│       │       ├── auth.py            # Login, register, /me, profil, stats admin
│       │       ├── client_orders.py   # CRUD commandes client
│       │       ├── manager_orders.py  # Gestion + assignation + prix
│       │       ├── livreur_orders.py  # Commandes assignées + statuts
│       │       ├── invoice.py         # Données facture
│       │       └── notifications.py  # Notifications client
│       ├── core/
│       │   ├── config.py              # Settings .env
│       │   ├── database.py            # Engine SQLAlchemy + get_db
│       │   └── security.py            # JWT + bcrypt
│       ├── models/
│       │   ├── user.py                # User + UserRole
│       │   ├── order.py               # Order + OrderStatus + PaymentType
│       │   └── notification.py        # Notification
│       ├── schemas/
│       │   ├── user.py                # Pydantic schemas auth + profil
│       │   └── order.py               # Pydantic schemas commandes
│       ├── services/
│       │   ├── auth_service.py        # Logique auth + profil
│       │   ├── order_service.py       # Logique commandes + prix
│       │   └── notification_service.py
│       └── utils/
│           └── seed.py                # Création admin initial
│
└── frontend/
    ├── public/
    │   ├── index.html
    │   └── logo.svg                   # Logo Livr'O
    ├── src/
    │   ├── main.jsx                   # Entry point React
    │   ├── App.jsx                    # Router + AuthProvider
    │   ├── index.css                  # Variables CSS + responsive
    │   ├── context/
    │   │   └── AuthContext.jsx        # État auth global + updateUser
    │   ├── services/
    │   │   ├── api.js                 # Axios + intercepteurs JWT
    │   │   ├── authService.js         # Appels API auth
    │   │   ├── orderService.js        # Appels API commandes
    │   │   ├── invoiceService.js      # Appels API facture + prix
    │   │   └── profileService.js      # Appels API profil + notifications
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── AuthLayout.jsx     # Wrapper pages auth
    │   │   │   ├── DashboardLayout.jsx # Sidebar + topbar + mobile nav
    │   │   │   └── ProtectedRoute.jsx  # Guard routes par rôle
    │   │   └── ui/
    │   │       ├── Input.jsx / Button.jsx / Alert.jsx
    │   │       ├── DashboardUI.jsx    # Badge, StatCard, Card, Table
    │   │       ├── OrderUI.jsx        # StatusBadge, Stepper, Parties
    │   │       ├── QRScanner.jsx      # Lecteur QR caméra
    │   │       ├── ProfilePage.jsx    # Modifier profil + mot de passe
    │   │       ├── NotificationsPage.jsx
    │   │       └── NotificationBell.jsx
    │   └── pages/
    │       ├── auth/
    │       │   ├── LoginPage.jsx
    │       │   ├── RegisterPage.jsx
    │       │   └── AdminCreateUserPage.jsx
    │       ├── admin/AdminDashboard.jsx
    │       ├── manager/ManagerDashboard.jsx
    │       ├── livreur/LivreurDashboard.jsx
    │       ├── client/ClientDashboard.jsx
    │       └── shared/FacturePage.jsx  # Facture HTML + QR
    └── vite.config.js
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

### Frontend

```bash
cd deliveros/frontend
npm install
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:8000/api/v1
npm run dev                  # http://localhost:5173
```

> Au premier démarrage du backend, un compte **Admin** est créé automatiquement avec les identifiants définis dans `.env`.

---

## 5. Variables d'environnement

### Backend — `.env`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/deliveros
SECRET_KEY=votre-cle-secrete-longue
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

| Rôle | Création du compte | Accès |
|------|--------------------|-------|
| Admin | Auto-créé au démarrage | Accès total — stats, users, logs, factures |
| Manager | Créé par l'Admin | Commandes, assignation, tarification |
| Livreur | Créé par l'Admin | Commandes assignées, statuts, QR scan |
| Client | Auto-inscription via `/register` | Créer commandes, suivre, facture, profil, notifications |

---

## 7. Endpoints API

Base URL : `http://localhost:8000/api/v1`

### Authentification — `/auth`

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| POST | `/auth/login` | Public | Connexion |
| POST | `/auth/register` | Public | Inscription client |
| POST | `/auth/refresh` | Public | Renouveler token |
| GET | `/auth/me` | Tous | Profil connecté |
| PATCH | `/auth/me` | Tous | Modifier profil |
| POST | `/auth/me/change-password` | Tous | Changer mot de passe |
| POST | `/auth/create-user` | Admin | Créer manager ou livreur |
| GET | `/auth/list-users` | Admin/Manager | Lister utilisateurs |
| PATCH | `/auth/toggle-user/{id}` | Admin | Activer/désactiver compte |
| GET | `/auth/stats` | Admin | Statistiques plateforme |
| GET | `/auth/recent-orders` | Admin | Commandes récentes |

### Commandes Client — `/client/orders`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/client/orders` | Créer une commande |
| GET | `/client/orders` | Mes commandes |
| GET | `/client/orders/{id}` | Détail commande |
| PATCH | `/client/orders/{id}/cancel` | Annuler |

### Commandes Manager — `/manager/orders`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/manager/orders` | Toutes les commandes |
| GET | `/manager/orders/{id}` | Détail commande |
| PATCH | `/manager/orders/{id}/assign` | Assigner + prix |
| PATCH | `/manager/orders/{id}/cancel` | Annuler |
| GET | `/manager/orders/price-suggestion` | Prix suggéré |

### Commandes Livreur — `/livreur/orders`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/livreur/orders` | Mes livraisons |
| GET | `/livreur/orders/{id}` | Détail |
| PATCH | `/livreur/orders/{id}/status` | Mettre à jour statut |

### Facture & Notifications

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| GET | `/invoice/{order_id}` | Admin/Client | Données facture |
| GET | `/notifications` | Tous | Liste notifications |
| GET | `/notifications/unread-count` | Tous | Compteur non lues |
| PATCH | `/notifications/{id}/read` | Tous | Marquer comme lue |
| POST | `/notifications/read-all` | Tous | Tout marquer lu |

---

## 8. Flux des statuts

```
pending → assigned    (Manager assigne un livreur + prix)
assigned → picked_up  (Livreur récupère le colis)
picked_up → in_transit (Livreur en route)
in_transit → delivered (Livreur confirme la livraison)

pending → cancelled   (Client annule avant assignation)
any active → cancelled (Manager ou Livreur annule)
```

---

## 9. Tarification

Le prix est calculé en deux étapes :
1. **Prix de base** : suggéré automatiquement selon le trajet
2. **Ajustement manuel** : le manager peut ajouter ou déduire un montant
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

- La facture est disponible une fois le prix défini par le manager
- Elle se télécharge automatiquement en fichier `.html` autonome
- Pour obtenir un PDF : ouvrir le fichier → `Ctrl+P` → Enregistrer en PDF
- Chaque facture contient un QR code unique : `LIVRO:ORDER:{id}`
- Le livreur scanne le QR via son dashboard → commande s'ouvre automatiquement

---

## 11. Notifications

Les clients reçoivent une notification automatique à chaque changement de statut :

| Événement | Titre |
|-----------|-------|
| Commande assignée | Commande assignée |
| Colis récupéré | Colis récupéré |
| En route | En route |
| Livré | Colis livré ! 🎉 |
| Annulé | Commande annulée |

La cloche 🔔 dans la topbar affiche le nombre de notifications non lues en temps réel (polling toutes les 30 secondes).

---

## 12. Migrations SQL

Si la base de données existait avant v1.0.1, exécuter :

```sql
-- Colonnes de tarification
ALTER TABLE orders ADD COLUMN IF NOT EXISTS base_price FLOAT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_adjustment FLOAT DEFAULT 0.0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price FLOAT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Table notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    order_id INTEGER REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Colonnes users
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
```

---

## 13. Changelog

### v1.0.1
- Tarification : prix de base automatique + ajustement manuel
- Facture HTML téléchargeable avec QR code
- Scanner QR dans le dashboard Livreur
- Contrôle complet des statuts pour le Livreur
- Notifications client automatiques sur chaque changement de statut
- Page profil : modifier nom, téléphone, mot de passe
- Interface responsive (mobile + desktop)
- Renommage de l'app en **Livr'O**
- Nouveau logo SVG

### v1.0.0
- Système d'authentification JWT avec 4 rôles
- CRUD commandes avec informations expéditeur/destinataire
- Dashboard Admin : stats, gestion users, rôles, journaux
- Dashboard Manager : commandes, assignation livreurs
- Dashboard Livreur : commandes assignées, mise à jour statuts
- Dashboard Client : créer, suivre, annuler commandes

---

*Livr'O v1.0.1 — Tous droits réservés*
