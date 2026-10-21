-- Fails safely if legacy duplicates exist. Reconcile them before migrating; never silently delete members.
ALTER TABLE membros_da_startup
    ADD CONSTRAINT uk_startup_usuario UNIQUE (startup_id, usuario_id);
