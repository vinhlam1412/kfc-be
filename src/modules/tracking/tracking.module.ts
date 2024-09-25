import { Module } from "@nestjs/common";

import { SupabaseModule } from "@client/supabase/supabase.module";

import { TrackingService } from "@tracking/tracking.service";
import { TrackingController } from "@tracking/tracking.controller";

@Module({
    imports: [SupabaseModule],
    providers: [TrackingService],
    controllers: [TrackingController]
})
export class TrackingModule{}