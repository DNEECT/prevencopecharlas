-- Reviewed non-sensitive seed from backup.dump (SHA-256 388f1f5c054cc4e682261a8fc3b09b23d141c65ec2e9a19232ee9b15b2d67c8a).
-- Source UUIDs and inactive grants are retained. User and activity rows are excluded.
-- Repeated execution does not overwrite administrative changes.

insert into public.roles (id, name, description, is_active) values
  ('c943392f-1485-464d-a564-e1867cc9886c', 'Monitor', 'Rol con permisos para registrar y monitorear actividades', true),
  ('636e220a-a80a-4f02-912b-642d2579a99d', 'Gestor', 'Rol con permisos para registrar actividades en el sistema', true)
on conflict (id) do nothing;

-- Institution-specific role added after the source matrix was reconciled.
insert into public.roles (id, name, description, is_active) values
  ('a8f42e1c-9f7d-4f3c-8b5a-2d7e6c9a1042', 'Administrador', 'Acceso institucional completo a todos los módulos activos', true)
on conflict (id) do nothing;

insert into public.actions (id, abbreviation, description, is_active) values
  ('77799fe0-ebae-4d34-90ec-06aec9c8fdb0', 'LIST', 'Listar', true),
  ('62cd4be2-ec33-41cc-ba5c-d3514bf13fb7', 'ADD', 'Agregar', true),
  ('d14b9823-ffd1-4b1f-ba7c-1c2be6257116', 'EDIT', 'Editar', true),
  ('a02986a4-a222-45d6-b812-8e488f1f7813', 'DELETE', 'Eliminar', true),
  ('4389d55f-90b7-4a7e-b5a3-bfc441abbc62', 'APROVE', 'Aprobar', true),
  ('f81bfe6d-d6a5-4d44-844b-c5af88c1d2d7', 'OBSERVE', 'Observar', true)
on conflict (id) do nothing;

