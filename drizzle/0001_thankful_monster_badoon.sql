CREATE TABLE "ad_spend" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"api_config_id" integer,
	"location_id" integer,
	"platform" text NOT NULL,
	"campaign_id" text,
	"campaign_name" text,
	"ad_set_id" text,
	"ad_set_name" text,
	"ad_id" text,
	"ad_name" text,
	"spend" real NOT NULL,
	"impressions" integer,
	"clicks" integer,
	"conversions" integer,
	"period" text NOT NULL,
	"date" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"api_key" text NOT NULL,
	"api_secret" text,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"last_sync_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_sync_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_config_id" integer,
	"user_id" uuid NOT NULL,
	"sync_type" text NOT NULL,
	"period" text NOT NULL,
	"status" text NOT NULL,
	"data_count" integer DEFAULT 0,
	"total_amount" real DEFAULT 0,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"greyfinch_id" text,
	"patient_id" integer,
	"location_id" integer,
	"appointment_type" text,
	"status" text,
	"scheduled_date" timestamp,
	"actual_date" timestamp,
	"duration" integer,
	"revenue" real DEFAULT 0,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "appointments_greyfinch_id_unique" UNIQUE("greyfinch_id")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"greyfinch_id" text,
	"appointment_id" integer,
	"start_time" timestamp,
	"end_time" timestamp,
	"local_start_date" timestamp,
	"local_start_time" timestamp,
	"timezone" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "bookings_greyfinch_id_unique" UNIQUE("greyfinch_id")
);
--> statement-breakpoint
CREATE TABLE "daily_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"location_id" integer,
	"date" timestamp NOT NULL,
	"total_patients" integer DEFAULT 0,
	"new_patients" integer DEFAULT 0,
	"appointments" integer DEFAULT 0,
	"completed_appointments" integer DEFAULT 0,
	"cancelled_appointments" integer DEFAULT 0,
	"no_shows" integer DEFAULT 0,
	"total_revenue" real DEFAULT 0,
	"average_revenue" real DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "location_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"location_id" integer,
	"period" text NOT NULL,
	"total_patients" integer DEFAULT 0,
	"new_patients" integer DEFAULT 0,
	"total_appointments" integer DEFAULT 0,
	"completed_appointments" integer DEFAULT 0,
	"cancellation_rate" real DEFAULT 0,
	"no_show_rate" real DEFAULT 0,
	"total_revenue" real DEFAULT 0,
	"average_revenue_per_patient" real DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"greyfinch_id" text,
	"location_id" integer,
	"patient_hash" text NOT NULL,
	"age_group" text,
	"gender" text,
	"treatment_status" text,
	"first_visit_date" timestamp,
	"last_visit_date" timestamp,
	"total_visits" integer DEFAULT 0,
	"total_revenue" real DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "patients_greyfinch_id_unique" UNIQUE("greyfinch_id")
);
--> statement-breakpoint
CREATE TABLE "revenue" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"api_config_id" integer,
	"location_id" integer,
	"period" text NOT NULL,
	"amount" real NOT NULL,
	"category" text,
	"description" text,
	"transaction_date" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"periods" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "treatments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"greyfinch_id" text,
	"patient_id" integer,
	"name" text NOT NULL,
	"type" text,
	"status" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"total_cost" real DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "treatments_greyfinch_id_unique" UNIQUE("greyfinch_id")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"api_config_id" integer,
	"vendor_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"category" text,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "acquisition_costs" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "acquisition_costs" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "acquisition_costs" ADD COLUMN "source" text DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "acquisition_costs" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "acquisition_costs" ADD COLUMN "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "ad_spend" ADD CONSTRAINT "ad_spend_api_config_id_api_configurations_id_fk" FOREIGN KEY ("api_config_id") REFERENCES "public"."api_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_spend" ADD CONSTRAINT "ad_spend_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_sync_history" ADD CONSTRAINT "api_sync_history_api_config_id_api_configurations_id_fk" FOREIGN KEY ("api_config_id") REFERENCES "public"."api_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_metrics" ADD CONSTRAINT "location_metrics_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_api_config_id_api_configurations_id_fk" FOREIGN KEY ("api_config_id") REFERENCES "public"."api_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_api_config_id_api_configurations_id_fk" FOREIGN KEY ("api_config_id") REFERENCES "public"."api_configurations"("id") ON DELETE no action ON UPDATE no action;