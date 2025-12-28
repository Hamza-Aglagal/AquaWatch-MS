-- Script d'initialisation pour la base de données SonarQube
-- Ce script est exécuté automatiquement lors du premier démarrage du conteneur PostgreSQL

-- Vérifier que la base de données existe
SELECT 'CREATE DATABASE sonarqube'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sonarqube')\gexec

-- Se connecter à la base de données SonarQube
\c sonarqube

-- Créer les extensions nécessaires si elles n'existent pas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Afficher un message de confirmation
SELECT 'SonarQube database initialized successfully' AS status;
