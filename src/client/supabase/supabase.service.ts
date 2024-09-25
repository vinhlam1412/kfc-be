/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseClient: SupabaseClient<any, string, any>;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.supabaseClient = createClient(
      this.configService.get('supabase.url'),
      this.configService.get('supabase.key'),
    );
  }

  getSupabase(): SupabaseClient<any, string, any> {
    return this.supabaseClient;
  }
}
