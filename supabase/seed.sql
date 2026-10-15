-- seed.sql — initial editable content. Run AFTER the migrations.
-- Everything marked is_sample = true is demonstration content, NOT verified company data.
-- Edit, unpublish or delete it in /admin.

insert into public.site_settings (id, tagline, footer_description, business_hours)
values (1, 'We do all kind of welding and fabrication works',
  'Bait Al Majed Metal Works is an Ajman-based steel fabrication and metal works company providing welding, fabrication and customized metal solutions.',
  null)
on conflict (id) do nothing;

insert into public.categories (name, slug, description, sort_order) values
  ('Wheelbarrows',       'wheelbarrows',       'Steel wheelbarrows for construction and site work.', 1),
  ('Gas Trolleys',       'gas-trolleys',       'Trolleys for handling gas cylinders safely.', 2),
  ('Pallet Trolleys',    'pallet-trolleys',    'Platform and pallet trolleys for material movement.', 3),
  ('Lifting Cages',      'lifting-cages',      'Steel cages for lifting materials on site.', 4),
  ('Concrete Buckets',   'concrete-buckets',   'Buckets for handling and placing concrete.', 5),
  ('Waste Bins',         'waste-bins',         'Heavy-duty steel bins for waste and scrap.', 6),
  ('Custom Fabrication', 'custom-fabrication', 'Made-to-order steel products built to your requirement.', 7)
on conflict (slug) do nothing;

insert into public.products (category_id, name, slug, short_description, description, specifications, applications, is_featured, is_published, is_sample, sort_order)
select c.id, p.name, p.slug, p.short, p.descr, '[]'::jsonb, p.apps, true, true, true, p.ord
from (values
  ('wheelbarrows','Steel Wheelbarrow','steel-wheelbarrow','Sample listing: fabricated steel wheelbarrow for site use.','Sample product shown to demonstrate the catalogue. Replace with verified details, dimensions and photos from the admin panel.', array['Construction sites','Landscaping'], 1),
  ('gas-trolleys','Gas Cylinder Trolley','gas-cylinder-trolley','Sample listing: trolley for moving gas cylinders.','Sample product shown to demonstrate the catalogue. Replace with verified details from the admin panel.', array['Workshops','Industrial sites'], 2),
  ('pallet-trolleys','Pallet Trolley','pallet-trolley','Sample listing: platform trolley for materials.','Sample product shown to demonstrate the catalogue. Replace with verified details from the admin panel.', array['Warehouses','Workshops'], 3),
  ('lifting-cages','Lifting Cage','lifting-cage','Sample listing: steel cage for lifting materials.','Sample product shown to demonstrate the catalogue. Replace with verified details from the admin panel.', array['Construction sites'], 4),
  ('concrete-buckets','Concrete Bucket','concrete-bucket','Sample listing: bucket for handling concrete.','Sample product shown to demonstrate the catalogue. Replace with verified details from the admin panel.', array['Construction sites'], 5),
  ('waste-bins','Steel Waste Bin','steel-waste-bin','Sample listing: heavy-duty steel bin.','Sample product shown to demonstrate the catalogue. Replace with verified details from the admin panel.', array['Industrial sites','Construction sites'], 6)
) as p(cat, name, slug, short, descr, apps, ord)
join public.categories c on c.slug = p.cat
on conflict (slug) do nothing;

insert into public.services (title, slug, short_description, description, icon, applications, show_on_home, is_published, is_sample, sort_order) values
  ('Material Handling Equipment','material-handling-equipment','Trolleys, carts and handling equipment fabricated in steel.','Sample description. Edit this service from the admin panel with your verified capabilities.','handling', array['Warehouses','Workshops'], true, true, true, 1),
  ('Construction Equipment','construction-equipment','Steel equipment for construction sites.','Sample description. Edit this service from the admin panel with your verified capabilities.','construction', array['Construction sites'], true, true, true, 2),
  ('Steel Fabrication','steel-fabrication','Cutting, welding and fabrication of steel components.','Sample description. Edit this service from the admin panel with your verified capabilities.','fabrication', array['Industrial','Commercial'], true, true, true, 3),
  ('Industrial Safety Equipment','industrial-safety-equipment','Steel equipment that supports site safety.','Sample description. Edit this service from the admin panel with your verified capabilities.','safety', array['Industrial sites'], true, true, true, 4),
  ('Customized Steel Products','customized-steel-products','Made-to-order steel products to your requirement.','Sample description. Edit this service from the admin panel with your verified capabilities.','custom', array['Industrial','Commercial'], true, true, true, 5),
  ('Structural and Architectural Metal Works','structural-architectural-metal-works','Structural and architectural metal works.','Sample description. Edit this service from the admin panel with your verified capabilities.','structural', array['Commercial','Infrastructure'], true, true, true, 6)
on conflict (slug) do nothing;

insert into public.homepage_sections (key, eyebrow, heading, body, primary_cta_label, primary_cta_href, secondary_cta_label, secondary_cta_href, items, sort_order) values
  ('hero','Steel fabrication & metal works','Reliable Steel Solutions for Construction & Industrial Applications',
   'Bait Al Majed Metal Works is an Ajman-based company providing welding, fabrication and customized metal solutions for construction, industrial and commercial projects.',
   'Enquire on WhatsApp','whatsapp','Call Now','tel',
   '[{"title":"Strong Fabrication"},{"title":"Custom Solutions"},{"title":"Built for Industry"}]', 1),
  ('featured_products','Our products','Industrial Steel Products','Steel products for material handling, construction and industrial applications.','View all products','/products',null,null,'[]',2),
  ('services','Our services','Steel Fabrication Solutions','Welding, fabrication and manufacturing solutions for industrial, commercial and construction applications.','All services','/services',null,null,'[]',3),
  ('about','About us','Bait Al Majed Metal Works','A steel fabrication and metal works company based in Ajman, United Arab Emirates, handling all kinds of welding and fabrication work.','Learn more about us','/about',null,null,'[]',4),
  ('trust','Why choose us',null,null,null,null,null,null,
   '[{"title":"Wide Range","text":"of steel products"},{"title":"Custom Work","text":"made to your requirement"},{"title":"Quality Focused","text":"fabrication"},{"title":"Ajman Based","text":"United Arab Emirates"}]', 5),
  ('contact_cta','Get in touch','Need a Custom Steel Solution?','Contact us for product enquiries, custom fabrication requirements or bulk orders.','WhatsApp Now','whatsapp','Contact us','/contact','[]', 6)
on conflict (key) do nothing;

insert into public.pages (slug, title, meta_description, content) values
  ('about','About Bait Al Majed Metal Works',
   'Steel fabrication and metal works company in Ajman, UAE.',
   '{"overview":"Bait Al Majed Metal Works is a steel fabrication and metal works company based in Ajman, United Arab Emirates. We handle all kinds of welding and fabrication work.",
     "mission":"","vision":"",
     "capabilities":["Welding and fabrication","Custom steel products made to requirement"],
     "quality":"",
     "industries":["Construction","Industrial","Commercial"],
     "strengths":["Custom fabrication to your requirement","Based in Ajman, UAE"],
     "founded":"","team_size":"","certifications":[]}'::jsonb)
on conflict (slug) do nothing;
