import { createClient } from '@supabase/supabase-js';

// ====================================================================================
// CONFIGURAÇÃO DO SUPABASE
// ====================================================================================
// 1. Crie o projeto em https://supabase.com
// 2. Rode o Script SQL fornecido no chat no "SQL Editor" do Supabase.
// 3. Copie a URL e a KEY (anon/public) nas configurações de API do projeto.
// 4. Cole abaixo.
// ====================================================================================

const SUPABASE_URL = 'https://pjgdwbrstkzbsdytioko.supabase.co'; // COLE SUA URL AQUI
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2R3YnJzdGt6YnNkeXRpb2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Nzg4ODIsImV4cCI6MjA4MDQ1NDg4Mn0.L7C67fxrEEFNJWEkeFPk87IdV2hIjpJm051KGTLVbGQ'; // COLE SUA CHAVE AQUI

let client;

// Função auxiliar segura para validar URL
const isValidUrl = (urlString: string) => {
  try { 
    return Boolean(new URL(urlString)); 
  }
  catch(e){ 
    return false; 
  }
}

// Inicialização segura
if (isValidUrl(SUPABASE_URL) && SUPABASE_URL.includes('http')) {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("⚠️ URL do Supabase inválida ou não configurada. Usando modo offline/mock para evitar crash.");
  // Cliente Fallback para a interface carregar sem quebrar
  client = createClient('https://placeholder.supabase.co', 'placeholder');
}

export const supabase = client;