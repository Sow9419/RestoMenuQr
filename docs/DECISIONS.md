# DECISIONS.md

# Architecture Decision Records (ADRs)

Ce fichier consigne les choix structuraux majeurs du projet.

## 001 - Fullstack Framework
**Décision** : Utiliser Next.js 15+ (App Router).
**Raison** : Simplifie la gestion du routing, du server-side rendering pour le chargement des menus publics, et intègre parfaitement les Server Actions.

## 002 - State Management
**Décision** : Utiliser Zustand pour les états complexes locaux (ex: Panier/CartStore). Ne pas tout globaliser.
**Raison** : Zustand est très léger, évite le boilerplate de Redux et les renders inutiles du React Context natif.

## 003 - Backend & Database
**Décision** : Utiliser Supabase.
**Raison** : Fournit PostgreSQL (relationnel solide), Auth, et Realtime clés en main, ce qui correspond aux besoins de gestion de restaurant et suivi en direct des commandes.

## 004 - Moteur de Menu Client
**Décision** : UI pilotée par la donnée (JSON configuratif) plutôt que génération de code.
**Raison** : Évite les failles d'injection de code, simplifie le stockage, et garantit que toutes les UI générées restent dans le scope du Design System.
