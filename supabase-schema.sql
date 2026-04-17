create table if not exists people (
  id text primary key,
  name text not null,
  document text not null unique,
  role text not null,
  type text not null check (type in ('administrativo', 'operativo')),
  created_at timestamptz not null default now()
);

create table if not exists epps (
  id text primary key,
  code text not null unique,
  name text not null,
  quantity integer not null default 0,
  min_stock integer not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists movements (
  id text primary key,
  type text not null check (type in ('entrada', 'salida')),
  epp_id text not null references epps(id),
  quantity integer not null check (quantity > 0),
  delivered_by_id text,
  delivered_by_name text not null,
  delivered_by_document text not null,
  received_by_id text,
  received_by_name text not null,
  received_by_document text not null,
  notes text,
  created_at timestamptz not null default now()
);

insert into people (id, name, document, role, type)
values
  ('adm-1', 'Laura Cardenas', '1023456781', 'Jefe de seguridad', 'administrativo'),
  ('adm-2', 'Camilo Reyes', '1032456782', 'Aprendiz', 'administrativo'),
  ('adm-3', 'Diana Torres', '1041456783', 'Talento humano', 'administrativo'),
  ('op-1', 'Jhon Perez', '1051456784', 'Auxiliar de almacen', 'operativo'),
  ('op-2', 'Andres Herrera', '1061456785', 'Verificador', 'operativo'),
  ('op-3', 'Martha Silva', '1071456786', 'Supervisor', 'operativo'),
  ('op-4', 'Oscar Medina', '1081456787', 'Operador integral', 'operativo')
on conflict (id) do nothing;

insert into epps (id, code, name, quantity, min_stock)
values
  ('epp-1', 'CAS-001', 'Casco de seguridad', 25, 8),
  ('epp-2', 'GAF-002', 'Gafas de proteccion', 40, 12),
  ('epp-3', 'GUA-003', 'Guantes anticorte', 9, 10),
  ('epp-4', 'BOT-004', 'Botas de seguridad', 0, 6)
on conflict (id) do nothing;
