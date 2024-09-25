export interface ICreatedTracking {
    player_id: number;
    event_id: number;
    type: string;
    game_id?: number;
    screen?: string;
    entry_time?: string;
    exit_time?: string;
    duration?: number;
    click_at?: string;
    button?: string;
}