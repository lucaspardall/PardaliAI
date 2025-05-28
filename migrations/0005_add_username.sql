
-- Adicionar campo username à tabela users
ALTER TABLE users ADD COLUMN username VARCHAR;

-- Criar índice único para username
CREATE UNIQUE INDEX users_username_unique ON users (username);

-- Atualizar usuários existentes com username temporário baseado no ID
UPDATE users 
SET username = 'user_' || id 
WHERE username IS NULL AND auth_provider = 'email';
