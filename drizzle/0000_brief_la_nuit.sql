CREATE TABLE "acquisition_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer,
	"referral_type" text NOT NULL,
	"cost" real NOT NULL,
	"period" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analytics_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"data_type" text NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"greyfinch_id" text,
	"address" text,
	"patient_count" integer,
	"last_sync_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "locations_greyfinch_id_unique" UNIQUE("greyfinch_id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"period_configs" text NOT NULL,
	"pdf_url" text,
	"thumbnail" text,
	"is_public" boolean DEFAULT false,
	"share_token" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "reports_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
ALTER TABLE "acquisition_costs" ADD CONSTRAINT "acquisition_costs_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_cache" ADD CONSTRAINT "analytics_cache_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;