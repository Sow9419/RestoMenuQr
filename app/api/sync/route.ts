import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/shared/lib/supabaseServer';
import { DEFAULT_CONFIG } from '@/lib/defaultData';
import { RestaurantConfig, Order, OrderStatus, OrderType, MenuItem, MenuCategory } from '@/lib/restoTypes';

export const dynamic = 'force-dynamic';

// In-memory fallback persistence to keep the application 100% operational 
// if Supabase is partially offline or in transitional state
let inMemoryConfig: RestaurantConfig = { ...DEFAULT_CONFIG };
let inMemoryOrders: Order[] = [];

/**
 * Resolves the restaurant ID or SLUG from the request referer or session
 */
async function getTargetRestaurant(req: NextRequest, supabase: any) {
  const referer = req.headers.get('referer');
  let restaurantSlug = '';
  let restaurantId = '';

  // 1. Try to get restaurant from active auth session
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile?.restaurant_id) {
        restaurantId = profile.restaurant_id;
      }
    }
  } catch (err) {
    console.warn('Auth check error in sync api:', err);
  }

  // 2. If no auth session, parse the referer URL path segment
  if (!restaurantId && referer) {
    try {
      const url = new URL(referer);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const first = segments[0];
        if (!['login', 'onboarding', 'api', 'invite'].includes(first)) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(first);
          if (isUuid) {
            restaurantId = first;
          } else {
            restaurantSlug = first;
          }
        }
      }
    } catch (e) {
      console.error('Error parsing referer URL', e);
    }
  }

  return { restaurantId, restaurantSlug };
}

