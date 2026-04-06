/**
 * AfriVogue API Client — Supabase-compatible shim
 *
 * This file previously used the Supabase JS client. It now re-exports
 * the custom API client which talks to the AfriVogue Node.js/Express backend
 * hosted on Hostinger with MySQL.
 *
 * All existing imports ( import { supabase } from "@/integrations/supabase/client" )
 * continue to work without changes across the codebase.
 */
export { supabase, api } from '@/integrations/api/client';