insert into public.modules (id, parent_id, abbreviation, name, route, icon, sort_order, is_functional, is_active) values
  ('ffd151ca-36aa-46d7-9e31-2ee152edc86a', NULL, 'GSEG', 'Seguridad', NULL, 'security', 3, true, true),
  ('fd0ff5ef-c7a6-43c2-8f8d-9d41b3278d03', NULL, 'GADM', 'Administración', NULL, 'list_alt', 2, true, true),
  ('9c6a4925-97e7-4dcf-8696-ee146d62998d', NULL, 'GTOD', 'Todos', NULL, 'home', 2, false, true),
  ('2eed32fd-e7fa-41c4-b7ac-7279007fd3be', NULL, 'GREGACT', 'Registro de actividad', '/registro-actividad', 'home', 1, true, true),
  ('23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'fd0ff5ef-c7a6-43c2-8f8d-9d41b3278d03', 'GFORACT', 'Formato de actividad', '/formato-actividad', NULL, 1, true, true),
  ('0a3ab984-ed3d-40c3-bc10-846f9ec64d04', 'fd0ff5ef-c7a6-43c2-8f8d-9d41b3278d03', 'GTIPACT', 'Tipo de actividad', '/tipo-actividad', NULL, 2, true, true),
  ('36ac3410-0f18-446f-9556-8a86973da8c5', 'ffd151ca-36aa-46d7-9e31-2ee152edc86a', 'GUSU', 'Usuarios', '/usuario', NULL, 1, true, true),
  ('866e3ea1-39d9-4740-b466-f04a1763043b', 'ffd151ca-36aa-46d7-9e31-2ee152edc86a', 'GPRM', 'Permisos', '/permiso', NULL, 1, true, true)
on conflict (id) do nothing;

insert into public.module_actions (id, module_id, action_id, is_active) values
  ('cb61dd88-ac4f-4721-8d83-f8cc4edb79d3', '36ac3410-0f18-446f-9556-8a86973da8c5', '77799fe0-ebae-4d34-90ec-06aec9c8fdb0', true),
  ('4263df35-2975-4226-ad4d-0cffc6cf8352', '36ac3410-0f18-446f-9556-8a86973da8c5', '62cd4be2-ec33-41cc-ba5c-d3514bf13fb7', true),
  ('cd91255a-d592-49a3-909a-3af75cbed3dd', '36ac3410-0f18-446f-9556-8a86973da8c5', 'd14b9823-ffd1-4b1f-ba7c-1c2be6257116', true),
  ('63e9f827-37b3-46f1-80f6-f9c3b5a661df', '36ac3410-0f18-446f-9556-8a86973da8c5', 'a02986a4-a222-45d6-b812-8e488f1f7813', true),
  ('b878894a-0262-4bc2-9a6e-6efb6cf9b1ad', '866e3ea1-39d9-4740-b466-f04a1763043b', '77799fe0-ebae-4d34-90ec-06aec9c8fdb0', true),
  ('d3e6625f-19e3-423f-832f-08970cefaa4c', '866e3ea1-39d9-4740-b466-f04a1763043b', '62cd4be2-ec33-41cc-ba5c-d3514bf13fb7', true),
  ('221a6b17-13d1-4d77-bfcd-62e44d8e1635', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '77799fe0-ebae-4d34-90ec-06aec9c8fdb0', true),
  ('43aae85e-0367-488a-b1e4-4937653189b1', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '62cd4be2-ec33-41cc-ba5c-d3514bf13fb7', true),
  ('13d4c2d6-90d5-4abd-adb6-48c28d9e7453', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', 'd14b9823-ffd1-4b1f-ba7c-1c2be6257116', true),
  ('8f38ce93-4005-482d-8d03-7636811af7dd', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', 'a02986a4-a222-45d6-b812-8e488f1f7813', true),
  ('032877fd-019e-4fbb-b169-5f2bd39b168f', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '4389d55f-90b7-4a7e-b5a3-bfc441abbc62', true),
  ('cf7e979b-389f-4fe1-b524-b5bc7b9e105e', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', 'f81bfe6d-d6a5-4d44-844b-c5af88c1d2d7', true),
  ('b383533d-77fc-47e7-a1b0-e523b6aa04b2', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', '77799fe0-ebae-4d34-90ec-06aec9c8fdb0', true),
  ('d1a75772-9208-4815-8237-92eef75c29e5', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', '62cd4be2-ec33-41cc-ba5c-d3514bf13fb7', true),
  ('6cdd243a-de41-4c57-ba25-4cfe1d7c737f', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'd14b9823-ffd1-4b1f-ba7c-1c2be6257116', true),
  ('96c912c9-430a-4ea4-b218-8046db0b3cc2', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'a02986a4-a222-45d6-b812-8e488f1f7813', true),
  ('91a25ff7-6195-47ed-bdb6-e1d2a780bde6', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', '77799fe0-ebae-4d34-90ec-06aec9c8fdb0', true),
  ('cfc747fb-434a-41fe-89b0-45c4a9985540', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', '62cd4be2-ec33-41cc-ba5c-d3514bf13fb7', true),
  ('d31af4e2-316f-4681-a416-97b2c605a170', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', 'd14b9823-ffd1-4b1f-ba7c-1c2be6257116', true),
  ('320ef457-dd8f-4b38-8e14-ed538eaae02a', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', 'a02986a4-a222-45d6-b812-8e488f1f7813', true),
  ('0359fbe8-f638-4960-95ef-c2a26737d442', '9c6a4925-97e7-4dcf-8696-ee146d62998d', '77799fe0-ebae-4d34-90ec-06aec9c8fdb0', true)
on conflict (id) do nothing;

insert into public.role_modules (id, role_id, module_id, is_active) values
  ('fbebd4c0-d6a9-42c2-9742-1c6e926ee370', 'c943392f-1485-464d-a564-e1867cc9886c', '36ac3410-0f18-446f-9556-8a86973da8c5', true),
  ('6f462921-2c96-40e5-83b1-5c48e05521e5', 'c943392f-1485-464d-a564-e1867cc9886c', '866e3ea1-39d9-4740-b466-f04a1763043b', true),
  ('20b7e662-9011-4fc0-a97c-9e5b3eaf5571', 'c943392f-1485-464d-a564-e1867cc9886c', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', true),
  ('cbb18b37-11a2-4f78-9b6f-ba1e95d1fd20', 'c943392f-1485-464d-a564-e1867cc9886c', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', true),
  ('5770d66e-7fd0-4cf9-bdb1-1e01ff5f8ca7', 'c943392f-1485-464d-a564-e1867cc9886c', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', true),
  ('a75f0be9-7aa1-41a4-a57a-dfea1c2d8bec', 'c943392f-1485-464d-a564-e1867cc9886c', '9c6a4925-97e7-4dcf-8696-ee146d62998d', true),
  ('48c6f11f-d79d-4d0f-9888-ed07f29b9317', '636e220a-a80a-4f02-912b-642d2579a99d', '36ac3410-0f18-446f-9556-8a86973da8c5', true),
  ('4cba465e-e4cb-4f7c-b29e-1392e8c83190', '636e220a-a80a-4f02-912b-642d2579a99d', '866e3ea1-39d9-4740-b466-f04a1763043b', true),
  ('734c6f61-dbab-43c1-9b7b-200430ed5e59', '636e220a-a80a-4f02-912b-642d2579a99d', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', true),
  ('bd9e40da-d632-4f35-bf00-b3e04677ccb5', '636e220a-a80a-4f02-912b-642d2579a99d', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', true),
  ('52259a18-c154-4783-a22e-82a087e919e7', '636e220a-a80a-4f02-912b-642d2579a99d', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', true),
  ('c1bf4ae6-104d-4144-8bbf-d51eb77825f1', '636e220a-a80a-4f02-912b-642d2579a99d', '9c6a4925-97e7-4dcf-8696-ee146d62998d', true)
on conflict (id) do nothing;

insert into public.role_module_actions (id, module_id, role_module_id, module_action_id, is_active) values
  ('8208d585-fa9b-4c80-986c-82695836a056', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '20b7e662-9011-4fc0-a97c-9e5b3eaf5571', '221a6b17-13d1-4d77-bfcd-62e44d8e1635', true),
  ('bb8cbb21-62b2-4e07-b6cd-2f73e998dcc0', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '20b7e662-9011-4fc0-a97c-9e5b3eaf5571', '43aae85e-0367-488a-b1e4-4937653189b1', true),
  ('d44ff48f-c8c0-4488-b661-bbc5116aa3f6', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '20b7e662-9011-4fc0-a97c-9e5b3eaf5571', '13d4c2d6-90d5-4abd-adb6-48c28d9e7453', true),
  ('b06afe8d-eff3-45b7-bfad-e88c4920a4f9', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '20b7e662-9011-4fc0-a97c-9e5b3eaf5571', '8f38ce93-4005-482d-8d03-7636811af7dd', true),
  ('cd4ef741-427e-478c-8400-9fa34a06d47f', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '20b7e662-9011-4fc0-a97c-9e5b3eaf5571', '032877fd-019e-4fbb-b169-5f2bd39b168f', true),
  ('61f542ec-a01a-4919-939c-a86f49c8f721', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '20b7e662-9011-4fc0-a97c-9e5b3eaf5571', 'cf7e979b-389f-4fe1-b524-b5bc7b9e105e', true),
  ('16acf353-7277-4130-9b88-05f528b62240', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'cbb18b37-11a2-4f78-9b6f-ba1e95d1fd20', 'b383533d-77fc-47e7-a1b0-e523b6aa04b2', true),
  ('74fcd632-f2f8-436e-959c-b30bf783a483', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'cbb18b37-11a2-4f78-9b6f-ba1e95d1fd20', 'd1a75772-9208-4815-8237-92eef75c29e5', true),
  ('bb9ba7b8-e892-41f3-bbed-f446aa7c0365', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'cbb18b37-11a2-4f78-9b6f-ba1e95d1fd20', '6cdd243a-de41-4c57-ba25-4cfe1d7c737f', true),
  ('bca32745-943e-48a5-b4aa-67d4f2de44e1', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'cbb18b37-11a2-4f78-9b6f-ba1e95d1fd20', '96c912c9-430a-4ea4-b218-8046db0b3cc2', true),
  ('0c5725d5-e50c-44ce-9278-7f999e49f2f2', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', '5770d66e-7fd0-4cf9-bdb1-1e01ff5f8ca7', '91a25ff7-6195-47ed-bdb6-e1d2a780bde6', true),
  ('5fe2def0-b8b3-4439-9a61-18c786430b95', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', '5770d66e-7fd0-4cf9-bdb1-1e01ff5f8ca7', 'cfc747fb-434a-41fe-89b0-45c4a9985540', true),
  ('b969d49d-ade8-413f-937a-4991e2305ba6', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', '5770d66e-7fd0-4cf9-bdb1-1e01ff5f8ca7', 'd31af4e2-316f-4681-a416-97b2c605a170', true),
  ('4d2434a1-0c68-4889-9071-aa35b6274ebb', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', '5770d66e-7fd0-4cf9-bdb1-1e01ff5f8ca7', '320ef457-dd8f-4b38-8e14-ed538eaae02a', true),
  ('cf0c7dc4-f30c-488c-9056-25ca8f2587d2', '36ac3410-0f18-446f-9556-8a86973da8c5', 'fbebd4c0-d6a9-42c2-9742-1c6e926ee370', 'cb61dd88-ac4f-4721-8d83-f8cc4edb79d3', true),
  ('c30058a8-e641-4b85-a29c-7e6387186d6e', '36ac3410-0f18-446f-9556-8a86973da8c5', 'fbebd4c0-d6a9-42c2-9742-1c6e926ee370', '4263df35-2975-4226-ad4d-0cffc6cf8352', true),
  ('f8e31293-807b-4dbf-9660-bd18124323fe', '36ac3410-0f18-446f-9556-8a86973da8c5', 'fbebd4c0-d6a9-42c2-9742-1c6e926ee370', 'cd91255a-d592-49a3-909a-3af75cbed3dd', true),
  ('f3a1e878-a916-476e-9979-4821878a2e19', '36ac3410-0f18-446f-9556-8a86973da8c5', 'fbebd4c0-d6a9-42c2-9742-1c6e926ee370', '63e9f827-37b3-46f1-80f6-f9c3b5a661df', true),
  ('56f498eb-f875-4f7f-948d-148dce9ffd68', '866e3ea1-39d9-4740-b466-f04a1763043b', '6f462921-2c96-40e5-83b1-5c48e05521e5', 'b878894a-0262-4bc2-9a6e-6efb6cf9b1ad', false),
  ('be8a3079-6287-4017-abbc-213d6c7a57d1', '866e3ea1-39d9-4740-b466-f04a1763043b', '6f462921-2c96-40e5-83b1-5c48e05521e5', 'd3e6625f-19e3-423f-832f-08970cefaa4c', false),
  ('dee5e2d6-6b33-4951-b645-ce9050bbc41d', '9c6a4925-97e7-4dcf-8696-ee146d62998d', 'a75f0be9-7aa1-41a4-a57a-dfea1c2d8bec', '0359fbe8-f638-4960-95ef-c2a26737d442', true),
  ('d5762fd0-5996-4fdf-9788-9c4e864facca', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '734c6f61-dbab-43c1-9b7b-200430ed5e59', '221a6b17-13d1-4d77-bfcd-62e44d8e1635', true),
  ('134d6b67-d0ac-4e29-bb37-7957aba3d65c', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '734c6f61-dbab-43c1-9b7b-200430ed5e59', '43aae85e-0367-488a-b1e4-4937653189b1', true),
  ('46405245-06fe-4ec1-90c0-3c7031812278', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '734c6f61-dbab-43c1-9b7b-200430ed5e59', '13d4c2d6-90d5-4abd-adb6-48c28d9e7453', true),
  ('f15cb81f-5b19-4653-9f55-91516aa87952', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '734c6f61-dbab-43c1-9b7b-200430ed5e59', '8f38ce93-4005-482d-8d03-7636811af7dd', true),
  ('4259d171-9b51-46f8-838c-c6a96e5c55d3', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '734c6f61-dbab-43c1-9b7b-200430ed5e59', '032877fd-019e-4fbb-b169-5f2bd39b168f', false),
  ('a85f4aa0-d706-44a6-9a96-75d4632f01a8', '2eed32fd-e7fa-41c4-b7ac-7279007fd3be', '734c6f61-dbab-43c1-9b7b-200430ed5e59', 'cf7e979b-389f-4fe1-b524-b5bc7b9e105e', false),
  ('58a6d592-ed7e-4ab3-9d4e-050ae8446832', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'bd9e40da-d632-4f35-bf00-b3e04677ccb5', 'b383533d-77fc-47e7-a1b0-e523b6aa04b2', false),
  ('0bc353dd-4782-4914-93fb-d4b5d7de0971', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'bd9e40da-d632-4f35-bf00-b3e04677ccb5', 'd1a75772-9208-4815-8237-92eef75c29e5', false),
  ('01dd4f5f-7c22-40c8-a47e-f6f4787edd5f', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'bd9e40da-d632-4f35-bf00-b3e04677ccb5', '6cdd243a-de41-4c57-ba25-4cfe1d7c737f', false),
  ('65c78eeb-cad4-4516-af87-ef272671c50a', '23566022-eec4-4ee6-8e7a-c6dc835b9ae7', 'bd9e40da-d632-4f35-bf00-b3e04677ccb5', '96c912c9-430a-4ea4-b218-8046db0b3cc2', false),
  ('d57c7066-d252-49c5-9c3f-4ba12663006c', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', '52259a18-c154-4783-a22e-82a087e919e7', '91a25ff7-6195-47ed-bdb6-e1d2a780bde6', false),
  ('49ea73d1-e8a7-4736-aede-27cbe0ac5232', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', '52259a18-c154-4783-a22e-82a087e919e7', 'cfc747fb-434a-41fe-89b0-45c4a9985540', false),
  ('7a8f141e-a1ce-4106-afaf-7d123461c2e3', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', '52259a18-c154-4783-a22e-82a087e919e7', 'd31af4e2-316f-4681-a416-97b2c605a170', false),
  ('8ca19aa4-7300-4ef5-a7d4-63e66dd57a03', '0a3ab984-ed3d-40c3-bc10-846f9ec64d04', '52259a18-c154-4783-a22e-82a087e919e7', '320ef457-dd8f-4b38-8e14-ed538eaae02a', false),
  ('80a51e99-0b19-4f55-8075-c9fa8ca31c7b', '36ac3410-0f18-446f-9556-8a86973da8c5', '48c6f11f-d79d-4d0f-9888-ed07f29b9317', 'cb61dd88-ac4f-4721-8d83-f8cc4edb79d3', false),
  ('bddf6a03-8965-4439-9554-47bb226c9e0d', '36ac3410-0f18-446f-9556-8a86973da8c5', '48c6f11f-d79d-4d0f-9888-ed07f29b9317', '4263df35-2975-4226-ad4d-0cffc6cf8352', false),
  ('919dddc2-6bf5-4f4d-847a-464580c52fd3', '36ac3410-0f18-446f-9556-8a86973da8c5', '48c6f11f-d79d-4d0f-9888-ed07f29b9317', 'cd91255a-d592-49a3-909a-3af75cbed3dd', false),
  ('d541663a-2819-42ac-b3bd-aea4d384824c', '36ac3410-0f18-446f-9556-8a86973da8c5', '48c6f11f-d79d-4d0f-9888-ed07f29b9317', '63e9f827-37b3-46f1-80f6-f9c3b5a661df', false),
  ('e7cffb4a-d464-4be3-8c16-d19df12c6836', '866e3ea1-39d9-4740-b466-f04a1763043b', '4cba465e-e4cb-4f7c-b29e-1392e8c83190', 'b878894a-0262-4bc2-9a6e-6efb6cf9b1ad', false),
  ('c7fcfbc1-247b-4ad4-835b-845cf0b196a0', '866e3ea1-39d9-4740-b466-f04a1763043b', '4cba465e-e4cb-4f7c-b29e-1392e8c83190', 'd3e6625f-19e3-423f-832f-08970cefaa4c', false),
  ('992425c4-3277-4a91-bd55-173a0ea3b23d', '9c6a4925-97e7-4dcf-8696-ee146d62998d', 'c1bf4ae6-104d-4144-8bbf-d51eb77825f1', '0359fbe8-f638-4960-95ef-c2a26737d442', true)
on conflict (id) do nothing;

-- Fresh environments receive the same complete Administrator matrix after the
-- source modules and actions exist. Re-seeding does not overwrite later edits.
insert into public.role_modules (role_id, module_id, is_active)
select 'a8f42e1c-9f7d-4f3c-8b5a-2d7e6c9a1042', m.id, true
from public.modules m
where m.is_active
on conflict (role_id, module_id) do nothing;

insert into public.role_module_actions (
  module_id, role_module_id, module_action_id, is_active
)
select rm.module_id, rm.id, ma.id, true
from public.role_modules rm
join public.modules m on m.id = rm.module_id and m.is_active
join public.module_actions ma on ma.module_id = rm.module_id and ma.is_active
join public.actions a on a.id = ma.action_id and a.is_active
where rm.role_id = 'a8f42e1c-9f7d-4f3c-8b5a-2d7e6c9a1042'
on conflict (role_module_id, module_action_id) do nothing;

insert into public.activity_types (id, name, description, is_active) values
  ('745abaf0-d612-49aa-a7cb-371aab77692a', 'Charla informativa', 'Voto informado para la prevención de conflictos electorales', true)
on conflict (id) do nothing;

insert into public.assistant_types (id, name, description, is_active) values
  ('d518206d-3aea-49f3-95c3-bf93d43b82a9', 'Electores', 'Electores', true),
  ('144d8a22-4d81-4816-928a-9462c9002c7b', 'Organizaciones Políticas', 'Organizaciones Políticas', true),
  ('65afe5c3-8f6e-4fc3-953c-afe87a1fc6f3', 'Medios de Comunicación', 'Medios de Comunicación', true),
  ('95adcbeb-ee1b-4096-b168-235128ffc8b1', 'Organizaciones Sociales', 'Organizaciones Sociales', true),
  ('38d439da-cd49-4a04-9323-7f223c33ddcc', 'Voluntarios', 'Voluntarios', true),
  ('cc5e4585-5ab7-4adb-ae85-329994031d86', 'Autoridades', 'Autoridades', true),
  ('d1065dbc-be15-4705-8c88-ed6cf5838140', 'Otros', 'Otros', true)
on conflict (id) do nothing;

insert into public.target_audiences (id, name, description, is_active) values
  ('8c3d551a-339f-4069-b3fc-1215c82b1daa', 'Defensoría del Pueblo', 'Defensoría del Pueblo', true),
  ('83a6a0cd-90ca-4c71-b9c8-44447cba479d', 'Ministerio Público', 'Ministerio Público', true),
  ('3898ac46-0465-4f3d-b54b-00daa1f06ea5', 'Prefectura y Subprefecturas', 'Prefectura y Subprefecturas', true),
  ('7bdb2bc7-a59f-41c6-9df4-8f29abc099e2', 'Policía Nacional del Perú', 'Policía Nacional del Perú', true),
  ('09fdaad2-26ed-4a1e-bdf5-a38f86b20c30', 'Comando Conjunto de las Fuerzas Armadas', 'Comando Conjunto de las Fuerzas Armadas', true),
  ('294114d5-6afc-4c6e-8763-4f8435ab1b74', 'Contraloría General de la República', 'Contraloría General de la República', true),
  ('dc7483ab-4d84-4e3b-a350-593cd432d36c', 'Gobierno Regional y Municipio', 'Gobierno Regional y Municipio', true),
  ('b293230c-ce1e-431b-a697-5cfc19c4827f', 'Sindicato', 'Sindicato', true),
  ('9f81d7f6-f9a8-4b28-af3d-891a566e3fc8', 'Gremio Empresarial', 'Gremio Empresarial', true),
  ('d829db6f-4d41-4d6e-9324-4616f4a28d50', 'Organización de Mujeres', 'Organización de Mujeres', true),
  ('d829db6f-4d41-4d6e-9324-4616f4a28d51', 'Otros', 'Otros', true)
on conflict (id) do nothing;

insert into public.electoral_processes (id, name, description, is_active) values
  ('29dc3419-0606-4a86-a816-9012a9414743', 'Elecciones Generales 2026', 'Elecciones Generales 2026', true)
on conflict (id) do nothing;

insert into public.activity_formats (id, activity_type_id, topic, series, next_number, is_active) values
  ('dfbfe5d6-d5c8-4224-a4ce-d840cc579e85', '745abaf0-d612-49aa-a7cb-371aab77692a', 'Voto informado para la prevención de conflictos electorales', 'ACT009', 1642, true)
on conflict (id) do nothing;

insert into public.special_juries (id, jury_code, jury_name, source_process_code, department, province, ubigeo, initials, is_active) values
  ('a4a25cc8-a3e5-49b9-97c1-a910dc198722', 2060, 'CHACHAPOYAS', 124, 'AMAZONAS', 'CHACHAPOYAS', '010101', 'CHAC', true),
  ('e2fb3f87-5d1d-46c7-b6a1-c253fc99c404', 2184, 'BAGUA', 124, 'AMAZONAS', 'BAGUA', '010205', 'BAGU', true),
  ('bd02add8-0402-4b8c-90da-5eb9411be37c', 2061, 'HUARAZ', 124, 'ANCASH', 'HUARAZ', '020101', 'HRAZ', true),
  ('2de03d79-cd25-42e1-b95c-05b28af3fca6', 2186, 'HUARI', 124, 'ANCASH', 'HUARI', '020801', 'HUAR', true),
  ('f54e2b6d-9c67-4256-b074-74c742305c8f', 2185, 'SANTA', 124, 'ANCASH', 'SANTA', '021309', 'SNTA', true),
  ('e5a04def-a71a-408d-8c1a-3f64f3f47774', 2214, 'CAJAMARCA', 124, 'CAJAMARCA', 'CAJAMARCA', '060101', 'CAJA', true),
  ('ce7049a8-7588-4320-b4ca-902c79ef61e5', 2191, 'CHOTA', 124, 'CAJAMARCA', 'CHOTA', '060601', 'CHTA', true),
  ('80c1035c-41ef-48f1-ad3d-f1ebaaf7901f', 2192, 'JAEN', 124, 'CAJAMARCA', 'JAEN', '060801', 'JAEN', true),
  ('d6019a6f-86e5-43b7-a6f1-ec5a3903b10e', 2074, 'CUSCO', 124, 'CUSCO', 'CUSCO', '070101', 'CSCO', true),
  ('df24a0ab-71dd-4810-bbe8-12dc7b0a4c2a', 2193, 'CANCHIS', 124, 'CUSCO', 'CANCHIS', '070601', 'CNCH', true),
  ('efdb3054-13d6-4f18-bcf4-a2ec68593ac7', 2040, 'AREQUIPA 1', 124, 'AREQUIPA', 'AREQUIPA', '040107', 'AQP1', true),
  ('16536a4b-fe8a-4c48-bf6b-ff592b1a274d', 2188, 'AREQUIPA 2', 124, 'AREQUIPA', 'AREQUIPA', '040129', 'AQP2', true),
  ('6b538fd7-0ee3-4056-af5e-4f0a28523ebd', 2067, 'HUAMANGA', 124, 'AYACUCHO', 'HUAMANGA', '050101', 'HMGA', true),
  ('d2d1dbc1-4d2b-4670-82ba-28b8dd35d130', 2189, 'CANGALLO', 124, 'AYACUCHO', 'CANGALLO', '050201', 'CANG', true),
  ('0c475cae-249c-48a5-9a3d-14f58c1aa071', 2190, 'LUCANAS', 124, 'AYACUCHO', 'LUCANAS', '050501', 'LUCA', true),
  ('91a99650-dedc-4c95-8e55-9effeaeca4f1', 2076, 'HUANCAVELICA', 124, 'HUANCAVELICA', 'HUANCAVELICA', '080101', 'HVCA', true),
  ('1d1d346b-0b26-4305-9241-e90b73de5d23', 2100, 'MAYNAS', 124, 'LORETO', 'MAYNAS', '150101', 'MAYN', true),
  ('560ec538-ed71-4e79-8545-92ccb186fc11', 2210, 'ALTO AMAZONAS', 124, 'LORETO', 'ALTO AMAZONAS', '150201', 'AAMZ', true),
  ('abe9b847-6b7d-4315-9579-22b685912ba2', 2103, 'MARISCAL NIETO', 124, 'MOQUEGUA', 'MARISCAL NIETO', '170101', 'MNIE', true),
  ('492c1a90-9ade-4db5-aa9a-263e0692c627', 2041, 'HUANCAYO', 124, 'JUNIN', 'HUANCAYO', '110113', 'HCYO', true),
  ('5f338d6c-1a92-4cc0-8ef2-e693d3c32895', 2196, 'CHANCHAMAYO', 124, 'JUNIN', 'CHANCHAMAYO', '110801', 'CHAN', true),
  ('b9ab47ce-032c-4804-b464-9f35fd09a78f', 2082, 'TRUJILLO', 124, 'LA LIBERTAD', 'TRUJILLO', '120101', 'TRUJ', true),
  ('624a14cf-7ae9-4d59-ac90-da1d2a2014fd', 2213, 'SAN ROMAN', 124, 'PUNO', 'SAN ROMAN', '200901', 'SROM', true),
  ('58f59725-7630-47b7-91cb-78023e5a8440', 2043, 'SAN MARTIN', 124, 'SAN MARTIN', 'SAN MARTIN', '210601', 'SMAR', true),
  ('844eed16-8f93-4cb2-b345-6fcd234b7678', 2104, 'PASCO', 124, 'PASCO', 'PASCO', '180114', 'PASC', true),
  ('72ccca09-8f95-42a7-9018-fdfe053521ea', 2211, 'PIURA 1', 124, 'PIURA', 'PIURA', '190101', 'PIU1', true),
  ('83ed796c-66ee-491b-ad82-e2f36935c58e', 2106, 'PIURA 2', 124, 'PIURA', 'PIURA', '190103', 'PIU2', true),
  ('90ec53b3-b3df-4ee3-b5e6-2d929365d4c6', 2212, 'SULLANA', 124, 'PIURA', 'SULLANA', '190601', 'SULL', true),
  ('87be8d67-f71c-45cc-80ce-d7f90b5276e0', 2108, 'PUNO', 124, 'PUNO', 'PUNO', '200101', 'PUNO', true),
  ('55148da9-9f91-449a-b50f-f622a7186ab9', 2064, 'ABANCAY', 124, 'APURIMAC', 'ABANCAY', '030101', 'ABAN', true),
  ('5fa668f3-37ee-4fbc-a8f0-c8d78349b3f1', 2187, 'ANDAHUAYLAS', 124, 'APURIMAC', 'ANDAHUAYLAS', '030301', 'ANDA', true),
  ('7698dcc5-fc83-4c9b-8474-24b07a0303cf', 2080, 'ICA', 124, 'ICA', 'ICA', '100101', 'ICA0', true),
  ('a04131d2-ab29-429c-99f9-c1da6f451e45', 2198, 'SANCHEZ CARRION', 124, 'LA LIBERTAD', 'SANCHEZ CARRION', '120301', 'SCAR', true),
  ('14d94b0b-d93b-4967-b6ad-7af5d7e865f2', 2197, 'PACASMAYO', 124, 'LA LIBERTAD', 'PACASMAYO', '120501', 'PCYO', true),
  ('a0f61d24-e423-4d27-a55f-5b1f401c0d79', 2042, 'CHICLAYO', 124, 'LAMBAYEQUE', 'CHICLAYO', '130101', 'CHYO', true),
  ('1fa6e88d-8f06-4446-9c5d-167ef1fd00b5', 2199, 'LAMBAYEQUE', 124, 'LAMBAYEQUE', 'LAMBAYEQUE', '130301', 'LAMB', true),
  ('4788c2d2-74f7-4b11-aaef-af64266257f9', 2039, 'LIMA CENTRO 1', 124, 'LIMA', 'LIMA', '140101', 'LIC1', true),
  ('9ee8bc96-7656-4346-a55b-c00b76c063cd', 2206, 'LIMA ESTE 1', 124, 'LIMA', 'LIMA', '140103', 'LIE1', true),
  ('13b43d8d-a96a-4075-86d5-f909924b6ed8', 2201, 'LIMA NORTE 2', 124, 'LIMA', 'LIMA', '140106', 'LIN2', true),
  ('40da95da-96b9-4557-af4c-fcf272b702bb', 2092, 'LIMA OESTE 1', 124, 'LIMA', 'LIMA', '140117', 'LIO1', true),
  ('78db9c67-acf3-45fb-a834-fdb69e400adb', 2200, 'LIMA NORTE 1', 124, 'LIMA', 'LIMA', '140126', 'LIN1', true),
  ('7ad3075f-5d7a-4fe1-a20a-3e7c97f6a694', 2203, 'LIMA OESTE 3', 124, 'LIMA', 'LIMA', '140130', 'LIO3', true),
  ('14f958dd-7919-42c6-93e4-c26efb862be5', 2093, 'LIMA OESTE 2', 124, 'LIMA', 'LIMA', '140131', 'LIO2', true),
  ('1ef6e3d7-a14b-4c71-95dc-aa2b719bf702', 2205, 'LIMA SUR 2', 124, 'LIMA', 'LIMA', '140132', 'LIS2', true),
  ('f1dc6986-e91e-41ef-9541-32ceb01a054f', 2215, 'LIMA CENTRO 2', 124, 'LIMA', 'LIMA', '140133', 'LIC2', true),
  ('21c67fbd-c257-49d2-848c-d647bfe92d6c', 2204, 'LIMA SUR 1', 124, 'LIMA', 'LIMA', '140136', 'LIS1', true),
  ('6121480a-70a5-4add-810e-5acb6bbcb939', 2207, 'LIMA ESTE 2', 124, 'LIMA', 'LIMA', '140137', 'LIE2', true),
  ('e5e86440-eb48-4781-aadd-c71a49cd948b', 2202, 'LIMA NORTE 3', 124, 'LIMA', 'LIMA', '140142', 'LIN3', true),
  ('76a8b4cc-8670-4760-94aa-0553f8541996', 2208, 'CAÑETE', 124, 'LIMA', 'CAÑETE', '140401', 'CÑT', true),
  ('3d196276-7a67-4a6d-a851-a2b46a87cd4b', 2097, 'HUAURA', 124, 'LIMA', 'HUAURA', '140501', 'HUAU', true),
  ('6d1cfa1e-8f53-46cc-9efe-e6c468844323', 2269, 'HUAROCHIRI', 124, 'LIMA', 'HUAROCHIRI', '140613', 'HCHR', true),
  ('a3b4c1a6-0607-4c08-8a94-5892f064d333', 2102, 'TAMBOPATA', 124, 'MADRE DE DIOS', 'TAMBOPATA', '160101', 'TBPT', true),
  ('dabdd24d-059c-436d-a657-dedb8be56c26', 2077, 'HUANUCO', 124, 'HUANUCO', 'HUANUCO', '090101', 'HNCO', true),
  ('07f45648-e7eb-4a6b-9500-64bb6bdaca67', 2194, 'HUAMALIES', 124, 'HUANUCO', 'HUAMALIES', '090401', 'HMLS', true),
  ('93759b84-6f89-412d-ad39-8892ad30def6', 2195, 'LEONCIO PRADO', 124, 'HUANUCO', 'LEONCIO PRADO', '090601', 'LPRA', true),
  ('dc5cbf0a-b3ba-4c2e-9f7a-2872100f8125', 2110, 'TACNA', 124, 'TACNA', 'TACNA', '220101', 'TACN', true),
  ('a0dd5ff6-2edd-479f-a895-d4747e88af9b', 2111, 'TUMBES', 124, 'TUMBES', 'TUMBES', '230101', 'TUMB', true),
  ('6fc76628-5ba1-4c7d-8c30-65113a4aa5cb', 2073, 'CALLAO', 124, 'CALLAO', 'CALLAO', '240102', 'CALL', true),
  ('c34a000d-31e3-4663-92d3-2f626f1fa708', 2112, 'CORONEL PORTILLO', 124, 'UCAYALI', 'CORONEL PORTILLO', '250101', 'CPOR', true),
  ('65817576-0af4-43f0-8a0d-4443a245e045', 2268, 'CAYLLOMA', 124, 'AREQUIPA', 'CAYLLOMA', '040201', 'CAYL', true),
  ('65817576-0af4-43f0-8a0d-4443a245e046', 0, 'JURADO NACIONAL DE ELECCIONES', 0, 'JURADO NACIONAL DE ELECCIONES', 'JNE', NULL, 'JNE', true)
on conflict (id) do nothing;
