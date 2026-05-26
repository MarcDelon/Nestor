-- ====================================================================
-- SAFETRIP SEED SCRIPT : 5 AGENCES PARTENAIRES PRINCIPALES
-- ====================================================================
-- Description : Insertion des 5 agences phares du Cameroun.
-- Mot de passe par défaut pour toutes ces agences : "123456"
-- (Hash Bcrypt correspondant : $2a$10$T7rOxYzyX64kkmutpDpdeeTECSvuQeDVyorZ7IejWNehuyG0EiTmi)
-- Instructions : Copiez-collez ce script dans l'Éditeur SQL de votre Supabase et cliquez sur "Run".
-- ====================================================================

-- 1. Nettoyage des anciennes données (évite les violations de contrainte UNIQUE)
DELETE FROM agencies WHERE name IN ('Finexs Voyage', 'Buca Voyage', 'General Express', 'Touristique Express', 'Men Travel');
DELETE FROM users WHERE email IN ('finexs@safetrip.cm', 'buca@safetrip.cm', 'general@safetrip.cm', 'touristique@safetrip.cm', 'men@safetrip.cm');


-- 2. Insertion dans la table centralisée 'users' avec les UUIDs statiques
INSERT INTO users (id, email, password_hash, role) VALUES
  ('f1f1f1f1-2026-4444-8888-000000000001', 'finexs@safetrip.cm', '$2a$10$T7rOxYzyX64kkmutpDpdeeTECSvuQeDVyorZ7IejWNehuyG0EiTmi', 'agency'),
  ('b1b1b1b1-2026-4444-8888-000000000001', 'buca@safetrip.cm', '$2a$10$T7rOxYzyX64kkmutpDpdeeTECSvuQeDVyorZ7IejWNehuyG0EiTmi', 'agency'),
  ('e1e1e1e1-2026-4444-8888-000000000001', 'general@safetrip.cm', '$2a$10$T7rOxYzyX64kkmutpDpdeeTECSvuQeDVyorZ7IejWNehuyG0EiTmi', 'agency'),
  ('d1d1d1d1-2026-4444-8888-000000000001', 'touristique@safetrip.cm', '$2a$10$T7rOxYzyX64kkmutpDpdeeTECSvuQeDVyorZ7IejWNehuyG0EiTmi', 'agency'),
  ('a2a2a2a2-2026-4444-8888-000000000001', 'men@safetrip.cm', '$2a$10$T7rOxYzyX64kkmutpDpdeeTECSvuQeDVyorZ7IejWNehuyG0EiTmi', 'agency');

-- 3. Insertion dans la table 'agencies' avec les profils détaillés
INSERT INTO agencies (id, user_id, name, logo, photo, certification, phone, address, description) VALUES
  (1, 'f1f1f1f1-2026-4444-8888-000000000001', 'Finexs Voyage', '/images/finexs.png', '/images/finexs.png', 'Partenaire Platine', '+237 699 90 90 90', 'Douala - Rue Akwa, Cameroun', 'Pionnier du transport VIP interurbain sécurisé au Cameroun. Voyages quotidiens Douala - Yaoundé.'),
  (2, 'b1b1b1b1-2026-4444-8888-000000000001', 'Buca Voyage', '/images/bucavoyage.png', '/images/bucavoyage.png', 'Partenaire Or', '+237 677 80 80 80', 'Douala - Bessengue, Cameroun', 'Agence de voyage confort et classique au service de la population camerounaise.'),
  (3, 'e1e1e1e1-2026-4444-8888-000000000001', 'General Express', '/images/General.png', '/images/General.png', 'Partenaire Certifié', '+237 655 70 70 70', 'Douala - Bessengue, Cameroun', 'Transport interurbain accessible et fiable pour tous les camerounais.'),
  (4, 'd1d1d1d1-2026-4444-8888-000000000001', 'Touristique Express', '/images/Touristique.png', '/images/Touristique.png', 'Partenaire National', '+237 691 60 60 60', 'Douala - Akwa, Cameroun', 'Leader du transport VIP touristique au Cameroun. Destinations : Kribi, Limbé, Bamenda.'),
  (5, 'a2a2a2a2-2026-4444-8888-000000000001', 'Men Travel', '/images/mentravel.png', '/images/mentravel.png', 'Partenaire Premium', '+237 670 50 50 50', 'Douala - Carrefour Akwa, Cameroun', 'Transport Executive Class haut de gamme avec restauration à bord et confort incomparable.');
