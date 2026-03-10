-- Move orphan messages to correct conversation, then delete orphan
UPDATE messages SET conversation_id = '58d9065a-c5bd-45c1-a8f6-e04cc7f9a20e' WHERE conversation_id = '162ad41c-b11b-4534-87fe-62b76ef1b112';
DELETE FROM conversations WHERE id = '162ad41c-b11b-4534-87fe-62b76ef1b112'