/**
 * GET - Synchro des données de configuration et commandes du restaurant
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { restaurantId, restaurantSlug } = await getTargetRestaurant(req, supabase);

    if (!restaurantId && !restaurantSlug) {
      return NextResponse.json({
        config: inMemoryConfig,
        orders: inMemoryOrders
      });
    }

    // Query restaurant record
    let rQuery = supabase.from('restaurants').select('*');
    if (restaurantId) {
      rQuery = rQuery.eq('id', restaurantId);
    } else {
      rQuery = rQuery.eq('slug', restaurantSlug);
    }

    const { data: restaurant, error: rError } = await rQuery.maybeSingle();

    if (rError || !restaurant) {
      return NextResponse.json({
        config: inMemoryConfig,
        orders: inMemoryOrders
      });
    }

    const tId = restaurant.id;

    // Parallel fetch config, categories, products, sections, settings and orders
    const [
      { data: categories },
      { data: products },
      { data: settings },
      { data: sections },
      { data: ordersData }
    ] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', tId).order('sort_order', { ascending: true }),
      supabase.from('products').select('*, categories!inner(restaurant_id)').eq('categories.restaurant_id', tId).order('sort_order', { ascending: true }),
      supabase.from('page_settings').select('*').eq('restaurant_id', tId).maybeSingle(),
      supabase.from('page_sections').select('*').eq('restaurant_id', tId),
      supabase.from('orders').select('*').eq('restaurant_id', tId).order('created_at', { ascending: false })
    ]);

    // Build categories list
    const mappedCategories: MenuCategory[] = (categories || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || 'Utensils',
      order: cat.sort_order || 0
    }));

    // Build products list
    const mappedItems: MenuItem[] = (products || []).map(prod => ({
      id: prod.id,
      categoryId: prod.category_id,
      name: prod.name,
      description: prod.description || '',
      price: Number(prod.price) || 0,
      imageUrl: prod.image_url || '',
      isAvailable: prod.is_available ?? true,
      salesCount: prod.sales_count || 0
    }));

    // Build style configurations
    const rawStyle = settings || {};
    const mappedStyle = {
      displayMode: (rawStyle.display_mode || 'light') as any,
      accentColor: rawStyle.accent_color || '#C2410C',
      fontFamily: rawStyle.font_family || 'font-serif',
      heroBannerUrl: rawStyle.hero_banner_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
      heroTitle: rawStyle.hero_title || 'Cuisine d\'Exception',
      heroDescription: rawStyle.hero_description || 'Commandes sur place faciles et instantanées.',
      density: (rawStyle.density || 'confortable') as any,
      backgroundImageUrl: rawStyle.display_mode === 'dark' ? 'modern-dark' : 'cream',
      overlayOpacity: rawStyle.overlay_opacity ?? 25,
      glassmorphism: rawStyle.glassmorphism ?? true,
      showCategoryIcons: true,
      currency: rawStyle.currency || 'FCFA'
    };

    // Build page sections
    const mappedSections = (sections && sections.length > 0)
      ? sections.map((sec: any) => ({
          id: sec.section_key,
          name: sec.section_key,
          label: sec.label,
          enabled: sec.is_enabled
        }))
      : DEFAULT_CONFIG.sections;

    const dbConfig: RestaurantConfig = {
      id: tId,
      slug: restaurant.slug,
      name: restaurant.name,
      phone: restaurant.phone || '',
      address: restaurant.address || '',
      isOpen: restaurant.is_open ?? true,
      sections: mappedSections,
      style: mappedStyle,
      categories: mappedCategories,
      items: mappedItems
    };

    // Update memory cache
    inMemoryConfig = dbConfig;

    // Fetch and assemble orders with nested order items
    let mappedOrders: Order[] = [];
    if (ordersData && ordersData.length > 0) {
      const orderIds = ordersData.map(o => o.id);
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      mappedOrders = ordersData.map(ord => {
        const rawItems = (orderItems || []).filter(item => item.order_id === ord.id);
        const mappedItems = rawItems.map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          quantity: item.quantity || 1
        }));

        return {
          id: ord.id,
          ticketNumber: ord.ticket_number || '#A00',
          createdAt: ord.created_at,
          type: (ord.type || 'DINE_IN') as OrderType,
          status: (ord.status || 'PENDING') as OrderStatus,
          items: mappedItems,
          totalPrice: Number(ord.total_price) || 0,
          restaurantSlug: restaurant.slug,
          whatsappNumber: ord.whatsapp_number,
          customerName: ord.customer_name,
          deliveryAddress: ord.delivery_address,
          deliveryNotes: ord.delivery_notes
        };
      });

      inMemoryOrders = mappedOrders;
    }

    return NextResponse.json({
      config: dbConfig,
      orders: mappedOrders
    });

  } catch (err) {
    console.error('API GET syncing error, fallback to memory storage:', err);
    return NextResponse.json({
      config: inMemoryConfig,
      orders: inMemoryOrders
    });
  }
}

/**
 * POST - Mutations et mises à jour de configuration or d'états
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { action, data } = await req.json();
    const { restaurantId } = await getTargetRestaurant(req, supabase);

    if (!restaurantId) {
      // Memory state fallback update
      if (action === 'update_config') {
        inMemoryConfig = { ...inMemoryConfig, ...data };
      } else if (action === 'add_order') {
        const newOrder = {
          ...data,
          id: data.id || `ord-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          status: 'PENDING'
        };
        inMemoryOrders = [newOrder, ...inMemoryOrders];
        return NextResponse.json({ success: true, order: newOrder, config: inMemoryConfig });
      } else if (action === 'update_order_status') {
        inMemoryOrders = inMemoryOrders.map(ord => ord.id === data.orderId ? { ...ord, status: data.status } : ord);
      } else if (action === 'delete_order') {
        inMemoryOrders = inMemoryOrders.filter(ord => ord.id !== data.orderId);
      } else if (action === 'reset') {
        inMemoryConfig = { ...DEFAULT_CONFIG };
        inMemoryOrders = [];
      }
      return NextResponse.json({ success: true, config: inMemoryConfig, orders: inMemoryOrders });
    }

    // Database integrations
    if (action === 'update_config') {
      const configData: RestaurantConfig = data;

      // 1. Update basic information in restaurants
      await supabase
        .from('restaurants')
        .update({
          name: configData.name,
          phone: configData.phone,
          address: configData.address,
          is_open: configData.isOpen,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId);

      // 2. Update aesthetic style settings in page_settings
      const { style } = configData;
      if (style) {
        // Find if page_settings row exists, if not insert, else update
        const { data: existingSettings } = await supabase
          .from('page_settings')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        const psData = {
          restaurant_id: restaurantId,
          template_layout: style.displayMode === 'dark' ? 'premium' : 'classic',
          accent_color: style.accentColor,
          font_family: style.fontFamily,
          hero_title: style.heroTitle,
          hero_description: style.heroDescription,
          hero_banner_url: style.heroBannerUrl,
          display_mode: style.displayMode,
          overlay_opacity: style.overlayOpacity,
          glassmorphism: style.glassmorphism,
          density: style.density,
          currency: style.currency,
          updated_at: new Date().toISOString()
        };

        if (existingSettings) {
          await supabase.from('page_settings').update(psData).eq('restaurant_id', restaurantId);
        } else {
          await supabase.from('page_settings').insert([psData]);
        }
      }

      // 3. Update sections state in page_sections
      if (configData.sections && configData.sections.length > 0) {
        // For simple sync, delete old sections and reinsert cleanly
        await supabase.from('page_sections').delete().eq('restaurant_id', restaurantId);
        const secInsertData = configData.sections.map(sec => ({
          restaurant_id: restaurantId,
          section_key: sec.name,
          label: sec.label,
          is_enabled: sec.enabled
        }));
        await supabase.from('page_sections').insert(secInsertData);
      }

      // 4. Categories Updates
      if (configData.categories) {
        for (const cat of configData.categories) {
          // Check if it exists in DB (UUID check vs local mock ID check)
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cat.id);
          if (isUuid) {
            await supabase.from('categories').update({
              name: cat.name,
              icon: cat.icon,
              sort_order: cat.order
            }).eq('id', cat.id);
          } else {
            // New Category to Insert
            await supabase.from('categories').insert([{
              restaurant_id: restaurantId,
              name: cat.name,
              icon: cat.icon,
              sort_order: cat.order
            }]);
          }
        }
      }

      // 5. Products Updates
      if (configData.items) {
        for (const item of configData.items) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
          const isCategoryUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.categoryId);
          
          if (isCategoryUuid) {
            const prodData = {
              category_id: item.categoryId,
              name: item.name,
              description: item.description,
              price: item.price,
              is_available: item.isAvailable,
              image_url: item.imageUrl,
              sales_count: item.salesCount
            };

            if (isUuid) {
              await supabase.from('products').update(prodData).eq('id', item.id);
            } else {
              await supabase.from('products').insert([prodData]);
            }
          }
        }
      }

    } else if (action === 'add_order') {
      const orderPayload: Partial<Order> = data;

      // Create new Order row in database
      const { data: insertedOrder, error: orderInsertError } = await supabase
        .from('orders')
        .insert([{
          restaurant_id: restaurantId,
          ticket_number: orderPayload.ticketNumber || `#A${Math.floor(Math.random() * 90) + 10}`,
          type: orderPayload.type || 'DINE_IN',
          status: 'PENDING',
          total_price: orderPayload.totalPrice || 0,
          customer_name: orderPayload.customerName || '',
          whatsapp_number: orderPayload.whatsappNumber || '',
          delivery_address: orderPayload.deliveryAddress || '',
          delivery_notes: orderPayload.deliveryNotes || ''
        }])
        .select()
        .single();

      if (orderInsertError || !insertedOrder) {
        throw new Error(orderInsertError?.message || 'Failed to insert order into DB');
      }

      // Add order items
      if (orderPayload.items && orderPayload.items.length > 0) {
        const orderItemsToInsert = orderPayload.items.map(item => ({
          order_id: insertedOrder.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));

        await supabase.from('order_items').insert(orderItemsToInsert);
      }

      const returnOrder: Order = {
        id: insertedOrder.id,
        ticketNumber: insertedOrder.ticket_number,
        createdAt: insertedOrder.created_at,
        type: insertedOrder.type as OrderType,
        status: insertedOrder.status as OrderStatus,
        items: orderPayload.items || [],
        totalPrice: Number(insertedOrder.total_price),
        restaurantSlug: inMemoryConfig.slug,
        whatsappNumber: insertedOrder.whatsapp_number,
        customerName: insertedOrder.customer_name,
        deliveryAddress: insertedOrder.delivery_address,
        deliveryNotes: insertedOrder.delivery_notes
      };

      return NextResponse.json({ success: true, order: returnOrder });

    } else if (action === 'update_order_status') {
      await supabase
        .from('orders')
        .update({ status: data.status })
        .eq('id', data.orderId);

    } else if (action === 'delete_order') {
      await supabase
        .from('orders')
        .delete()
        .eq('id', data.orderId);

    } else if (action === 'reset') {
      // Clear data for this restaurant and restore Defaults
      await supabase.from('orders').delete().eq('restaurant_id', restaurantId);
      await supabase.from('categories').delete().eq('restaurant_id', restaurantId);
      await supabase.from('page_sections').delete().eq('restaurant_id', restaurantId);
      await supabase.from('page_settings').delete().eq('restaurant_id', restaurantId);

      // Reinsert defaults
      const { data: restRec } = await supabase.from('restaurants').select('slug').eq('id', restaurantId).single();
      const slug = restRec?.slug || 'le-palais-du-chef';

      await supabase.from('page_settings').insert([{
        restaurant_id: restaurantId,
        template_layout: 'classic',
        accent_color: '#C2410C',
        font_family: 'font-serif',
        hero_title: 'Cuisine d\'Exception & Ambiance Feutrée',
        hero_description: 'Digitalisez vos repas et passez vos commandes directement sur place.',
        hero_banner_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
        display_mode: 'light',
        overlay_opacity: 25,
        glassmorphism: true,
        density: 'comfortable',
        currency: 'FCFA'
      }]);

      const secInsertData = DEFAULT_CONFIG.sections.map(sec => ({
        restaurant_id: restaurantId,
        section_key: sec.name,
        label: sec.label,
        is_enabled: sec.enabled
      }));
      await supabase.from('page_sections').insert(secInsertData);

      // Reinsert default categories
      const { data: cats } = await supabase.from('categories').insert(
        ['cat-burgers', 'cat-pizzas', 'cat-drinks', 'cat-desserts'].map((oldId, i) => {
          const names = ['Burgers Gourmets', 'Pizzas Feu de Bois', 'Boissons & Cocktails', 'Desserts Fins'];
          const icons = ['Beef', 'Pizza', 'CupSoda', 'Cake'];
          return {
            restaurant_id: restaurantId,
            name: names[i],
            icon: icons[i],
            sort_order: i
          };
        })
      ).select();

      // Seed default products
      if (cats && cats.length === 4) {
        const prodData = [
          { category_id: cats[0].id, name: 'Burger Truffe & Cancoillotte', description: 'Steak de bœuf breton, crème de truffe blanche, cancoillotte coulante, roquette fraîche, pain brioché croustillant.', price: 11900, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400', is_available: true, sales_count: 84 },
          { category_id: cats[0].id, name: 'Le Smash Double Bacon', description: 'Deux smash patties ultra-ffins croustillants, double cheddar orange affiné, tranches de bacon fumé croustillant, sauce maison secrète.', price: 9500, image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=400', is_available: true, sales_count: 142 },
          { category_id: cats[1].id, name: 'La Truffata Bianca', description: 'Base crème fraîche aromatisée aux truffes, mozzarella fior di latte, speck italien croustillant, burrata entière coulante déposée après cuisson.', price: 12500, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400', is_available: true, sales_count: 95 },
          { category_id: cats[1].id, name: 'La Reine du Vésuve', description: 'Sauce tomate aux herbes fraîches, jambon blanc rôti aux herbes, cœurs d\'artichauts marinés, mozzarella fraîche fondante et olives noires.', price: 8900, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=400', is_available: true, sales_count: 57 },
          { category_id: cats[2].id, name: 'Limonade Romarin Hibiscus', description: 'Limonade pressée maison infusée aux fleurs d\'hibiscus bio et romarin du jardin, servie glacée.', price: 3200, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400', is_available: true, sales_count: 220 },
          { category_id: cats[2].id, name: 'Bière Artisanal IPA d\'or', description: 'Bière blonde locale brassée sur place, aux arômes d\'agrumes et d\'herbes fraîches. Légèrement amère.', price: 4500, image_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=400', is_available: false, sales_count: 12 },
          { category_id: cats[3].id, name: 'Tiramisu Cœur Pistache', description: 'Mascarpone fouettée onctueuse, biscuits cuillères imbibés au café serré, ganache fondante à la pistache de Sicile.', price: 5400, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=400', is_available: true, sales_count: 110 }
        ];
        await supabase.from('products').insert(prodData);
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('API POST sync error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server mutation error' });
  }
}
