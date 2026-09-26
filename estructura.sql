


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_single_superadmin"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.role = 'superadmin' THEN
    IF EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE role = 'superadmin' 
        AND id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'Operación denegada: Ya existe un Superadmin registrado. No está permitido tener más de un Superadmin en el sistema.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_single_superadmin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."crear_pedido"("p_nombre" "text", "p_telefono" "text", "p_direccion" "text", "p_unidad" "text", "p_apto" "text", "p_observaciones" "text", "p_pago" "text", "p_subtotal" integer, "p_delivery_fee" integer, "p_total" integer, "p_items" "jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_numero int;
begin
  insert into public.orders
    (nombre, telefono, direccion, unidad, apto, observaciones, pago,
     subtotal, delivery_fee, total, items)
  values
    (p_nombre, p_telefono, p_direccion, p_unidad, p_apto, p_observaciones, p_pago,
     p_subtotal, p_delivery_fee, p_total, p_items)
  returning numero into v_numero;
  return v_numero;
end $$;


ALTER FUNCTION "public"."crear_pedido"("p_nombre" "text", "p_telefono" "text", "p_direccion" "text", "p_unidad" "text", "p_apto" "text", "p_observaciones" "text", "p_pago" "text", "p_subtotal" integer, "p_delivery_fee" integer, "p_total" integer, "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."crear_pedido"("p_nombre" "text", "p_telefono" "text", "p_direccion" "text", "p_unidad" "text", "p_apto" "text", "p_observaciones" "text", "p_pago" "text", "p_subtotal" integer, "p_delivery_fee" integer, "p_total" integer, "p_items" "jsonb", "p_tipo_entrega" "text" DEFAULT 'domicilio'::"text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_numero int;
begin
  insert into public.orders
    (nombre, telefono, direccion, unidad, apto, observaciones, pago, tipo_entrega,
     subtotal, delivery_fee, total, items)
  values
    (p_nombre, p_telefono, p_direccion, p_unidad, p_apto, p_observaciones, p_pago, p_tipo_entrega,
     p_subtotal, p_delivery_fee, p_total, p_items)
  returning numero into v_numero;
  return v_numero;
end $$;


ALTER FUNCTION "public"."crear_pedido"("p_nombre" "text", "p_telefono" "text", "p_direccion" "text", "p_unidad" "text", "p_apto" "text", "p_observaciones" "text", "p_pago" "text", "p_subtotal" integer, "p_delivery_fee" integer, "p_total" integer, "p_items" "jsonb", "p_tipo_entrega" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_cliente_si_no_existe"("p_telefono" "text", "p_nombre" "text" DEFAULT ''::"text", "p_fecha_cumple" "date" DEFAULT NULL::"date") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_clean_phone text;
  v_cliente public.clientes%rowtype;
begin
  v_clean_phone := regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
  if v_clean_phone = '' then
    return null;
  end if;

  -- 1. Validar si ya existe
  select * into v_cliente from public.clientes where telefono = v_clean_phone limit 1;

  if found then
    -- Si existe y se proporciona fecha_cumple cuando antes estaba nula, actualizarla opcionalmente
    if v_cliente.fecha_cumple is null and p_fecha_cumple is not null then
      update public.clientes
      set fecha_cumple = p_fecha_cumple,
          updated_at = now()
      where id = v_cliente.id
      returning * into v_cliente;
    end if;
    return to_jsonb(v_cliente);
  else
    -- 2. Si no existe en 'clientes', verificar si tiene nombre previo en 'orders'
    if p_nombre is null or trim(p_nombre) = '' then
      select nombre into p_nombre from public.orders
      where regexp_replace(telefono, '\D', '', 'g') = v_clean_phone
      limit 1;
    end if;

    -- 3. Crear nuevo registro de cliente
    insert into public.clientes (
      telefono,
      nombre,
      fecha_cumple,
      pedidos_count,
      cant_pedidos_concretados
    )
    values (
      v_clean_phone,
      coalesce(nullif(trim(p_nombre), ''), 'Cliente'),
      p_fecha_cumple,
      0,
      0
    )
    returning * into v_cliente;

    return to_jsonb(v_cliente);
  end if;
end $$;


ALTER FUNCTION "public"."registrar_cliente_si_no_existe"("p_telefono" "text", "p_nombre" "text", "p_fecha_cumple" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_cliente_si_no_existe"("p_telefono" "text", "p_nombre" "text", "p_fecha_cumple" "text" DEFAULT NULL::"text", "p_email" "text" DEFAULT NULL::"text") RETURNS "record"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_cliente record;
BEGIN
    -- Buscar si existe
    SELECT * INTO v_cliente FROM clientes WHERE telefono = p_telefono LIMIT 1;
    
    IF NOT FOUND THEN
        -- Crear si no existe
        INSERT INTO clientes (telefono, nombre, fecha_cumple, email, pedidos_count, cant_pedidos_concretados)
        VALUES (p_telefono, p_nombre, p_fecha_cumple, p_email, 0, 0)
        RETURNING * INTO v_cliente;
    ELSE
        -- Si existe pero le faltan datos (opcional, por si quieres actualizar el email aquí también)
        IF (p_email IS NOT NULL AND v_cliente.email IS NULL) THEN
            UPDATE clientes SET email = p_email WHERE telefono = p_telefono RETURNING * INTO v_cliente;
        END IF;
    END IF;
    
    RETURN v_cliente;
END;
$$;


ALTER FUNCTION "public"."registrar_cliente_si_no_existe"("p_telefono" "text", "p_nombre" "text", "p_fecha_cumple" "text", "p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."additions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "precio" integer DEFAULT 0 NOT NULL,
    "disponible" boolean DEFAULT true NOT NULL,
    "orden" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."additions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "precio" numeric DEFAULT 0,
    "disponible" boolean DEFAULT true,
    "orden" integer DEFAULT 0
);


ALTER TABLE "public"."bases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_design" (
    "id" integer DEFAULT 1 NOT NULL,
    "bg_color" "text" DEFAULT '#fecdcd'::"text" NOT NULL,
    "card_bg" "text" DEFAULT '#fdfbf7'::"text" NOT NULL,
    "header_badge_bg" "text" DEFAULT 'rgba(255, 255, 255, 0.75)'::"text" NOT NULL,
    "header_badge_text" "text" DEFAULT '#b4232e'::"text" NOT NULL,
    "text_primary" "text" DEFAULT '#3d2314'::"text" NOT NULL,
    "text_muted" "text" DEFAULT '#7a6353'::"text" NOT NULL,
    "font_family" "text" DEFAULT 'Montserrat'::"text" NOT NULL,
    "border_color" "text" DEFAULT 'rgba(61, 35, 20, 0.08)'::"text" NOT NULL,
    "card_radius" "text" DEFAULT '20px'::"text" NOT NULL,
    "card_shadow" "text" DEFAULT 'md'::"text" NOT NULL,
    "btn_primary_bg" "text" DEFAULT '#d92b38'::"text" NOT NULL,
    "btn_primary_text" "text" DEFAULT '#ffffff'::"text" NOT NULL,
    "btn_details_bg" "text" DEFAULT 'transparent'::"text" NOT NULL,
    "btn_details_text" "text" DEFAULT '#3d2314'::"text" NOT NULL,
    "btn_details_border" "text" DEFAULT 'rgba(61, 35, 20, 0.12)'::"text" NOT NULL,
    "price_tag_bg" "text" DEFAULT '#3d2314'::"text" NOT NULL,
    "price_tag_text" "text" DEFAULT '#ffffff'::"text" NOT NULL,
    "badge_popular_bg" "text" DEFAULT '#d92b38'::"text" NOT NULL,
    "badge_popular_text" "text" DEFAULT '#ffffff'::"text" NOT NULL,
    "category_bar_bg" "text" DEFAULT 'rgba(255, 255, 255, 0.7)'::"text" NOT NULL,
    "category_active_bg" "text" DEFAULT '#d92b38'::"text" NOT NULL,
    "category_active_text" "text" DEFAULT '#ffffff'::"text" NOT NULL,
    "category_inactive_bg" "text" DEFAULT 'transparent'::"text" NOT NULL,
    "category_inactive_text" "text" DEFAULT '#7a6353'::"text" NOT NULL,
    "columns_desktop" "text" DEFAULT 'auto'::"text" NOT NULL,
    "columns_mobile" "text" DEFAULT '1'::"text" NOT NULL,
    "card_layout" "text" DEFAULT 'vertical'::"text" NOT NULL,
    "image_aspect_ratio" "text" DEFAULT '4/3'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "app_bg" "text" DEFAULT '#fdfbf7'::"text" NOT NULL,
    "hero_bg" "text" DEFAULT 'linear-gradient(180deg, #fdf1f1 0%, #fecdcd 100%)'::"text" NOT NULL,
    "hero_header_bg" "text" DEFAULT 'rgba(255, 255, 255, 0.72)'::"text" NOT NULL,
    "hero_cta_bg" "text" DEFAULT '#d92b38'::"text" NOT NULL,
    "hero_cta_text" "text" DEFAULT '#ffffff'::"text" NOT NULL,
    "hero_badge_bg" "text" DEFAULT 'rgba(255, 255, 255, 0.92)'::"text" NOT NULL,
    "hero_badge_text" "text" DEFAULT '#d92b38'::"text" NOT NULL,
    "hero_float_cart_bg" "text" DEFAULT '#3d2314'::"text" NOT NULL,
    "hero_float_cart_text" "text" DEFAULT '#ffffff'::"text" NOT NULL,
    "show_promotions" boolean DEFAULT true NOT NULL,
    "promotions_title" "text" DEFAULT 'Promociones & Especiales'::"text" NOT NULL,
    "promotions_subtitle" "text" DEFAULT 'Aprovecha nuestras ofertas por tiempo limitado en tus postres favoritos'::"text" NOT NULL,
    "promotions_bg" "text" DEFAULT '#fff5f5'::"text" NOT NULL,
    "promotions_card_bg" "text" DEFAULT '#ffffff'::"text" NOT NULL,
    "promotions_accent" "text" DEFAULT '#d92b38'::"text" NOT NULL,
    "promotions_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "show_combos" boolean DEFAULT true NOT NULL,
    "combos_title" "text" DEFAULT 'Combos & Packs para Compartir'::"text" NOT NULL,
    "combos_subtitle" "text" DEFAULT 'Las combinaciones perfectas al mejor precio para tus momentos dulces'::"text" NOT NULL,
    "combos_bg" "text" DEFAULT '#fbf8f3'::"text" NOT NULL,
    "combos_card_bg" "text" DEFAULT '#ffffff'::"text" NOT NULL,
    "combos_accent" "text" DEFAULT '#d92b38'::"text" NOT NULL,
    "combos_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "footer_bg" "text" DEFAULT 'linear-gradient(180deg, #1a0f08 0%, #0d0705 100%)'::"text" NOT NULL,
    "footer_text" "text" DEFAULT 'rgba(255, 255, 255, 0.7)'::"text" NOT NULL,
    "footer_accent" "text" DEFAULT '#d92b38'::"text" NOT NULL,
    CONSTRAINT "catalog_design_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."catalog_design" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "emoji" "text" DEFAULT ''::"text" NOT NULL,
    "label" "text" DEFAULT ''::"text" NOT NULL,
    "orden" integer DEFAULT 0 NOT NULL,
    "visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "telefono" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "pedidos_count" integer DEFAULT 0 NOT NULL,
    "cant_pedidos_concretados" integer DEFAULT 0 NOT NULL,
    "fecha_cumple" "date",
    "notas" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text"
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "numero" integer NOT NULL,
    "nombre" "text" NOT NULL,
    "telefono" "text" NOT NULL,
    "direccion" "text" DEFAULT ''::"text" NOT NULL,
    "unidad" "text" DEFAULT ''::"text" NOT NULL,
    "apto" "text" DEFAULT ''::"text" NOT NULL,
    "pago" "text" DEFAULT ''::"text" NOT NULL,
    "subtotal" integer DEFAULT 0 NOT NULL,
    "delivery_fee" integer DEFAULT 0 NOT NULL,
    "total" integer DEFAULT 0 NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "estado" "text" DEFAULT 'nuevo'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "observaciones" "text" DEFAULT ''::"text" NOT NULL,
    "tipo_entrega" "text" DEFAULT 'domicilio'::"text" NOT NULL,
    "delivery_lat" double precision,
    "delivery_lng" double precision,
    "delivery_distance_km" double precision,
    "delivery_address_full" "text" DEFAULT ''::"text" NOT NULL,
    CONSTRAINT "orders_estado_check" CHECK (("estado" = ANY (ARRAY['nuevo'::"text", 'preparacion'::"text", 'camino'::"text", 'entregado'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


ALTER TABLE "public"."orders" ALTER COLUMN "numero" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."orders_numero_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text",
    "icono" "text" DEFAULT 'CreditCard'::"text",
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_additions" (
    "product_id" "uuid" NOT NULL,
    "addition_id" "uuid" NOT NULL,
    "requerido" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."product_additions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_sauces" (
    "product_id" "uuid" NOT NULL,
    "sauce_id" "uuid" NOT NULL,
    "requerido" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."product_sauces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "category_id" "uuid",
    "descripcion" "text" DEFAULT ''::"text" NOT NULL,
    "precio" integer DEFAULT 0 NOT NULL,
    "imagen_url" "text" DEFAULT ''::"text" NOT NULL,
    "destacado" boolean DEFAULT false NOT NULL,
    "disponible" boolean DEFAULT true NOT NULL,
    "nota" "text" DEFAULT ''::"text" NOT NULL,
    "orden" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tiempo_preparacion_horas" integer DEFAULT 4
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sauces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "precio" integer DEFAULT 0 NOT NULL,
    "disponible" boolean DEFAULT true NOT NULL,
    "orden" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sauces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "phone" "text" DEFAULT ''::"text" NOT NULL,
    "address" "text" DEFAULT ''::"text" NOT NULL,
    "maps_url" "text" DEFAULT ''::"text" NOT NULL,
    "instagram" "text" DEFAULT ''::"text" NOT NULL,
    "facebook" "text" DEFAULT ''::"text" NOT NULL,
    "tiktok" "text" DEFAULT ''::"text" NOT NULL,
    "day1" "text" DEFAULT ''::"text" NOT NULL,
    "hours1" "text" DEFAULT ''::"text" NOT NULL,
    "delivery_fee" integer DEFAULT 3500 NOT NULL,
    "free_delivery_threshold" integer DEFAULT 45000 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "offers_delivery" boolean DEFAULT true NOT NULL,
    "offers_pickup" boolean DEFAULT true NOT NULL,
    "force_closed" boolean DEFAULT false NOT NULL,
    "offersLocal" boolean,
    "logo_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "can_change_password" boolean DEFAULT true NOT NULL,
    "razon_social" "text",
    "bank_accounts" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "slogan" "text" DEFAULT 'EL VERDADERO SABOR DEL PAVÉ'::"text",
    "store_lat" double precision,
    "store_lng" double precision,
    "base_delivery_fee" integer DEFAULT 3000 NOT NULL,
    "price_per_km" integer DEFAULT 1500 NOT NULL,
    "max_delivery_radius_km" double precision DEFAULT 15 NOT NULL,
    "dynamic_delivery_enabled" boolean DEFAULT false NOT NULL,
    "useCustomerBadges" boolean DEFAULT true NOT NULL,
    CONSTRAINT "settings_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sizes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "precio" numeric DEFAULT 0,
    "disponible" boolean DEFAULT true,
    "orden" integer DEFAULT 0
);


ALTER TABLE "public"."sizes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "telefono" "text" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "store_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."store_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['superadmin'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."additions"
    ADD CONSTRAINT "additions_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."additions"
    ADD CONSTRAINT "additions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bases"
    ADD CONSTRAINT "bases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_design"
    ADD CONSTRAINT "catalog_design_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_telefono_key" UNIQUE ("telefono");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_numero_key" UNIQUE ("numero");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_additions"
    ADD CONSTRAINT "product_additions_pkey" PRIMARY KEY ("product_id", "addition_id");



ALTER TABLE ONLY "public"."product_sauces"
    ADD CONSTRAINT "product_sauces_pkey" PRIMARY KEY ("product_id", "sauce_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sauces"
    ADD CONSTRAINT "sauces_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."sauces"
    ADD CONSTRAINT "sauces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sizes"
    ADD CONSTRAINT "sizes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_ratings"
    ADD CONSTRAINT "store_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



CREATE INDEX "clientes_telefono_idx" ON "public"."clientes" USING "btree" ("telefono");



CREATE UNIQUE INDEX "only_one_superadmin_idx" ON "public"."user_roles" USING "btree" ("role") WHERE ("role" = 'superadmin'::"text");



CREATE INDEX "orders_created_at_idx" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "orders_estado_idx" ON "public"."orders" USING "btree" ("estado");



CREATE INDEX "product_additions_product_idx" ON "public"."product_additions" USING "btree" ("product_id");



CREATE INDEX "product_sauces_product_idx" ON "public"."product_sauces" USING "btree" ("product_id");



CREATE INDEX "products_category_idx" ON "public"."products" USING "btree" ("category_id");



CREATE OR REPLACE TRIGGER "catalog_design_updated_at" BEFORE UPDATE ON "public"."catalog_design" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "clientes_updated_at" BEFORE UPDATE ON "public"."clientes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "settings_updated_at" BEFORE UPDATE ON "public"."settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_check_single_superadmin" BEFORE INSERT OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."check_single_superadmin"();



ALTER TABLE ONLY "public"."product_additions"
    ADD CONSTRAINT "product_additions_addition_id_fkey" FOREIGN KEY ("addition_id") REFERENCES "public"."additions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_additions"
    ADD CONSTRAINT "product_additions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_sauces"
    ADD CONSTRAINT "product_sauces_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_sauces"
    ADD CONSTRAINT "product_sauces_sauce_id_fkey" FOREIGN KEY ("sauce_id") REFERENCES "public"."sauces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Bases public delete" ON "public"."bases" FOR DELETE USING (true);



CREATE POLICY "Bases public insert" ON "public"."bases" FOR INSERT WITH CHECK (true);



CREATE POLICY "Bases public read" ON "public"."bases" FOR SELECT USING (true);



CREATE POLICY "Bases public update" ON "public"."bases" FOR UPDATE USING (true);



CREATE POLICY "Permitir actualizacion de clientes" ON "public"."clientes" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir insercion de clientes" ON "public"."clientes" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Permitir insercion publica de calificaciones" ON "public"."store_ratings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Permitir lectura de clientes" ON "public"."clientes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Permitir lectura publica de payment_methods" ON "public"."payment_methods" FOR SELECT USING (true);



CREATE POLICY "Ratings public insert" ON "public"."store_ratings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Ratings public read" ON "public"."store_ratings" FOR SELECT USING (true);



CREATE POLICY "Sizes public delete" ON "public"."sizes" FOR DELETE USING (true);



CREATE POLICY "Sizes public insert" ON "public"."sizes" FOR INSERT WITH CHECK (true);



CREATE POLICY "Sizes public read" ON "public"."sizes" FOR SELECT USING (true);



CREATE POLICY "Sizes public update" ON "public"."sizes" FOR UPDATE USING (true);



ALTER TABLE "public"."additions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "additions_admin_todo" ON "public"."additions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "additions_lectura_publica" ON "public"."additions" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."bases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalog_design" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "catalog_design_admin_todo" ON "public"."catalog_design" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "catalog_design_lectura_publica" ON "public"."catalog_design" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "categorias_admin_todo" ON "public"."categories" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "categorias_lectura_publica" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clientes_actualizacion_publica" ON "public"."clientes" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "clientes_insercion_publica" ON "public"."clientes" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "clientes_lectura_publica" ON "public"."clientes" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pedidos_insert_publico" ON "public"."orders" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "pedidos_select_admin" ON "public"."orders" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "pedidos_update_admin" ON "public"."orders" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."product_additions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_additions_admin_todo" ON "public"."product_additions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "product_additions_lectura_publica" ON "public"."product_additions" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."product_sauces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_sauces_admin_todo" ON "public"."product_sauces" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "product_sauces_lectura_publica" ON "public"."product_sauces" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "productos_admin_todo" ON "public"."products" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "productos_lectura_publica" ON "public"."products" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sauces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sauces_admin_todo" ON "public"."sauces" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "sauces_lectura_publica" ON "public"."sauces" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "settings_admin_todo" ON "public"."settings" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "settings_lectura_publica" ON "public"."settings" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."sizes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_ratings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."additions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."catalog_design";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."categories";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."clientes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."orders";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."product_additions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."product_sauces";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."products";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."sauces";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."settings";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."crear_pedido"("p_nombre" "text", "p_telefono" "text", "p_direccion" "text", "p_unidad" "text", "p_apto" "text", "p_observaciones" "text", "p_pago" "text", "p_subtotal" integer, "p_delivery_fee" integer, "p_total" integer, "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."crear_pedido"("p_nombre" "text", "p_telefono" "text", "p_direccion" "text", "p_unidad" "text", "p_apto" "text", "p_observaciones" "text", "p_pago" "text", "p_subtotal" integer, "p_delivery_fee" integer, "p_total" integer, "p_items" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."crear_pedido"("p_nombre" "text", "p_telefono" "text", "p_direccion" "text", "p_unidad" "text", "p_apto" "text", "p_observaciones" "text", "p_pago" "text", "p_subtotal" integer, "p_delivery_fee" integer, "p_total" integer, "p_items" "jsonb", "p_tipo_entrega" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."crear_pedido"("p_nombre" "text", "p_telefono" "text", "p_direccion" "text", "p_unidad" "text", "p_apto" "text", "p_observaciones" "text", "p_pago" "text", "p_subtotal" integer, "p_delivery_fee" integer, "p_total" integer, "p_items" "jsonb", "p_tipo_entrega" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."registrar_cliente_si_no_existe"("p_telefono" "text", "p_nombre" "text", "p_fecha_cumple" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_cliente_si_no_existe"("p_telefono" "text", "p_nombre" "text", "p_fecha_cumple" "date") TO "authenticated";


















GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."additions" TO "anon";
GRANT ALL ON TABLE "public"."additions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."additions" TO "service_role";



GRANT ALL ON TABLE "public"."bases" TO "anon";
GRANT ALL ON TABLE "public"."bases" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."bases" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."catalog_design" TO "anon";
GRANT ALL ON TABLE "public"."catalog_design" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."catalog_design" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."categories" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."clientes" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."clientes" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."clientes" TO "service_role";



GRANT INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."orders" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."orders_numero_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."orders_numero_seq" TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."payment_methods" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."payment_methods" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."payment_methods" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."product_additions" TO "anon";
GRANT ALL ON TABLE "public"."product_additions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."product_additions" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."product_sauces" TO "anon";
GRANT ALL ON TABLE "public"."product_sauces" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."product_sauces" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."products" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sauces" TO "anon";
GRANT ALL ON TABLE "public"."sauces" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sauces" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."sizes" TO "anon";
GRANT ALL ON TABLE "public"."sizes" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sizes" TO "service_role";



GRANT ALL ON TABLE "public"."store_ratings" TO "anon";
GRANT ALL ON TABLE "public"."store_ratings" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."store_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";































