import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { SupabaseService } from "@client/supabase/supabase.service";

import { CreatedTrackingReqDto } from "@tracking/tracking.dto";
import { ICreatedTracking } from "@tracking/tracking.interface";

import * as moment from "moment";

import { PostgrestSingleResponse } from "@supabase/supabase-js";

@Injectable()
export class TrackingService {
    constructor(private readonly supabaseService: SupabaseService){}

    async create(body: CreatedTrackingReqDto, player_id: number, event_id: number): Promise<PostgrestSingleResponse<null>> {
        const data: ICreatedTracking = {
            player_id: player_id,
            event_id: event_id,
            type: body.type,
            screen: body?.screen || ''
        };

        if (body.game_code && body.game_code !== '') {
            const gameResp = await this.supabaseService
            .getSupabase()
            .from('games')
            .select('id,name,code')
            .eq('code', body.game_code)
            .limit(1)
            .maybeSingle();
            
            if (gameResp?.status !== HttpStatus.OK) throw new HttpException(gameResp?.error, gameResp?.status);

            if (!gameResp?.data?.id) throw new BadRequestException('Không tìm thấy game');

            data.game_id = gameResp?.data?.id;
        }
        
        if (body.type === 'session') {
            data.duration = this.getDuration(body?.entry_time, body?.exit_time);
            data.entry_time = body?.entry_time;
            data.exit_time = body?.exit_time;
        } else {
            data.button = body.button;
            data.click_at = body.click_at;
        }

        const createdResp = await this.supabaseService.getSupabase().from('tracking').insert(data);

        if (createdResp?.status !== HttpStatus.CREATED) throw new HttpException(createdResp?.error, createdResp?.status);

        return createdResp?.data;
    }

    private getDuration(entryTime: string, exitTime: string): number {
        if (!entryTime || !exitTime) return 0;
        const start = moment(entryTime);
        const end = moment(exitTime);

        return end.diff(start,'seconds');
    }
}