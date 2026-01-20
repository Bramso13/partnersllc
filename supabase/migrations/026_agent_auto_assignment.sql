-- 026_agent_auto_assignment.sql
-- Story 5.2: Types d'Agents & Système de Queue
-- Auto-assignation d'un agent à une step_instance en fonction du step_type

-- =========================================================
-- FUNCTION: get_next_agent_for_step_type
-- =========================================================
create or replace function get_next_agent_for_step_type(p_step_type step_type)
returns uuid as $$
declare
  v_agent_type agent_type;
  v_agent_id uuid;
begin
  -- Map step_type -> agent_type
  v_agent_type := case p_step_type
    when 'CLIENT' then 'VERIFICATEUR'::agent_type
    when 'ADMIN' then 'CREATEUR'::agent_type
    else null
  end;

  if v_agent_type is null then
    return null;
  end if;

  -- Load balancing: agent actif avec le moins de steps incomplètes
  select a.id
  into v_agent_id
  from agents a
  left join step_instances si
    on si.assigned_to = a.id
   and si.completed_at is null
  where a.active = true
    and a.agent_type = v_agent_type
  group by a.id, a.created_at
  order by count(si.id) asc, a.created_at asc
  limit 1;

  return v_agent_id;
end;
$$ language plpgsql;

comment on function get_next_agent_for_step_type(step_type)
  is 'Retourne le prochain agent actif pour un type de step donné, en équilibrant la charge.';

-- =========================================================
-- TRIGGER: Auto-assign on INSERT into step_instances
-- =========================================================
create or replace function auto_assign_agent_on_step_instance_insert()
returns trigger as $$
declare
  v_step_type step_type;
  v_agent_id uuid;
begin
  -- Récupérer le type de step
  select s.step_type
  into v_step_type
  from steps s
  where s.id = new.step_id;

  -- Tenter l'auto-assignation uniquement si aucune assignation explicite
  if new.assigned_to is null then
    v_agent_id := get_next_agent_for_step_type(v_step_type);

    -- Si aucun agent disponible, laisser assigned_to à NULL
    if v_agent_id is not null then
      new.assigned_to := v_agent_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

comment on function auto_assign_agent_on_step_instance_insert()
  is 'Assigne automatiquement un agent à une nouvelle step_instance en fonction du type de step et de la charge.';

drop trigger if exists step_instances_auto_assign_agent on step_instances;

create trigger step_instances_auto_assign_agent
before insert on step_instances
for each row
execute function auto_assign_agent_on_step_instance_insert();

