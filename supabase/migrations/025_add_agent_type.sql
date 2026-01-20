-- 025_add_agent_type.sql
-- Story 5.2: Types d'Agents & Système de Queue

-- =========================================================
-- CREATE AGENT_TYPE ENUM
-- =========================================================
create type agent_type as enum ('VERIFICATEUR', 'CREATEUR');

comment on type agent_type is
  'Type d''agent: VERIFICATEUR (review docs clients) ou CREATEUR (upload docs pour clients)';

-- =========================================================
-- ADD AGENT_TYPE COLUMN TO AGENTS TABLE
-- =========================================================
alter table agents
  add column agent_type agent_type not null default 'VERIFICATEUR';

comment on column agents.agent_type is
  'Type d''agent déterminant les steps assignables';

-- =========================================================
-- INDEX FOR FILTERING ACTIVE AGENTS BY TYPE
-- =========================================================
create index idx_agents_agent_type
  on agents(agent_type)
  where active = true;

comment on index idx_agents_agent_type is
  'Index pour filtrer les agents actifs par type (VERIFICATEUR/CREATEUR)';


