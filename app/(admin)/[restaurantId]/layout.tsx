import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/shared/lib/supabaseServer';
import MenuInitializer from '@/features/menu/components/MenuInitializer';
import CollapsibleSidebar from '@/components/CollapsibleSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ restaurantId: string }>;
}

/**
 * Layout auth guard pour toutes les routes admin.
 * Vérifie : session valide + profil utilisateur pour le restaurantId demandé.
 * Voir : ARCHITECTURE.md App Router + ROLES_AND_PERMISSIONS.md
 *
 * Le MenuInitializer (client) est monté ici pour hydrater le store Zustand
 * dès l'entrée dans l'espace admin — remplace RestoProvider + fetch('/api/sync').
 */
export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { restaurantId } = await params;
  const supabase = await getSupabaseServerClient();

  // Vérification de session (source de vérité : auth.getUser, pas getSession)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Vérification du profil pour ce restaurantId spécifique
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, restaurant_id, organization_id')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId)
    .single();

  if (profileError || !profile) {
    // Pas de profil pour ce restaurant — chercher si l'utilisateur a un autre restaurant
    const { data: anyProfile } = await supabase
      .from('profiles')
      .select('restaurant_id')
      .eq('user_id', user.id)
      .not('restaurant_id', 'is', null)
      .single();

    if (anyProfile?.restaurant_id) {
      redirect(`/${anyProfile.restaurant_id}/builder`);
    } else {
      redirect('/onboarding');
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg" data-restaurant-id={restaurantId}>
      {/* Hydrate le store Zustand pour l'espace admin */}
      <MenuInitializer restaurantId={restaurantId} />
      <CollapsibleSidebar />
      <main className="flex-1 overflow-y-auto h-full">{children}</main>
    </div>
  );
}
