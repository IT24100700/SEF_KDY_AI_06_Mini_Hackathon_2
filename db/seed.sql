-- ─────────────────────────────────────────────────────────────
--  HelpSriLanka — mock data
--
--  Run AFTER db/schema.sql, in the Supabase SQL Editor.
--  Safe to re-run: it clears the three tables first, so the row counts
--  below stay stable no matter how many times you run it.
--
--  Vocabulary note: urgency / category / status values are copied from
--  the frontend's own constants so the filter chips and status badges
--  actually match these rows —
--    urgency   → 'SOS Urgent' | 'High Alert' | 'Moderate'   (RequestList.jsx)
--    category  → 'Water & Rations' | 'Medical Evac' | 'Rescue Boats'
--    status    → 'Pending' | 'Dispatched' | 'Delivered'      (DonationList.jsx)
--
--  These records are deliberately distinct from the five SEED_REQUESTS
--  hardcoded in RequestList.jsx, so you can tell a live database row
--  from the offline fallback at a glance.
-- ─────────────────────────────────────────────────────────────

begin;

truncate table public.items;
truncate table public.feedback;
truncate table public.donations;


-- ═════════════════════════════════════════════════════════════
--  items — aid requests
-- ═════════════════════════════════════════════════════════════
-- Home.jsx counts these for the "pending requests" and "districts
-- covered" stat tiles, and RequestList.jsx renders them as cards.

insert into public.items
  (type, name, contact, location, category, description,
   token, title, district, ds_division, shelter_name, landmark,
   contact_name, contact_phone, quantity_or_people, supplies_needed,
   urgency, dispatch_tag, status, notes, created_at)
values
  ('request', 'Nimal Jayasuriya', '+94 77 401 8823',
   'Kegalle — Deraniyagala Bridge', 'Rescue Boats',
   '[SOS] Shelter: Deraniyagala Maha Vidyalaya. Affected: 40 adults, 22 children, 9 elders.',
   'KEG-11D-2026', 'Deraniyagala (Seethawaka Ganga Sector)', 'Kegalle', 'Deraniyagala',
   'Deraniyagala Maha Vidyalaya', 'Below the old iron bridge, Deraniyagala town',
   'Nimal Jayasuriya', '+94 77 401 8823', 71,
   'Two inflatable rescue boats, 200L drinking water, dry rations for 15 families, rope and torches',
   'SOS Urgent', 'Air Force Heli Recon Requested', 'Pending',
   'Access road washed out at the 4th mile post. Boats are the only way in until the water drops.',
   now() - interval '18 minutes'),

  ('request', 'Fathima Rizwan', '+94 76 220 5514',
   'Colombo — Kolonnawa, Gothatuwa New Town', 'Medical Evac',
   '[HIGH] Shelter: Gothatuwa Community Centre. Affected: 55 adults, 31 children, 14 elders.',
   'COL-07G-2026', 'Kolonnawa Low-Lying Sector', 'Colombo', 'Kolonnawa',
   'Gothatuwa Community Centre', 'Behind the Gothatuwa weekly fair grounds',
   'Fathima Rizwan', '+94 76 220 5514', 100,
   'Dialysis transport for 2 patients, asthma inhalers, insulin cold chain, ORS sachets, chlorine tablets',
   'High Alert', 'Suwaseriya Ambulance On Standby', 'Pending',
   'Two dialysis patients have missed a session. Ground floor is under 3ft of water.',
   now() - interval '1 hour 25 minutes'),

  ('request', 'Sarath Wickramasinghe', '+94 71 668 9032',
   'Puttalam — Anamaduwa, Mee Oya bank', 'Water & Rations',
   '[MODERATE] Shelter: Anamaduwa Sri Sumana Temple. Affected: 68 adults, 40 children, 18 elders.',
   'PUT-03A-2026', 'Anamaduwa (Mee Oya Basin)', 'Puttalam', 'Anamaduwa',
   'Sri Sumana Temple Relief Camp', 'Anamaduwa - Puttalam road, 2km past the tank bund',
   'Sarath Wickramasinghe', '+94 71 668 9032', 126,
   'Rice, red dhal, canned fish, milk powder for 26 families, mosquito repellent, sanitary care packs',
   'Moderate', 'Divisional Secretariat Verified', 'Pending',
   'Camp is stable and dry. Rations will run out in roughly two days.',
   now() - interval '3 hours 40 minutes'),

  ('request', 'Chandrika Bandaranayake', '+94 78 115 7744',
   'Matara — Malimbada, Nilwala right bank', 'Water & Rations',
   '[HIGH] Shelter: Malimbada Junior School. Affected: 33 adults, 27 children, 11 elders.',
   'MAT-05M-2026', 'Malimbada (Nilwala Right Bank)', 'Matara', 'Malimbada',
   'Malimbada Junior School', 'Opposite the Malimbada co-op store',
   'Chandrika Bandaranayake', '+94 78 115 7744', 71,
   'Infant cereal and milk powder for 9 infants, bottled water, biscuits, diapers, candles',
   'High Alert', 'Sector M-5 Priority', 'Pending',
   'Nine infants under two years in the camp. Infant formula is the pressing need.',
   now() - interval '5 hours 10 minutes'),

  ('request', 'Upul Gunaratne', '+94 70 993 2210',
   'Gampaha — Ja-Ela, Dandugama', 'Water & Rations',
   '[MODERATE] Shelter: Dandugama Fisheries Hall. Affected: 21 adults, 12 children, 6 elders.',
   'GAM-09J-2026', 'Ja-Ela (Dandugama Estuary)', 'Gampaha', 'Ja-Ela',
   'Dandugama Fisheries Hall', 'Adjacent to the Dandugama boatyard',
   'Upul Gunaratne', '+94 70 993 2210', 39,
   'Drinking water gallons, tea and sugar, biscuits, first aid kit, antiseptic',
   'Moderate', 'Resolved — Rations Delivered', 'Done',
   'Truck from the Ja-Ela relief hub delivered a full consignment. Camp winding down.',
   now() - interval '1 day 2 hours');


