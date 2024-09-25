import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";

import { TrackingService } from "@tracking/tracking.service";
import { CreatedTrackingReqDto } from "@tracking/tracking.dto";

import { AuthGuard } from "@common/guard/authenticated.guard";
import { IRequest } from "@common/interface";

@Controller('trackings')
@UseGuards(AuthGuard)
export class TrackingController {
    constructor(private readonly trackingService: TrackingService){}

    @Post('')
    create(@Req() req: IRequest, @Body() body: CreatedTrackingReqDto) {
        return this.trackingService.create(body, req.user.id, req.event.id);
    }

}