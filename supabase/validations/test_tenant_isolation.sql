-- ==========================================
-- Tenant Isolation Validation Scripts
-- Execute ces tests pour valider le cloisonnement absolu des donnees
-- entre differents restaurants/tenants.
-- ==========================================

-- Test 1: Verifier qu'un utilisateur d'un restaurant A ne peut pas
-- lire les categories d'un restaurant B via l'API authentifiee
-- (Ce test est conceptuel — a executer manuellement via Supabase Dashboard SQL Editor)

-- Prerequis: Remplacer les UUIDs par des valeurs reelles de votre base
-- SELECT * FROM categories WHERE restaurant_id = '<restaurant_B_id>';
-- Resultat attendu: 0 lignes (si l'utilisateur connecte n'appartient pas au restaurant B)

-- Test 2: Verifier la contrainte d'unicite sur le slug
-- Tente d'inserer un slug deja existant — doit lever une erreur de violation d'unicite
-- INSERT INTO public.restaurants (owner_id, organization_id, name, slug, phone, address)
-- VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Test Dup', 'slug-deja-existant', '+221770000001', 'Test');
-- Resultat attendu: ERROR: duplicate key value violates unique constraint "restaurants_slug_key"

-- Test 3: Verifier que ERR_SLUG_IMMUTABLE est bien retourne par le code applicatif
-- (test d'integration, pas SQL)
-- Appeler createRestaurantWithOrg({ name: 'X', slug: 'slug-deja-existant' })
-- Resultat attendu: { success: false, error: { code: 'ERR_SLUG_IMMUTABLE' } }

-- Test 4: Verifier que RLS empeche un authenticated (restaurant A)
-- de modifier les produits du restaurant B
-- UPDATE products SET name = 'Hack' WHERE id = '<product_id_from_restaurant_B>';
-- Resultat attendu: 0 lignes affectees (RLS bloque)

-- Test 5: Verifier que le service_role peut bypass RLS
-- (utilise par onboardingActions et webhooks)
-- SET LOCAL ROLE service_role;
-- SELECT count(*) FROM products;
-- Resultat attendu: Tous les produits (service_role bypass RLS)

-- Test 6: Verifier que is_open = false bloque la creation de commande
-- Mettre is_open = false sur un restaurant puis tenter createOrder
-- Resultat attendu: { success: false, error: { code: 'ERR_RESTAURANT_CLOSED' } }

-- Test 7: Verifier qu'un anon peut creer une commande mais pas lire celles d'un autre
-- INSERT INTO orders (restaurant_id, ticket_number, total_price, type)
-- VALUES ('<restaurant_id>', '#TEST01', 5000, 'DINE_IN');
-- Puis tenter SELECT depuis role anon:
-- SELECT * FROM orders WHERE restaurant_id = '<restaurant_id>';
-- Resultat attendu: 0 lignes (anon n'a pas de policy SELECT sur orders)

-- Test 8: Verifier ERR_CATEGORY_NOT_EMPTY
-- Tenter de supprimer une categorie qui contient des produits
-- Resultat attendu: { success: false, error: { code: 'ERR_CATEGORY_NOT_EMPTY' } }

-- Test 9: Verifier la contrainte UNIQUE sur page_sections (restaurant_id, section_key)
-- Tenter d'inserer deux sections avec le meme restaurant_id + section_key
-- Resultat attendu: ERROR: duplicate key value violates unique constraint "uniq_restaurant_section"

-- Test 10: Listing des politiques RLS actives
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

-- Test 11: Verifier que les GRANTs sont corrects
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

-- Test 12: Verifier que les index de performance sont bien crees
SELECT
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('restaurants', 'categories', 'products', 'orders', 'order_items', 'profiles', 'invitations', 'page_settings', 'page_sections')
ORDER BY tablename, indexname;
