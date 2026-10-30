-- Legacy live databases can lack uniqueness already present in fresh schema.sql.
-- Do not delete or merge historic rows. Duplicates must be reviewed before upgrade.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS context_nodes_user_id_scope_key ON context_nodes(user_id, scope);
CREATE UNIQUE INDEX IF NOT EXISTS api_keys_user_id_key ON api_keys(user_id);
COMMIT;
