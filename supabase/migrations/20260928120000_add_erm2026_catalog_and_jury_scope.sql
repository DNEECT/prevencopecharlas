-- Configure the ERM 2026 catalog and enforce per-JEE access for scoped processes.
-- Directory identities and assignments are synchronized separately so personal data
-- and operational account provisioning do not become schema migration fixtures.

alter table public.electoral_processes
  add column requires_jury_assignment boolean not null default false,
  add column accepts_registrations boolean not null default true;

update public.electoral_processes
set requires_jury_assignment = true,
    accepts_registrations = true
where id = '57e96d43-5283-482b-a916-e21d72c7d605';

update public.electoral_processes
set accepts_registrations = false
where id = '29dc3419-0606-4a86-a816-9012a9414743';

drop view public.activity_list;

alter table public.activity_formats
  add column electoral_process_id uuid references public.electoral_processes(id) on delete restrict;
alter table public.target_audiences
  alter column name type varchar(100),
  add column electoral_process_id uuid references public.electoral_processes(id) on delete restrict;
alter table public.special_juries
  add column electoral_process_id uuid references public.electoral_processes(id) on delete restrict;

update public.activity_formats
set electoral_process_id = '29dc3419-0606-4a86-a816-9012a9414743'
where electoral_process_id is null;
update public.target_audiences
set electoral_process_id = '29dc3419-0606-4a86-a816-9012a9414743'
where electoral_process_id is null;
update public.special_juries
set electoral_process_id = '29dc3419-0606-4a86-a816-9012a9414743'
where electoral_process_id is null;

create index activity_formats_process_id_idx on public.activity_formats(electoral_process_id);
create index target_audiences_process_id_idx on public.target_audiences(electoral_process_id);
create index special_juries_electoral_process_id_idx on public.special_juries(electoral_process_id);
create unique index special_juries_process_name_key
  on public.special_juries(electoral_process_id, lower(btrim(jury_name)));

insert into public.activity_types (id, name, description, is_active) values
  ('745abaf0-d612-49aa-a7cb-371aab77692a', 'Charla informativa',
    'Voto informado para la prevención de conflictos electorales', true)
on conflict (id) do nothing;

update public.activity_formats
set topic = 'Elige una cultura de paz.',
    electoral_process_id = '57e96d43-5283-482b-a916-e21d72c7d605',
    is_active = true
where lower(series) = lower('SP-ERM2026');

insert into public.activity_formats (
  id, activity_type_id, topic, series, next_number, is_active, electoral_process_id
)
select
  'aea76f98-0c06-4928-82db-af7d09f97d73',
  '745abaf0-d612-49aa-a7cb-371aab77692a',
  'Elige una cultura de paz.',
  'SP-ERM2026',
  1,
  true,
  '57e96d43-5283-482b-a916-e21d72c7d605'
where not exists (
  select 1 from public.activity_formats where lower(series) = lower('SP-ERM2026')
);

insert into public.target_audiences (id, name, description, is_active, electoral_process_id) values
  ('1bc4d952-e31f-4b41-bd59-72a26178f96e', 'Organizaciones sociales y sociedad civil organizada', 'Organizaciones sociales y sociedad civil organizada', true, '57e96d43-5283-482b-a916-e21d72c7d605'),
  ('6bf75462-dcf1-4e04-8d02-5f0fae670c08', 'Prefecturas y Subprefecturas', 'Prefecturas y Subprefecturas', true, '57e96d43-5283-482b-a916-e21d72c7d605'),
  ('f6aaaf83-839b-4d0b-9a3c-ece408d53fe1', 'Tenientes gobernadores', 'Tenientes gobernadores', true, '57e96d43-5283-482b-a916-e21d72c7d605'),
  ('71502eaf-6807-4e34-8aa7-a18abc72b05e', 'Jueces de paz', 'Jueces de paz', true, '57e96d43-5283-482b-a916-e21d72c7d605'),
  ('f5ec0b4b-fd6d-4ce9-88ef-8f3b897e922e', 'Rondas campesinas', 'Rondas campesinas', true, '57e96d43-5283-482b-a916-e21d72c7d605'),
  ('2cea6257-946c-418b-92ed-9403f82da392', 'Comunidades campesinas o nativas', 'Comunidades campesinas o nativas', true, '57e96d43-5283-482b-a916-e21d72c7d605'),
  ('5b3857bf-f6dc-4a2e-a472-71514433e60c', 'Gremio Empresarial', 'Gremio Empresarial', true, '57e96d43-5283-482b-a916-e21d72c7d605')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  electoral_process_id = excluded.electoral_process_id;

