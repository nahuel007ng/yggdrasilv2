-- Migracion: agregar whatsapp_jid y preferred_channel a user_profile
-- Ejecutar manualmente en Supabase SQL Editor

ALTER TABLE user_profile
ADD COLUMN IF NOT EXISTS whatsapp_jid TEXT;

COMMENT ON COLUMN user_profile.whatsapp_jid IS 'WhatsApp JID del usuario (ej: 5493834XXXXXX@s.whatsapp.net). Se guarda automaticamente al recibir el primer mensaje.';

ALTER TABLE user_profile
ADD COLUMN IF NOT EXISTS preferred_channel TEXT DEFAULT 'telegram';

COMMENT ON COLUMN user_profile.preferred_channel IS 'Canal de mensajeria preferido: telegram | whatsapp. Determina por donde se envian notificaciones proactivas.';
