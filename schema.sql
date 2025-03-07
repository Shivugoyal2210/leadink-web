

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


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."lead_found_through" AS ENUM (
    'scanner',
    'sunny',
    'social_media',
    'word_of_mouth',
    'social_media_ads',
    'architect'
);


ALTER TYPE "public"."lead_found_through" OWNER TO "postgres";


CREATE TYPE "public"."lead_status" AS ENUM (
    'new',
    'quote_made',
    'negotiation',
    'won',
    'lost'
);


ALTER TYPE "public"."lead_status" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'active',
    'completed'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."property_type" AS ENUM (
    'residential',
    'commercial'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


CREATE TYPE "public"."quote_request_status" AS ENUM (
    'pending',
    'active',
    'completed'
);


ALTER TYPE "public"."quote_request_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'sales_manager',
    'sales_rep',
    'lead_assigner',
    'quote_maker'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_order_from_won_lead"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only proceed if the lead status is being changed to 'won'
  IF (NEW.status = 'won' AND (OLD.status IS NULL OR OLD.status <> 'won')) THEN
    -- Find the sales rep assigned to this lead
    -- We'll use the first one if there are multiple
    DECLARE
      assigned_sales_rep_id UUID;
    BEGIN
      SELECT user_id INTO assigned_sales_rep_id
      FROM public.lead_assignments
      WHERE lead_id = NEW.id
      LIMIT 1;
      
      -- If no assignment found, use the user who updated the lead
      IF assigned_sales_rep_id IS NULL THEN
        assigned_sales_rep_id := auth.uid();
      END IF;

      -- Create the order
      INSERT INTO public.orders (
        lead_id,
        sales_rep_id,
        amount_in,
        tax_amount,
        middleman_cut,
        status,
        notes,
        amount_recieved
      ) VALUES (
        NEW.id,                           -- lead_id
        assigned_sales_rep_id,            -- sales_rep_id
        COALESCE(NEW.quote_value, 0),     -- amount_in (use quote_value if available, otherwise 0)
        0,                                -- tax_amount
        0,                                -- middleman_cut
        'pending',                        -- status
        'Automatically created from won lead: ' || COALESCE(NEW.notes, ''),  -- notes
        0                                 -- amount_recieved
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_order_from_won_lead"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Default Name'), 'sales_rep')  -- Set default name and user_role
  ON CONFLICT (id) DO UPDATE 
  SET full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."lead_assignments" (
    "lead_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."lead_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "property_type" "public"."property_type" NOT NULL,
    "company" "text",
    "architect_name" "text",
    "phone_number" "text" NOT NULL,
    "quote_value" numeric(12,2) DEFAULT 0,
    "status" "public"."lead_status" NOT NULL,
    "next_follow_up_date" timestamp without time zone,
    "notes" "text",
    "lead_created_date" timestamp without time zone DEFAULT "now"() NOT NULL,
    "lead_found_through" "public"."lead_found_through" NOT NULL
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "sales_rep_id" "uuid" NOT NULL,
    "amount_in" numeric(12,2) NOT NULL,
    "tax_amount" numeric(12,2) NOT NULL,
    "middleman_cut" numeric(12,2) NOT NULL,
    "total_value" numeric(12,2) GENERATED ALWAYS AS ((("amount_in" + "tax_amount") + "middleman_cut")) STORED,
    "order_date" timestamp with time zone DEFAULT "now"(),
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status",
    "notes" "text",
    "amount_recieved" numeric DEFAULT '0'::numeric,
    "final_size_date" "date"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quote_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "sales_rep_id" "uuid" NOT NULL,
    "quote_maker_id" "uuid",
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "quoted_at" timestamp with time zone,
    "status" "public"."quote_request_status" DEFAULT 'pending'::"public"."quote_request_status",
    "quote_value" numeric(12,2) DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."quote_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "public"."user_role" NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."lead_assignments"
    ADD CONSTRAINT "lead_assignments_pkey" PRIMARY KEY ("lead_id", "user_id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_lead_id_key" UNIQUE ("lead_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quote_requests"
    ADD CONSTRAINT "quote_requests_lead_id_key" UNIQUE ("lead_id");



ALTER TABLE ONLY "public"."quote_requests"
    ADD CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_lead_assignments_user" ON "public"."lead_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_leads_created_date" ON "public"."leads" USING "btree" ("lead_created_date");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "trigger_create_order_from_won_lead" AFTER UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."create_order_from_won_lead"();



ALTER TABLE ONLY "public"."lead_assignments"
    ADD CONSTRAINT "lead_assignments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_assignments"
    ADD CONSTRAINT "lead_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."quote_requests"
    ADD CONSTRAINT "quote_requests_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id");



ALTER TABLE ONLY "public"."quote_requests"
    ADD CONSTRAINT "quote_requests_quote_maker_id_fkey" FOREIGN KEY ("quote_maker_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."quote_requests"
    ADD CONSTRAINT "quote_requests_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete quote requests" ON "public"."quote_requests" FOR DELETE USING ((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"public"."user_role"));



CREATE POLICY "Allow admins and sales managers to delete lead assignments" ON "public"."lead_assignments" FOR DELETE USING ((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = ANY (ARRAY['admin'::"public"."user_role", 'sales_manager'::"public"."user_role"])));



CREATE POLICY "Allow users to create new orders via function" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."lead_assignments" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."lead_assignments" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."leads" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."lead_assignments" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."leads" FOR SELECT USING (true);



CREATE POLICY "Public user profiles are viewable by everyone." ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Quote makers can update assigned quote requests" ON "public"."quote_requests" FOR UPDATE USING (((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'quote_maker'::"public"."user_role") AND ("auth"."uid"() = "quote_maker_id")));



CREATE POLICY "Sales reps can create quote requests for assigned leads" ON "public"."quote_requests" FOR INSERT WITH CHECK ((((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'sales_rep'::"public"."user_role") AND (EXISTS ( SELECT 1
   FROM "public"."lead_assignments"
  WHERE (("lead_assignments"."lead_id" = "quote_requests"."lead_id") AND ("lead_assignments"."user_id" = "auth"."uid"()))))) OR (( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"public"."user_role")));



CREATE POLICY "Sales reps can update their own quote requests" ON "public"."quote_requests" FOR UPDATE USING ((((( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'sales_rep'::"public"."user_role") AND ("auth"."uid"() = "sales_rep_id")) OR (( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"public"."user_role")));



CREATE POLICY "Users can insert their own profile." ON "public"."users" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their own settings except role." ON "public"."users" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "id") AND ("role" = "role")));



CREATE POLICY "Users can view their own quote requests" ON "public"."quote_requests" FOR SELECT USING ((("auth"."uid"() = "sales_rep_id") OR ("auth"."uid"() = "quote_maker_id") OR (( SELECT "users"."role"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) = 'admin'::"public"."user_role")));



ALTER TABLE "public"."lead_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "only_admins_can_update_orders" ON "public"."orders" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."role" = 'admin'::"public"."user_role")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."role" = 'admin'::"public"."user_role"))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quote_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_see_their_own_orders_or_admin_can_see_all" ON "public"."orders" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."role" = 'admin'::"public"."user_role"))) OR ("sales_rep_id" = "auth"."uid"())));



CREATE POLICY "users_can_update_leads_they_own_or_admin_can_update_any" ON "public"."leads" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."role" = 'admin'::"public"."user_role"))) OR ("auth"."uid"() IN ( SELECT "lead_assignments"."user_id"
   FROM "public"."lead_assignments"
  WHERE ("lead_assignments"."lead_id" = "leads"."id"))))) WITH CHECK ((("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."role" = 'admin'::"public"."user_role"))) OR ("auth"."uid"() IN ( SELECT "lead_assignments"."user_id"
   FROM "public"."lead_assignments"
  WHERE ("lead_assignments"."lead_id" = "leads"."id")))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."create_order_from_won_lead"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_order_from_won_lead"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_order_from_won_lead"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


















GRANT ALL ON TABLE "public"."lead_assignments" TO "anon";
GRANT ALL ON TABLE "public"."lead_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."quote_requests" TO "anon";
GRANT ALL ON TABLE "public"."quote_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."quote_requests" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