insert into public.special_juries (
  id, jury_code, jury_name, electoral_process_id, department, province, is_active
) values
  ('fe94a175-53d5-4083-a9be-cdcc8808ff09', 1, 'Bongará', '57e96d43-5283-482b-a916-e21d72c7d605', 'Amazonas', 'Bongará', true),
  ('b56a6d46-f70b-417a-83fe-05719196f07a', 2, 'Bagua', '57e96d43-5283-482b-a916-e21d72c7d605', 'Amazonas', 'Bagua', true),
  ('196694ef-d92b-4dbb-94e9-76f75bf0ffdf', 3, 'Chachapoyas', '57e96d43-5283-482b-a916-e21d72c7d605', 'Amazonas', 'Chachapoyas', true),
  ('124c4569-1188-473c-8b2e-24f9ce0d532e', 4, 'Santa', '57e96d43-5283-482b-a916-e21d72c7d605', 'Áncash', 'Santa', true),
  ('800c6e36-df7b-4413-b2d0-1b523b0bfb1c', 5, 'Huari', '57e96d43-5283-482b-a916-e21d72c7d605', 'Áncash', 'Huari', true),
  ('d0572a76-ebce-4b5c-a7f1-ef6d8fcde33e', 6, 'Huaylas', '57e96d43-5283-482b-a916-e21d72c7d605', 'Áncash', 'Huaylas', true),
  ('9b0fc0d7-97c3-4351-8a61-54b6541f546e', 7, 'Recuay', '57e96d43-5283-482b-a916-e21d72c7d605', 'Áncash', 'Recuay', true),
  ('6beddbe8-d80c-4346-a3ae-362506a6edd7', 8, 'Pomabamba', '57e96d43-5283-482b-a916-e21d72c7d605', 'Áncash', 'Pomabamba', true),
  ('2894d0c9-bd81-4377-b219-558c3421354e', 9, 'Huaraz', '57e96d43-5283-482b-a916-e21d72c7d605', 'Áncash', 'Huaraz', true),
  ('9448ce7e-b92e-4352-9a26-4bf0eee19597', 10, 'Andahuaylas', '57e96d43-5283-482b-a916-e21d72c7d605', 'Apurímac', 'Andahuaylas', true),
  ('f52e3bab-1e73-47bf-88b5-f7d30f5b4ddf', 11, 'Grau', '57e96d43-5283-482b-a916-e21d72c7d605', 'Apurímac', 'Grau', true),
  ('17acfa9c-59d2-4c44-aa8a-69444a8a172d', 12, 'Abancay', '57e96d43-5283-482b-a916-e21d72c7d605', 'Apurímac', 'Abancay', true),
  ('01ca325d-f7fc-4bdc-ad2e-7f91c0ebfced', 13, 'Condesuyos', '57e96d43-5283-482b-a916-e21d72c7d605', 'Arequipa', 'Condesuyos', true),
  ('6282d503-97bb-4703-a9d2-4fd96af6a0e6', 14, 'Camaná', '57e96d43-5283-482b-a916-e21d72c7d605', 'Arequipa', 'Camaná', true),
  ('2ce7397c-87a6-4c76-9594-1eca5add6a2a', 15, 'Caylloma', '57e96d43-5283-482b-a916-e21d72c7d605', 'Arequipa', 'Caylloma', true),
  ('7fe9752b-8e82-4b4f-ac47-f4c1b62ac15f', 16, 'Arequipa', '57e96d43-5283-482b-a916-e21d72c7d605', 'Arequipa', 'Arequipa', true),
  ('7b8b0e54-63cd-4236-a393-b251289e2882', 17, 'Lucanas', '57e96d43-5283-482b-a916-e21d72c7d605', 'Ayacucho', 'Lucanas', true),
  ('c40fb528-8ba0-4e67-94c6-4e69273a6c20', 18, 'Parinacochas', '57e96d43-5283-482b-a916-e21d72c7d605', 'Ayacucho', 'Parinacochas', true),
  ('3a29f7e4-e4da-4f1b-826b-d86c5d0b1e3c', 19, 'Cangallo', '57e96d43-5283-482b-a916-e21d72c7d605', 'Ayacucho', 'Cangallo', true),
  ('8c0df20e-a373-401a-97c5-2a1bf8d95736', 20, 'Huamanga', '57e96d43-5283-482b-a916-e21d72c7d605', 'Ayacucho', 'Huamanga', true),
  ('ff7e34a8-2adc-4259-b5ff-6aeefa7b4193', 21, 'Cutervo', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cajamarca', 'Cutervo', true),
  ('9f90e9d0-580e-4be7-936c-8c220cab7845', 22, 'Chota', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cajamarca', 'Chota', true),
  ('00901b55-d319-4738-887e-d9cdcc3db68e', 23, 'Jaén', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cajamarca', 'Jaén', true),
  ('fc064636-00ee-4aad-a439-272b16f39e92', 24, 'San Pablo', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cajamarca', 'San Pablo', true),
  ('a6cf0ee8-c500-4a5f-9d80-8179ef015124', 25, 'Cajamarca', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cajamarca', 'Cajamarca', true),
  ('798453ad-15b9-4825-be7f-713336a91ea5', 26, 'Canchis', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cusco', 'Canchis', true),
  ('f0ba7e37-457c-43fd-9ce0-976f888643a6', 27, 'La Convención', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cusco', 'La Convención', true),
  ('6c7cf1c4-7e16-4f03-99a9-6c0f94065062', 28, 'Urubamba', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cusco', 'Urubamba', true),
  ('23e7680c-eeac-45ec-87a6-d66a80ad7264', 29, 'Espinar', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cusco', 'Espinar', true),
  ('a9ea63e9-ee0d-41c6-9519-ef669199c5ef', 30, 'Quispicanchi', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cusco', 'Quispicanchi', true),
  ('302ceac5-ef48-4c06-a98f-23eeceb9f5d5', 31, 'Cusco', '57e96d43-5283-482b-a916-e21d72c7d605', 'Cusco', 'Cusco', true),
  ('ef90eb80-a627-43c9-b134-1c8994e419d4', 32, 'Huaytará', '57e96d43-5283-482b-a916-e21d72c7d605', 'Huancavelica', 'Huaytará', true),
  ('4c4a69ed-b119-4efe-ab42-42e289be0e93', 33, 'Tayacaja', '57e96d43-5283-482b-a916-e21d72c7d605', 'Huancavelica', 'Tayacaja', true),
  ('8a0fd390-2a01-49eb-b842-da5144673861', 34, 'Angaraes', '57e96d43-5283-482b-a916-e21d72c7d605', 'Huancavelica', 'Angaraes', true),
  ('b57bd435-cd62-4823-9f90-a7bd0825bdf1', 35, 'Huancavelica', '57e96d43-5283-482b-a916-e21d72c7d605', 'Huancavelica', 'Huancavelica', true),
  ('dc3e0200-b606-4841-8fc1-4b104e9ce2ab', 36, 'Leoncio Prado', '57e96d43-5283-482b-a916-e21d72c7d605', 'Huánuco', 'Leoncio Prado', true),
  ('b876c23f-5fe3-4d37-9fe5-fe10a1c8607f', 37, 'Puerto Inca', '57e96d43-5283-482b-a916-e21d72c7d605', 'Huánuco', 'Puerto Inca', true),
  ('0b91d030-e3bd-4e04-aea5-30c9c092c8e7', 38, 'Yarowilca', '57e96d43-5283-482b-a916-e21d72c7d605', 'Huánuco', 'Yarowilca', true),
  ('6b17b373-dd1a-4ccd-b598-812a27525ec8', 39, 'Huamalíes', '57e96d43-5283-482b-a916-e21d72c7d605', 'Huánuco', 'Huamalíes', true),
  ('4e762516-ff45-4ea1-9115-f5618394a5a2', 40, 'Huánuco', '57e96d43-5283-482b-a916-e21d72c7d605', 'Huánuco', 'Huánuco', true),
  ('e5d073f4-0ea2-402e-be50-69b5e7fc4cf4', 41, 'Chincha', '57e96d43-5283-482b-a916-e21d72c7d605', 'Ica', 'Chincha', true),
  ('cda6b82f-4cd8-45eb-b334-3bca65fb0743', 42, 'Ica', '57e96d43-5283-482b-a916-e21d72c7d605', 'Ica', 'Ica', true),
  ('a7907e1e-bbe6-4bc8-a3a4-c0272b821c44', 43, 'Chanchamayo', '57e96d43-5283-482b-a916-e21d72c7d605', 'Junín', 'Chanchamayo', true),
  ('5764af03-a79f-4d9b-8225-6f8a5d01b286', 44, 'Huancayo', '57e96d43-5283-482b-a916-e21d72c7d605', 'Junín', 'Huancayo', true),
  ('88bd2c03-b078-4d60-bded-110612c8c4cb', 45, 'Jauja', '57e96d43-5283-482b-a916-e21d72c7d605', 'Junín', 'Jauja', true),
  ('81b1cc8f-d42f-4ec7-96fd-996f191e1541', 46, 'Tarma', '57e96d43-5283-482b-a916-e21d72c7d605', 'Junín', 'Tarma', true),
  ('2b4af35f-3026-4d1f-96ed-5bffb8cfb406', 47, 'Pacasmayo', '57e96d43-5283-482b-a916-e21d72c7d605', 'La Libertad', 'Pacasmayo', true),
  ('d23c8726-af15-42a7-8496-58bf6ba00c20', 48, 'Pataz', '57e96d43-5283-482b-a916-e21d72c7d605', 'La Libertad', 'Pataz', true),
  ('a3783673-c1b5-45b0-a17b-79b5ccd02827', 49, 'Trujillo', '57e96d43-5283-482b-a916-e21d72c7d605', 'La Libertad', 'Trujillo', true),
  ('0f087d9a-b7d9-4517-bba9-9152cbba3221', 50, 'Sánchez Carrión', '57e96d43-5283-482b-a916-e21d72c7d605', 'La Libertad', 'Sánchez Carrión', true),
  ('b9f36b68-650a-4c01-be7e-2e401b0f34d4', 51, 'Chiclayo', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lambayeque', 'Chiclayo', true),
  ('37e6005c-3a51-4d84-ba0f-7957a707a39f', 52, 'Lima Centro', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Lima Centro', true),
  ('3bcb4dd8-9e21-496e-b987-4ea545d029dc', 53, 'Lima Oeste 3', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Lima Oeste 3', true),
  ('9bcb9e92-0c7b-4364-a323-13a481aebc69', 54, 'Lima Sur 2', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Lima Sur 2', true),
  ('aa78b300-a1c9-48db-aa50-3f9b59537426', 55, 'Lima Oeste 1', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Lima Oeste 1', true),
  ('144d4b35-70d8-4ee8-a31c-924021074792', 56, 'Lima Oeste 2', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Lima Oeste 2', true),
  ('6562c49f-1dde-41cd-a482-3c64081a53bd', 57, 'Lima Norte 1', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Lima Norte 1', true),
  ('50e98fc5-4b4c-4f3d-98e2-fc854244b73e', 58, 'Lima Norte 2', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Lima Norte 2', true),
  ('ddb16e45-c0bc-4319-899c-64a98533f269', 59, 'Lima Sur 1', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Lima Sur 1', true),
  ('e81057f8-06f4-4178-b9dd-7471753e4ee3', 60, 'Yauyos', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Yauyos', true),
  ('16e3fd1c-3911-445a-8ee1-9eacf6363e19', 61, 'Huaral', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Huaral', true),
  ('e0e95bb4-7a6f-438f-92ef-7d6e226f792e', 62, 'Huarochirí', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Huarochirí', true),
  ('6d7ba911-24ed-44b2-8656-45ecf7b5f8c2', 63, 'Cañete', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Cañete', true),
  ('124a382d-7786-4458-8479-04f0ff66eeba', 64, 'Huaura', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Huaura', true),
  ('2ac0a161-d284-4443-8fcc-2fdb73c55357', 65, 'Lima Este 1', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Lima Este 1', true),
  ('042f1011-e94c-4454-b9d4-e696c5b0c16f', 66, 'Lima Este 2', '57e96d43-5283-482b-a916-e21d72c7d605', 'Lima', 'Lima Este 2', true),
  ('5442b355-70ae-4a05-8019-a6c366fb9716', 67, 'Requena', '57e96d43-5283-482b-a916-e21d72c7d605', 'Loreto', 'Requena', true),
  ('3bd0a9b8-0b1f-4171-903b-9f1ac03e3553', 68, 'Mariscal Ramón Castilla', '57e96d43-5283-482b-a916-e21d72c7d605', 'Loreto', 'Mariscal Ramón Castilla', true),
  ('d3036579-a0fb-40a8-bc6e-8cd5a4834886', 69, 'Ucayali', '57e96d43-5283-482b-a916-e21d72c7d605', 'Loreto', 'Ucayali', true),
  ('41522e09-cf6d-4849-bd83-7d788fb1146c', 70, 'Alto Amazonas', '57e96d43-5283-482b-a916-e21d72c7d605', 'Loreto', 'Alto Amazonas', true),
  ('26bfbb96-0da8-4ffd-b51f-8397eaaaff84', 71, 'Maynas', '57e96d43-5283-482b-a916-e21d72c7d605', 'Loreto', 'Maynas', true),
  ('016803f0-729b-4215-b18b-c7e690941877', 72, 'Tambopata', '57e96d43-5283-482b-a916-e21d72c7d605', 'Madre de Dios', 'Tambopata', true),
  ('089c7233-3155-44e3-860e-2f67c2eb11c4', 73, 'Mariscal Nieto', '57e96d43-5283-482b-a916-e21d72c7d605', 'Moquegua', 'Mariscal Nieto', true),
  ('e4cb1657-95bd-46b1-a96d-bc4220685662', 74, 'Oxapampa', '57e96d43-5283-482b-a916-e21d72c7d605', 'Pasco', 'Oxapampa', true),
  ('36712b44-af51-4838-b69d-bbffa25ca121', 75, 'Pasco', '57e96d43-5283-482b-a916-e21d72c7d605', 'Pasco', 'Pasco', true),
  ('be365e2b-f8f5-4b74-8628-c86407d2c5f5', 76, 'Morropón', '57e96d43-5283-482b-a916-e21d72c7d605', 'Piura', 'Morropón', true),
  ('67613404-d3b6-42c6-9b98-1a9cf5ea1739', 77, 'Sullana', '57e96d43-5283-482b-a916-e21d72c7d605', 'Piura', 'Sullana', true),
  ('cde43336-319f-4f07-a2d0-6104e1f864b6', 78, 'Piura', '57e96d43-5283-482b-a916-e21d72c7d605', 'Piura', 'Piura', true),
  ('7f66c4ad-ba99-4da4-ad80-8144757684ed', 79, 'San Román', '57e96d43-5283-482b-a916-e21d72c7d605', 'Puno', 'San Román', true),
  ('e036ee53-20cd-402c-92cc-f0a1a9179d8d', 80, 'Puno', '57e96d43-5283-482b-a916-e21d72c7d605', 'Puno', 'Puno', true),
  ('aed66ba9-565b-4501-bb1c-3617d5531312', 81, 'San Antonio de Putina', '57e96d43-5283-482b-a916-e21d72c7d605', 'Puno', 'San Antonio de Putina', true),
  ('862d799d-087d-4892-8929-c38830f43725', 82, 'Azángaro', '57e96d43-5283-482b-a916-e21d72c7d605', 'Puno', 'Azángaro', true),
  ('ef36b839-20e2-45e3-9d8b-25f52d5bc70f', 83, 'Huancané', '57e96d43-5283-482b-a916-e21d72c7d605', 'Puno', 'Huancané', true),
  ('28f457eb-5fd5-49e4-b4c4-2095727d6f29', 84, 'San Martín', '57e96d43-5283-482b-a916-e21d72c7d605', 'San Martín', 'San Martín', true),
  ('deaa1338-9407-4bab-8620-40ef7012f52c', 85, 'Mariscal Cáceres', '57e96d43-5283-482b-a916-e21d72c7d605', 'San Martín', 'Mariscal Cáceres', true),
  ('5a1e8051-2218-435d-9bea-54e10150b215', 86, 'Moyobamba', '57e96d43-5283-482b-a916-e21d72c7d605', 'San Martín', 'Moyobamba', true),
  ('d908ee0d-f979-47c7-a79c-7331dc12e7ac', 87, 'Tacna', '57e96d43-5283-482b-a916-e21d72c7d605', 'Tacna', 'Tacna', true),
  ('410c57e4-5abf-4d95-b2b6-c5f53cdbe4d4', 88, 'Tumbes', '57e96d43-5283-482b-a916-e21d72c7d605', 'Tumbes', 'Tumbes', true),
  ('b79f9d9e-eba7-4e4a-8e8e-7a81898528df', 89, 'Atalaya', '57e96d43-5283-482b-a916-e21d72c7d605', 'Ucayali', 'Atalaya', true),
  ('f004ff10-69a1-4bf0-9273-f380a286d895', 90, 'Coronel Portillo', '57e96d43-5283-482b-a916-e21d72c7d605', 'Ucayali', 'Coronel Portillo', true),
  ('31bdd581-1588-4217-a39b-30b27d4446da', 91, 'Callao', '57e96d43-5283-482b-a916-e21d72c7d605', '', 'Callao', true)
on conflict (id) do update set
  jury_code = excluded.jury_code,
  jury_name = excluded.jury_name,
  electoral_process_id = excluded.electoral_process_id,
  department = excluded.department,
  province = excluded.province,
  is_active = true;

create table public.profile_jury_assignments (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  special_jury_id uuid not null references public.special_juries(id) on delete cascade,
  is_active boolean not null default true,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, special_jury_id)
);
create index profile_jury_assignments_jury_id_idx
  on public.profile_jury_assignments(special_jury_id) where is_active;
revoke all on public.profile_jury_assignments from public, anon, authenticated;
alter table public.profile_jury_assignments enable row level security;
create trigger profile_jury_assignments_touch_updated_at
  before update on public.profile_jury_assignments
  for each row execute function private.touch_updated_at();

create or replace function private.is_administrator()
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.active_profile() and exists (
    select 1
    from public.profile_roles pr
    join public.roles r on r.id = pr.role_id
    where pr.profile_id = (select auth.uid())
      and pr.is_active and r.is_active and r.name = 'Administrador'
  );
$$;

create or replace function private.can_access_jury(p_jury_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.active_profile() and exists (
    select 1
    from public.special_juries sj
    left join public.electoral_processes ep on ep.id = sj.electoral_process_id
    where sj.id = p_jury_id and sj.is_active
      and (
        (
          not coalesce(ep.accepts_registrations, true)
          and (private.is_monitor() or private.is_administrator())
        )
        or (
          coalesce(ep.accepts_registrations, true)
          and (
            not coalesce(ep.requires_jury_assignment, false)
            or private.is_administrator()
            or exists (
              select 1 from public.profile_jury_assignments pja
              where pja.profile_id = (select auth.uid())
                and pja.special_jury_id = sj.id and pja.is_active
            )
          )
        )
      )
  );
$$;

create or replace function private.can_access_activity(p_activity_id uuid, p_action text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.has_action('GREGACT', p_action) and exists (
    select 1
    from public.activity_registrations ar
    join public.electoral_processes ep on ep.id = ar.electoral_process_id
    where ar.id = p_activity_id and ar.is_active
      and (
        (
          not ep.accepts_registrations
          and p_action = 'LIST'
          and (private.is_monitor() or private.is_administrator())
        )
        or (
          ep.accepts_registrations
          and (
            ar.created_by = (select auth.uid())
            or private.is_administrator()
            or (
              private.is_monitor()
              and (
                not ep.requires_jury_assignment
                or exists (
                  select 1 from public.profile_jury_assignments pja
                  where pja.profile_id = (select auth.uid())
                    and pja.special_jury_id = ar.special_jury_id and pja.is_active
                )
              )
            )
          )
        )
      )
  );
$$;

revoke all on function private.is_administrator() from public, anon, authenticated;
revoke all on function private.can_access_jury(uuid) from public, anon, authenticated;
revoke all on function private.can_access_activity(uuid,text) from public, anon, authenticated;
grant execute on function private.is_administrator() to authenticated;
grant execute on function private.can_access_jury(uuid) to authenticated;
grant execute on function private.can_access_activity(uuid,text) to authenticated;

grant select on public.profile_jury_assignments to authenticated;
create policy profile_jury_assignments_read on public.profile_jury_assignments
  for select to authenticated
  using (
    profile_id = (select auth.uid())
    or (select private.is_administrator())
  );

drop policy special_juries_read on public.special_juries;
create policy special_juries_read on public.special_juries
  for select to authenticated
  using (is_active and (select private.can_access_jury(id)));

drop policy activity_registrations_read on public.activity_registrations;
create policy activity_registrations_read on public.activity_registrations
  for select to authenticated
  using (is_active and private.can_access_activity(id, 'LIST'));

create or replace function private.assert_activity_catalogs(
  p_format_id uuid, p_assistant_id uuid, p_target_id uuid,
  p_process_id uuid, p_jury_id uuid
)
returns void
language plpgsql
set search_path = pg_catalog
as $$
begin
  if not exists (
    select 1 from public.activity_formats af
    join public.activity_types at on at.id = af.activity_type_id and at.is_active
    where af.id = p_format_id and af.is_active
      and af.electoral_process_id = p_process_id
  ) or not exists (select 1 from public.assistant_types where id = p_assistant_id and is_active)
    or not exists (
      select 1 from public.target_audiences
      where id = p_target_id and is_active and electoral_process_id = p_process_id
    ) or not exists (
      select 1 from public.electoral_processes
      where id = p_process_id and is_active and accepts_registrations
    )
    or not exists (
      select 1 from public.special_juries
      where id = p_jury_id and is_active and electoral_process_id = p_process_id
    ) then
    raise exception 'Missing, inactive, or mismatched activity catalog reference'
      using errcode = '23503';
  end if;
end;
$$;
revoke all on function private.assert_activity_catalogs(uuid,uuid,uuid,uuid,uuid)
  from public, anon, authenticated;

create or replace function public.create_activity(
  p_format_id uuid, p_assistant_id uuid, p_target_id uuid,
  p_process_id uuid, p_jury_id uuid, p_place text, p_date date, p_time time,
  p_observations text default null, p_questions text default null,
  p_recommendations text default null, p_participants jsonb default '[]'::jsonb
)
returns table(activity_id uuid, activity_code text)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor uuid := auth.uid();
  v_series text;
  v_number integer;
  v_id uuid;
  v_code text;
begin
  if actor is null or not private.has_action('GREGACT', 'ADD') then
    raise exception 'Not authorized to register an activity' using errcode = '42501';
  end if;
  if nullif(btrim(p_place), '') is null or p_date is null or p_time is null then
    raise exception 'Place, date and time are required' using errcode = '22023';
  end if;
  perform private.assert_activity_catalogs(
    p_format_id, p_assistant_id, p_target_id, p_process_id, p_jury_id
  );
  if not private.can_access_jury(p_jury_id) then
    raise exception 'Not authorized for the selected special jury' using errcode = '42501';
  end if;
  select af.series, af.next_number into v_series, v_number
    from public.activity_formats af where af.id = p_format_id and af.is_active
    for update;
  if not found then
    raise exception 'Activity format is unavailable' using errcode = '23503';
  end if;
  v_code := v_series || lpad(v_number::text, greatest(4, length(v_number::text)), '0');
  insert into public.activity_registrations (
    code, activity_format_id, assistant_type_id, target_audience_id,
    electoral_process_id, special_jury_id, place, activity_date,
    activity_time, observations, questions, recommendations, created_by
  ) values (
    v_code, p_format_id, p_assistant_id, p_target_id,
    p_process_id, p_jury_id, btrim(p_place), p_date,
    p_time, p_observations, p_questions, p_recommendations, actor
  ) returning id into v_id;
  perform private.insert_activity_participants(v_id, p_participants, actor);
  update public.activity_formats set next_number = v_number + 1,
    updated_by = actor where id = p_format_id;
  return query select v_id, v_code;
end;
$$;

create or replace function public.replace_activity(
  p_activity_id uuid, p_format_id uuid, p_assistant_id uuid, p_target_id uuid,
  p_process_id uuid, p_jury_id uuid, p_place text, p_date date, p_time time,
  p_observations text default null, p_questions text default null,
  p_recommendations text default null, p_participants jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not private.can_access_activity(p_activity_id, 'EDIT') then
    raise exception 'Not authorized to edit this activity' using errcode = '42501';
  end if;
  if nullif(btrim(p_place), '') is null or p_date is null or p_time is null then
    raise exception 'Place, date and time are required' using errcode = '22023';
  end if;
  perform private.assert_activity_catalogs(
    p_format_id, p_assistant_id, p_target_id, p_process_id, p_jury_id
  );
  if not private.can_access_jury(p_jury_id) then
    raise exception 'Not authorized for the selected special jury' using errcode = '42501';
  end if;
  update public.activity_registrations set
    activity_format_id = p_format_id, assistant_type_id = p_assistant_id,
    target_audience_id = p_target_id, electoral_process_id = p_process_id,
    special_jury_id = p_jury_id, place = btrim(p_place),
    activity_date = p_date, activity_time = p_time,
    observations = p_observations, questions = p_questions,
    recommendations = p_recommendations, updated_by = actor
  where id = p_activity_id and is_active;
  update public.activity_participants set is_active = false, updated_by = actor
    where activity_id = p_activity_id and is_active;
  perform private.insert_activity_participants(p_activity_id, p_participants, actor);
end;
$$;

create view public.activity_list with (security_invoker = true) as
select ar.id, ar.code, ar.place, ar.activity_date, ar.activity_time,
  ar.is_active, ar.created_at, ar.created_by, ar.special_jury_id,
  ar.activity_format_id, af.topic, af.series,
  at.name as activity_type_name, ast.name as assistant_type_name,
  ta.name as target_audience_name, ep.name as electoral_process_name,
  sj.jury_name,
  (select count(*) from public.activity_participants ap
    where ap.activity_id = ar.id and ap.is_active) as participant_count,
  (select ae.id from public.activity_evidence ae
    where ae.activity_id = ar.id and ae.kind = 'attendance-list'
      and ae.is_active and ae.is_available order by ae.created_at desc limit 1) as attendance_evidence_id,
  (select ae.id from public.activity_evidence ae
    where ae.activity_id = ar.id and ae.kind = 'photographic-record'
      and ae.is_active and ae.is_available order by ae.created_at desc limit 1) as photo_evidence_id,
  af.activity_type_id, af.next_number, ar.assistant_type_id,
  ar.target_audience_id, ar.electoral_process_id
from public.activity_registrations ar
join public.activity_formats af on af.id = ar.activity_format_id
join public.activity_types at on at.id = af.activity_type_id
join public.assistant_types ast on ast.id = ar.assistant_type_id
join public.target_audiences ta on ta.id = ar.target_audience_id
join public.electoral_processes ep on ep.id = ar.electoral_process_id
join public.special_juries sj on sj.id = ar.special_jury_id
where ar.is_active;

revoke all on public.activity_list from public, anon, authenticated;
grant select on public.activity_list to authenticated;
