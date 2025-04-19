import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e chave anônima são necessários')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas
export type ControlEntry = {
  id: string
  created_at: string
  trip: string
  quantity: number
  region: string
  shift: number
  pre_box: number
  user_id: string
}

export type BoxData = {
  id: string
  created_at: string
  trip: string
  status: 'free' | 'occupied' | 'blocked'
  user_id: string
} 