-- Seed data for development
-- NOTE: To seed, first create a test user via Supabase Auth dashboard or signup flow.
-- The trigger will auto-create the public.users row.
-- Then run the INSERT statements below with the user's UUID.

-- After creating a test user with id = '<user-uuid>', run:

-- INSERT INTO chats (id, user_id, title, created_at, updated_at) VALUES
--   ('a0000000-0000-0000-0000-000000000001', '<user-uuid>', 'Welcome Chat', now(), now()),
--   ('a0000000-0000-0000-0000-000000000002', '<user-uuid>', 'Code Help', now(), now());

-- INSERT INTO messages (chat_id, role, content, created_at) VALUES
--   ('a0000000-0000-0000-0000-000000000001', 'user', 'Hello! What can you help me with?', now()),
--   ('a0000000-0000-0000-0000-000000000001', 'assistant', 'I can help with coding, writing, analysis, and much more. What would you like to explore?', now()),
--   ('a0000000-0000-0000-0000-000000000002', 'user', 'How do I create a React component?', now()),
--   ('a0000000-0000-0000-0000-000000000002', 'assistant', 'Here is a simple React component example...', now());
