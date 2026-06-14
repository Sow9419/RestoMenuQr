-- ==========================================
-- Tenant Isolation Validation Scripts
-- Exécuter ces tests pour valider le cloisonnement absolu des données
-- entre différents restaurants/tenants.
-- ==========================================

-- Test 1: Vérifier qu'un utilisateur d'un restaurant A ne peut pas
-- lire les catégories d'un restaurant B via l'API authentifiée
-- (Ce test est conceptuel — à exécuter manuellement via Supabase Dashboard SQL Editor)

-- Prérequis: Remplacer les UUIDs par des valeurs réelles de votre base
-- SELECT * FROM categories WHERE restaurant_id = '<restaurant_B_id>';
-- Résultat attendu: 0 lignes (si l'utilisateur connecté n'appartient pas au restaurant B)

-- Test 2: Vérifier la contrainte d'unicité sur le slug
INSERT INTO public.restaurants (owner_id, organization_id, name, slug, phone, address)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Test Dup', 'slug-deja-existant', '+221770000001', 'Test')
ON CONFLICT (slug) DO NOTHING;
-- Résultat attendu: Soit la ligne n'est pas insérée, soit une erreur d'unicité est levée

-- Test 3: Vérifier que ERB_SLUG_IMMUTABLE est bien retourné par le code applicatif
-- (test d'intégration, pas SQL)
-- Appeler createRestaurantWithOrg({ name: 'X', slug: 'slug-deja-existant' })
-- Résultat attendu: { success: false, error: { code: 'ERR_SLUG_IMMUTABLE' } }

-- Test 4: Vérifier que RLS empêche un authenticated (restaurant A)
-- de modifier les produits du restaurant B
-- UPDATE products SET name = 'Hack' WHERE id = '<product_id_from_restaurant_B>';
-- Résultat attendu: 0 lignes affectées (RLS bloque)

-- Test 5: Vérifier que le service_role peut bypass RLS
-- (utilisé par onboardingActions et webhooks)
-- SELECT * FROM products; -- via service_role
-- Résultat attendu: Tous les produits (service_role bypass RLS)

-- Test 6: Listing des politiques RLS actives
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 7: Vérifier que les GRANTs sont corrects
SELECT
    table_schema,
    table_name,
    string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) as privileges,
    string_agg(DISTINCT grantee, ', ' ORDER BY grantee) as grantees
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('restaurants', 'categories', 'products', 'orders', 'order_items', 'profiles', 'invitations', 'page_settings', 'page_sections')
GROUP BY table_schema, table_name
ORDER BY table_name;
