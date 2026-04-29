CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`actor_id` text NOT NULL,
	`machine_id` text NOT NULL,
	`production_id` text,
	`asset_id` text,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`production_id`) REFERENCES `productions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `activities_created_at_idx` ON `activities` (`created_at`);--> statement-breakpoint
CREATE INDEX `activities_machine_idx` ON `activities` (`machine_id`);--> statement-breakpoint
CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`machine_id` text NOT NULL,
	`production_id` text,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`file_label` text NOT NULL,
	`author_id` text NOT NULL,
	`state` text NOT NULL,
	`version` integer NOT NULL,
	`updated_at` text NOT NULL,
	`thumb_hue` integer NOT NULL,
	`data_kind` text NOT NULL,
	`revision_impact` text NOT NULL,
	`final_due_date` text,
	`final_received_at` text,
	`rework_required` integer,
	`rework_done_at` text,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`production_id`) REFERENCES `productions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assets_machine_idx` ON `assets` (`machine_id`);--> statement-breakpoint
CREATE INDEX `assets_production_idx` ON `assets` (`production_id`);--> statement-breakpoint
CREATE TABLE `lamp_cues` (
	`id` text PRIMARY KEY NOT NULL,
	`production_id` text NOT NULL,
	`scene_id` text,
	`name` text NOT NULL,
	`pattern` text NOT NULL,
	`colors_json` text NOT NULL,
	`state` text NOT NULL,
	`assignee_id` text,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`production_id`) REFERENCES `productions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scene_id`) REFERENCES `storyboard_scenes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `lamp_cues_production_idx` ON `lamp_cues` (`production_id`);--> statement-breakpoint
CREATE TABLE `machine_members` (
	`machine_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`machine_id`, `user_id`),
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `machine_members_user_idx` ON `machine_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `machines` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`series` text NOT NULL,
	`description` text NOT NULL,
	`color` text NOT NULL,
	`release_target` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `machines_code_unique` ON `machines` (`code`);--> statement-breakpoint
CREATE TABLE `phases` (
	`id` text PRIMARY KEY NOT NULL,
	`production_id` text NOT NULL,
	`type` text NOT NULL,
	`state` text NOT NULL,
	`assignee_id` text,
	`estimated_hours` integer,
	`actual_hours` integer,
	`start_date` text,
	`due_date` text,
	`completed_at` text,
	`note` text DEFAULT '' NOT NULL,
	`track_hours` integer,
	FOREIGN KEY (`production_id`) REFERENCES `productions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `phases_production_idx` ON `phases` (`production_id`);--> statement-breakpoint
CREATE INDEX `phases_assignee_idx` ON `phases` (`assignee_id`);--> statement-breakpoint
CREATE TABLE `productions` (
	`id` text PRIMARY KEY NOT NULL,
	`machine_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`duration_sec` integer NOT NULL,
	`priority` text NOT NULL,
	`owner_id` text NOT NULL,
	`state` text NOT NULL,
	`target_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productions_machine_code_unique` ON `productions` (`machine_id`,`code`);--> statement-breakpoint
CREATE INDEX `productions_owner_idx` ON `productions` (`owner_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `sound_cues` (
	`id` text PRIMARY KEY NOT NULL,
	`production_id` text NOT NULL,
	`scene_id` text,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`state` text NOT NULL,
	`assignee_id` text,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`production_id`) REFERENCES `productions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scene_id`) REFERENCES `storyboard_scenes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sound_cues_production_idx` ON `sound_cues` (`production_id`);--> statement-breakpoint
CREATE TABLE `storyboard_scenes` (
	`id` text PRIMARY KEY NOT NULL,
	`production_id` text NOT NULL,
	`order` integer NOT NULL,
	`start_sec` integer NOT NULL,
	`end_sec` integer NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`video_note` text DEFAULT '' NOT NULL,
	`sound_note` text DEFAULT '' NOT NULL,
	`lamp_note` text DEFAULT '' NOT NULL,
	`state` text NOT NULL,
	FOREIGN KEY (`production_id`) REFERENCES `productions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `scenes_production_idx` ON `storyboard_scenes` (`production_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`avatar_hue` integer NOT NULL,
	`role` text NOT NULL,
	`discipline` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `video_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`production_id` text NOT NULL,
	`order` integer NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`estimated_hours` integer NOT NULL,
	`actual_hours` integer,
	`assignee_id` text,
	`state` text NOT NULL,
	FOREIGN KEY (`production_id`) REFERENCES `productions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `video_tasks_production_idx` ON `video_tasks` (`production_id`);