-- ═════════════════════════════════════════════════════════════
--  items — donation pledges
-- ═════════════════════════════════════════════════════════════
-- Home.jsx counts type='donation' rows for the "pledges" stat tile.
-- (The richer physical-consignment flow lives in public.donations.)

insert into public.items
  (type, name, contact, location, category, description, status, created_at)
values
  ('donation', 'Lanka Milk Foods PLC', '+94 11 244 6600',
   'Colombo — Biyagama distribution centre', 'Water & Rations',
   '600 packs of milk powder (400g) and 300 cartons of bottled water, palletised and ready for pickup.',
   'Pending', now() - interval '2 hours 15 minutes'),

  ('donation', 'Rotaract Club of Moratuwa', '+94 77 812 3390',
   'Colombo — Moratuwa University premises', 'Water & Rations',
   '120 dry ration packs assembled by volunteers. Can deliver to any camp inside Western Province.',
   'Pending', now() - interval '6 hours'),

  ('donation', 'Dr. Ayesha Perera', '+94 71 550 1188',
   'Galle — Karapitiya Teaching Hospital', 'Medical Evac',
   '40 first aid kits, 200 ORS sachets and a volunteer medical team of four for weekend camp duty.',
   'Pending', now() - interval '9 hours 30 minutes'),

  ('donation', 'Ceylon Fishermen''s Cooperative', '+94 76 304 7781',
   'Kalutara — Beruwala harbour', 'Rescue Boats',
   'Six outboard fishing boats with crews, available for rescue duty across Kalutara and Ratnapura.',
   'Pending', now() - interval '1 day 4 hours');


-- ═════════════════════════════════════════════════════════════
--  feedback
-- ═════════════════════════════════════════════════════════════
-- Rendered newest-first on /feedback. role must be 'requester' or
-- 'donor'; rating is 1-5; message must be 10-1000 characters.

