CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`viewer_name` text NOT NULL,
	`request_type` text NOT NULL,
	`cosplay_sub_type` text,
	`details` text NOT NULL,
	`youtube_video_id` text,
	`youtube_title` text,
	`is_fast_track` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`source` text DEFAULT 'MANUAL' NOT NULL,
	`added_by` text,
	`created_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
