CREATE TABLE `viewers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`total_requests` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `viewers_name_unique` ON `viewers` (`name`);