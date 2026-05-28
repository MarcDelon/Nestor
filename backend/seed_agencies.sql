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

-- ====================================================================
-- SEED : VOUCHERS (bons de réduction admin exemples)
-- ====================================================================
DELETE FROM vouchers WHERE code IN ('BIENVENUE10', 'NOEL25', 'FIDELITE15');
INSERT INTO vouchers (code, percentage, max_uses, current_uses, status) VALUES
  ('BIENVENUE10', 10, 500, 0, 'published'),
  ('NOEL25',      25,  50, 0, 'published'),
  ('FIDELITE15',  15, 200, 0, 'draft');

-- ====================================================================
-- SEED : DEMANDES DE SERVICE EXEMPLE
-- ====================================================================
DELETE FROM service_requests WHERE client_phone IN ('+237 699 11 22 33', '+237 677 44 55 66');
INSERT INTO service_requests (agency_id, request_type, client_name, client_email, client_phone, description, preferred_date, origin_city, destination_city, status) VALUES
  (1, 'envoi_colis', 'Alice Mbarga', 'alice@example.cm', '+237 699 11 22 33',
   'J''ai un colis fragile (électronique) à envoyer de Douala à Yaoundé sans me déplacer. Besoin d''une collecte à domicile.',
   '2026-06-15', 'Douala', 'Yaoundé', 'nouveau'),
  (3, 'livraison', 'Bernard Talla', null, '+237 677 44 55 66',
   'Demande de livraison de documents urgents depuis Bafoussam vers Douala. Je ne peux pas me déplacer cette semaine.',
   '2026-06-10', 'Bafoussam', 'Douala', 'en_cours');