insert into public.feedback (name, role, location, rating, message, created_at)
values
  ('Ruwan Perera', 'requester', 'Ratnapura', 5,
   'Filed a request at 9pm and a navy boat reached our lane before sunrise. The token number made it easy to confirm we were on the dispatch list.',
   now() - interval '40 minutes'),

  ('Dilini Senanayake', 'donor', 'Colombo', 4,
   'Dropping off a consignment was straightforward and the status changed to Dispatched the same evening. A pickup slot picker would save donors a trip.',
   now() - interval '3 hours 5 minutes'),

  ('Mohamed Nazeer', 'requester', 'Puttalam', 3,
   'The camp was registered quickly but our rations arrived a day later than the board indicated. Worth showing an estimated delivery window on each card.',
   now() - interval '8 hours 45 minutes'),

  ('Anoma Ratnayake', 'donor', 'Gampaha', 5,
   'As a small business we could pledge exactly what we had in stock instead of guessing at a cash figure. The item catalogue is the best part of this platform.',
   now() - interval '1 day 6 hours'),

  ('Rev. Wimalasiri Thero', 'requester', 'Galle', 4,
   'Our temple shelter has been listed since the first night and volunteers keep arriving. Please add a way to mark a camp as closed once families return home.',
   now() - interval '2 days 1 hour');


-- ═════════════════════════════════════════════════════════════
--  donations — physical consignments
-- ═════════════════════════════════════════════════════════════
-- Served by GET /api/donations and rendered by DonationList.jsx.
-- itemId values match the CATALOGUE ids in DonateForm.jsx, so the
-- friendly labels (ITEM_LABELS) resolve instead of falling back to
-- the raw slug.

insert into public.donations
  (donor_name, donor_phone, donor_email, donor_anonymous,
   donor_drop_off, donor_notes, items, additional_items, total_units,
   status, created_at)
values
  ('Dilini Senanayake', '+94 77 302 4416', 'dilini.senanayake@example.lk', false,
   'Colombo — Sugathadasa Indoor Stadium collection point',
   'Can drop off any weekday evening after 6pm.',
   '[{"itemId":"bottled-water","quantity":12},{"itemId":"rice-10kg","quantity":8},{"itemId":"red-dhal","quantity":15},{"itemId":"canned-fish","quantity":24}]'::jsonb,
   'Two cartons of assorted childrens clothing, freshly laundered.',
   59, 'Pending', now() - interval '55 minutes'),

  ('Anoma Ratnayake', '+94 71 884 2290', 'anoma.r@example.lk', false,
   'Gampaha — Divisional Secretariat store',
   'Loading help available if a truck can reach the store bay.',
   '[{"itemId":"milk-powder","quantity":40},{"itemId":"infant-cereal","quantity":25},{"itemId":"diapers","quantity":18},{"itemId":"biscuits","quantity":30}]'::jsonb,
   null,
   113, 'Dispatched', now() - interval '7 hours 20 minutes'),

  ('Anonymous', '+94 76 771 0093', 'wellwisher.lk@example.com', true,
   'Kalutara — Beruwala Urban Council yard',
   'Prefer not to be named on the public board.',
   '[{"itemId":"chlorine-tabs","quantity":50},{"itemId":"ors","quantity":60},{"itemId":"paracetamol","quantity":100},{"itemId":"dettol","quantity":20}]'::jsonb,
   'Includes a printed dosage guide in Sinhala and Tamil.',
   230, 'Dispatched', now() - interval '1 day 3 hours'),

  ('Kumar Sivalingam', '+94 78 226 5507', 'k.sivalingam@example.lk', false,
   'Matara — Nupe Junction relief hub',
   'Consignment already handed to the hub coordinator.',
   '[{"itemId":"gallon-water","quantity":45},{"itemId":"tea-sugar","quantity":20},{"itemId":"first-aid-kit","quantity":10},{"itemId":"mosquito-rep","quantity":35}]'::jsonb,
   null,
   110, 'Delivered', now() - interval '2 days 5 hours'),

  ('Hikkaduwa Traders Association', '+94 70 445 1123', 'hta.relief@example.lk', false,
   'Galle — Hikkaduwa town hall',
   'Pooled contribution from 14 member shops.',
   '[{"itemId":"bottled-water","quantity":80},{"itemId":"sanitary-care","quantity":45},{"itemId":"biscuits","quantity":60}]'::jsonb,
   'Happy to repeat this every fortnight while the camps stay open.',
   185, 'Delivered', now() - interval '3 days 8 hours');

commit;


-- ─── Verify ──────────────────────────────────────────────────
-- select 'items' as table, count(*) from public.items
-- union all select 'feedback', count(*) from public.feedback
-- union all select 'donations', count(*) from public.donations;
