import { Request } from 'express';

import { IPlayer } from '@auth/auth.interface';
import { IEvent } from '@client/supabase/supabase.interface';

export interface IRequest extends Request {
  user: IPlayer;
  event: IEvent;
}
