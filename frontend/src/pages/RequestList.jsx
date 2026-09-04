import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// Clean inline SVG Icons (no external icon dependencies needed)
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const PhoneIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 10.6 19.79 19.79 0 0 1 1.08 2 2 2 0 0 1 3.06 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 15l.92 1.92Z" />
  </svg>
);

const MapPinIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const UsersIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const AlertTriangleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const BoatIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M2 17l1.5-6h17L22 17H2z" /><path d="M12 3v8" /><path d="M12 3L6 8h6" />
  </svg>
);

const HeartHandIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const ListIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const MapIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ShieldCheckIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
  </svg>
);

// Initial curated disaster field data reflecting actual flood hotspots
const SEED_REQUESTS = [
  {
    id: 'REQ-LK-9041',
    token: 'RAT-04B-2026',
    title: 'Ratnapura (Kalu Ganga Sector 04-B)',
    district: 'Ratnapura',
    ds_division: 'Ratnapura',
    shelter_name: 'Bodhiraja Cultural Hall (Highland Camp)',
    landmark: 'Near Clock Tower Junction / Kalu Ganga Bridge',
    contact_name: 'Ruwan Perera',
    contact_phone: '+94 77 123 4567',
    quantity_or_people: 180,
    supplies_needed: '500L bottled water, Infant milk powder, Ready-to-eat rations, First aid kits, Candles',
    urgency: 'SOS Urgent',
    category: 'Water & Rations',
    dispatch_tag: 'Navy Unit 04 Assigned',
    status: 'Pending',
    notes: 'Family of 5 trapped on upper floor, floodwater reaching 4ft. Needs clean drinking water and infant milk urgently.',
    created_at: '2026-09-04T09:30:00Z',
    relative_time: '12 mins ago',
    initials: 'RP'
  },
  {
    id: 'REQ-LK-9042',
    token: 'KAL-02K-2026',
    title: 'Bulathsinhala, Kalutara',
    district: 'Kalutara',
    ds_division: 'Bulathsinhala',
    shelter_name: 'Bulathsinhala Central College',
    landmark: 'Opposite Sub Post Office',
    contact_name: 'Malini Kulatunga',
    contact_phone: '+94 71 987 6543',
    quantity_or_people: 72,
    supplies_needed: 'Diabetic insulin cold storage, 10x 5L water containers, Adult blankets, Dhal, Rice packs',
    urgency: 'High Alert',
    category: 'Medical Evac',
    dispatch_tag: 'Sector K-2 Priority',
    status: 'Pending',
    notes: 'Diabetic insulin emergency for 72yo elder + 10x 5L water bottles needed before dusk road blockage.',
    created_at: '2026-09-04T09:10:00Z',
    relative_time: '35 mins ago',
    initials: 'MK'
  },
  {
    id: 'REQ-LK-9043',
    token: 'GAL-08N-2026',
    title: 'Galle, Nilwala Basin',
    district: 'Galle',
    ds_division: 'Baddegama',
    shelter_name: 'Baddegama Temple Relief Center',
    landmark: 'Nilwala River Embankment Rd',
    contact_name: 'Rev. Wimalasiri Thero',
    contact_phone: '+94 76 555 4321',
    quantity_or_people: 120,
    supplies_needed: 'Dry rations pack for 8 families in temporary shelter. Rice, lentils, dhal, biscuits, mosquito coils, matches.',
    urgency: 'Moderate',
    category: 'Water & Rations',
    dispatch_tag: 'Community Relief Camp',
    status: 'Pending',
    notes: 'Dry rations pack for 8 families in temporary school shelter. Rice, lentils, dhal, biscuits, candles.',
    created_at: '2026-09-04T08:00:00Z',
    relative_time: '1 hr ago',
    initials: 'RW'
  },
  {
    id: 'REQ-LK-9044',
    token: 'ELA-01S-2026',
    title: 'Elapatha Sector 01',
    district: 'Ratnapura',
    ds_division: 'Elapatha',
    shelter_name: 'Elapatha Rural Hospital Compound',
    landmark: 'Bridge approach road',
    contact_name: 'Sunil Dharmadasa',
    contact_phone: '+94 72 333 4455',
    quantity_or_people: 4,
    supplies_needed: 'Evacuated 4 stranded elders by volunteer boat crew. Safely delivered to highland district hospital.',
    urgency: 'High Alert',
    category: 'Rescue Boats',
    dispatch_tag: 'Sabaragamuwa Volunteer Flotilla',
    status: 'Done',
    notes: 'Evacuated 4 stranded elders by volunteer boat crew. Safely delivered to highland district hospital.',
    created_at: '2026-09-04T07:15:00Z',
    relative_time: '2 hrs ago',
    initials: 'SD'
  },
  {
    id: 'REQ-LK-9045',
    token: 'COL-07K-2026',
    title: 'Kolonnawa, Kelani River Basin',
    district: 'Colombo',
    ds_division: 'Kolonnawa',
    shelter_name: 'Kolonnawa Terrence Silva Vidyalaya',
    landmark: 'Near Meethotamulla main access',
    contact_name: 'Kithsiri Bandara',
    contact_phone: '+94 75 444 8899',
    quantity_or_people: 95,
    supplies_needed: 'Cooked meal packets (Lunch/Dinner), Baby formula, Diapers, Sanitary packs, Clean water tankers',
    urgency: 'SOS Urgent',
    category: 'Water & Rations',
    dispatch_tag: 'Army Disaster Response #12',
    status: 'Done',
    notes: 'Ground floor submerged. 95 persons in school 2nd floor. Meals delivered by Tri-forces relief truck.',
    created_at: '2026-09-04T06:30:00Z',
    relative_time: '3 hrs ago',
    initials: 'KB'
  }
];

export default function RequestList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'DONE'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterChip, setActiveFilterChip] = useState('All');
  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'map'
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState(null);
  const [selectedRequestForPledge, setSelectedRequestForPledge] = useState(null);
  const [pledgeMessage, setPledgeMessage] = useState('');
  const [pledgeType, setPledgeType] = useState('Supplies');
  const [pledgeSuccess, setPledgeSuccess] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    let list = [...SEED_REQUESTS];

    // Load user submissions from localStorage
    try {
      const stored = localStorage.getItem('local_items');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const localRequests = parsed
            .filter(item => (item.type || '').toUpperCase() === 'REQUEST' || (item.type || '').toLowerCase() === 'request')
            .map(item => ({
              id: item.id || `LOCAL-${Date.now()}`,
              token: item.token || `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
              title: item.title || item.name || `${item.district || 'Western'} Aid Station`,
              district: item.district || 'Colombo',
              ds_division: item.ds_division || item.divisional_secretariat || item.district || '',
              shelter_name: item.shelter_name || item.camp_name || 'Field Rescue Station',
              landmark: item.landmark || item.location || '',
              contact_name: item.contact_name || item.name || 'Field Coordinator',
              contact_phone: item.contact_phone || item.contact || '+94 77 000 0000',
              quantity_or_people: item.quantity_or_people || item.affected_count || item.people_count || 10,
              supplies_needed: item.supplies_needed || item.description || item.specific_supplies || 'Emergency drinking water and food rations',
              urgency: item.urgency === 'Critical' || item.urgency === 'SOS' || item.urgency === 'Urgent' ? 'SOS Urgent' : (item.urgency || 'High Alert'),
              category: item.category || 'Water & Rations',
              dispatch_tag: item.dispatch_tag || 'Pending Dispatch',
              status: item.status === 'Fulfilled' || item.status === 'Done' ? 'Done' : 'Pending',
              notes: item.notes || item.description || '',
              created_at: item.created_at || new Date().toISOString(),
              relative_time: 'Just now',
              initials: (item.name || item.contact_name || 'AR').slice(0, 2).toUpperCase()
            }));
          list = [...localRequests, ...list];
        }
      }
    } catch (err) {
      console.warn('Error parsing local requests:', err);
    }

    // Try fetching from Supabase items table
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .or('type.eq.request,type.eq.REQUEST')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const remoteRequests = data.map(item => ({
            id: item.id,
            token: item.token || `DB-${item.id}`,
            title: item.title || item.name || `${item.district || 'Disaster Sector'} Aid Point`,
            district: item.district || 'Colombo',
            ds_division: item.ds_division || item.divisional_secretariat || '',
            shelter_name: item.shelter_name || item.camp_name || 'Field Station',
            landmark: item.landmark || item.location || '',
            contact_name: item.contact_name || item.name || 'Coordinator',
            contact_phone: item.contact_phone || item.contact || '',
            quantity_or_people: item.quantity_or_people || item.people_count || 20,
            supplies_needed: item.supplies_needed || item.description || 'Emergency Relief Supplies',
            urgency: item.urgency === 'Critical' || item.urgency === 'SOS' ? 'SOS Urgent' : (item.urgency || 'High Alert'),
            category: item.category || 'Water & Rations',
            dispatch_tag: item.dispatch_tag || 'Triaged Item',
            status: item.status === 'Fulfilled' || item.status === 'Done' ? 'Done' : 'Pending',
            notes: item.notes || item.description || '',
            created_at: item.created_at || new Date().toISOString(),
            relative_time: 'Active record',
            initials: (item.name || item.contact_name || 'LK').slice(0, 2).toUpperCase()
          }));
          list = [...remoteRequests, ...list];
        }
      }
    } catch (e) {
      console.warn('Supabase fetch bypassed, using local & seed records.');
    }

    // Deduplicate items
    const seen = new Set();
    const unique = list.filter(item => {
      const key = item.id || `${item.title}-${item.contact_phone}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setRequests(unique);
    setLoading(false);
  };

  // Status toggle handler (Pending <-> Done)
  const handleToggleStatus = (id) => {
    setRequests(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Done' ? 'Pending' : 'Done';
        return {
          ...item,
          status: nextStatus,
          dispatch_tag: nextStatus === 'Done' ? 'Mission Fulfilled' : 'Awaiting Triage'
        };
      }
      return item;
    }));
  };

  // Support pledge submission
  const handlePledgeSubmit = (e) => {
    e.preventDefault();
    setPledgeSuccess(true);
    setTimeout(() => {
      setPledgeSuccess(false);
      setSelectedRequestForPledge(null);
      setPledgeMessage('');
    }, 1800);
  };

  // Dynamic status counts (Only Pending and Done — Transit removed per requirement)
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const doneCount = requests.filter(r => r.status === 'Done').length;

  // Filter chips definitions
  const filterChips = [
    { label: 'All', value: 'All' },
    { label: 'SOS Urgent', value: 'SOS Urgent', isUrgent: true },
    { label: 'Water & Rations', value: 'Water & Rations' },
    { label: 'Medical Evac', value: 'Medical Evac' },
    { label: 'Rescue Boats', value: 'Rescue Boats' },
    { label: 'Ratnapura', value: 'Ratnapura', isLocation: true },
    { label: 'Kalutara', value: 'Kalutara', isLocation: true },
    { label: 'Galle', value: 'Galle', isLocation: true },
    { label: 'Matara', value: 'Matara', isLocation: true },
    { label: 'Colombo', value: 'Colombo', isLocation: true },
    { label: 'Gampaha', value: 'Gampaha', isLocation: true },
  ];

  // Filtering logic
  const filteredRequests = requests.filter(item => {
    // 1. Tab filter (Pending vs Done vs All)
    if (activeTab === 'PENDING' && item.status !== 'Pending') return false;
    if (activeTab === 'DONE' && item.status !== 'Done') return false;

    // 2. Filter chip logic
    if (activeFilterChip !== 'All') {
      if (activeFilterChip === 'SOS Urgent') {
        if (item.urgency !== 'SOS Urgent' && item.urgency !== 'Critical') return false;
      } else if (['Ratnapura', 'Kalutara', 'Galle', 'Matara', 'Colombo', 'Gampaha'].includes(activeFilterChip)) {
        if (item.district?.toLowerCase() !== activeFilterChip.toLowerCase()) return false;
      } else {
        // Category or supply match
        const matchesCat = item.category?.toLowerCase() === activeFilterChip.toLowerCase();
        const matchesSupplies = item.supplies_needed?.toLowerCase().includes(activeFilterChip.toLowerCase());
        if (!matchesCat && !matchesSupplies) return false;
      }
    }

    // 3. Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        item.title?.toLowerCase().includes(q) ||
        item.district?.toLowerCase().includes(q) ||
        item.ds_division?.toLowerCase().includes(q) ||
        item.shelter_name?.toLowerCase().includes(q) ||
        item.landmark?.toLowerCase().includes(q) ||
        item.contact_name?.toLowerCase().includes(q) ||
        item.supplies_needed?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.token?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans pb-28">
      {/* Top Header & Ticker Bar */}
      <div className="bg-white border-b border-[#e6e8ea] shadow-xs sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#af101a] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#af101a]"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-[#191c1e] tracking-tight">
                    Live Aid Dispatch & Requests
                  </h1>
                  <span className="text-[11px] font-bold bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#af101a]"></span>
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-[#5b403d]">
                  Real-time flood & emergency dispatch queue across vulnerable Sri Lankan river basins
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                to="/request-aid"
                className="px-4 py-2 bg-[#af101a] hover:bg-[#8f0d15] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <AlertTriangleIcon className="w-4 h-4" />
                <span>+ Request Aid</span>
              </Link>
            </div>
          </div>

          {/* Real-time Status Ticker Metrics (2 cards: Pending & Done — Transit card removed) */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`text-left p-3.5 rounded-xl border transition-all ${
                activeTab === 'PENDING'
                  ? 'bg-red-50/80 border-[#af101a] ring-2 ring-[#af101a]/20 shadow-sm'
                  : 'bg-[#f2f4f6] hover:bg-[#e6e8ea] border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#af101a] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangleIcon className="w-3.5 h-3.5 text-[#af101a]" />
                  Pending Aids
                </span>
                <span className="text-[11px] font-semibold text-[#5b403d] bg-white px-2 py-0.5 rounded-full border border-red-100">
                  Triage queue
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#191c1e]">{pendingCount}</span>
                <span className="text-xs text-[#5b403d]">active emergency requests</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('DONE')}
              className={`text-left p-3.5 rounded-xl border transition-all ${
                activeTab === 'DONE'
                  ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm'
                  : 'bg-[#f2f4f6] hover:bg-[#e6e8ea] border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-700" />
                  Done Aids
                </span>
                <span className="text-[11px] font-semibold text-[#5b403d] bg-white px-2 py-0.5 rounded-full border border-emerald-100">
                  Fulfilled aid
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#191c1e]">{doneCount}</span>
                <span className="text-xs text-[#5b403d]">successfully resolved</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Search, View Toggle, & Status Tabs Bar */}
        <div className="flex flex-col gap-3">
          {/* Status Tabs (All, Pending, Done) */}
          <div className="flex items-center border-b border-[#e0e3e5] pb-1 gap-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-[#191c1e] text-white shadow-xs'
                  : 'text-[#5b403d] hover:text-[#191c1e] hover:bg-[#e6e8ea]'
              }`}
            >
              All Requests ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'PENDING'
                  ? 'bg-[#af101a] text-white shadow-xs'
                  : 'text-[#5b403d] hover:text-[#af101a] hover:bg-red-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Pending Aids ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('DONE')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'DONE'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#5b403d] hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Done Aids ({doneCount})
            </button>
          </div>

          {/* Search Input and Feed / Map Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-3 text-[#5b403d]/70 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by sector, district, needs, requester, or incident token..."
                className="w-full h-11 pl-10 pr-4 bg-white text-[#191c1e] text-sm rounded-xl border border-[#e0e3e5] focus:outline-none focus:border-[#af101a] focus:ring-1 focus:ring-[#af101a] shadow-xs placeholder:text-[#5b403d]/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-xs text-[#5b403d] hover:text-black font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Feed / Map Toggler */}
            <div className="flex bg-[#e6e8ea] p-1 rounded-xl shadow-inner shrink-0">
              <button
                onClick={() => setViewMode('feed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'feed'
                    ? 'bg-white text-[#191c1e] shadow-xs'
                    : 'text-[#5b403d] hover:text-[#191c1e]'
                }`}
              >
                <ListIcon className="w-4 h-4" />
                <span>Feed</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-[#191c1e] shadow-xs'
                    : 'text-[#5b403d] hover:text-[#191c1e]'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Map</span>
              </button>
            </div>
          </div>

          {/* Filter Chips Horizontal Scroller */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
            {filterChips.map((chip) => {
              const isActive = activeFilterChip === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => setActiveFilterChip(chip.value)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#af101a] text-white shadow-xs'
                      : chip.isUrgent
                      ? 'bg-[#ffdad6] text-[#93000a] hover:bg-[#ffb3ac]'
                      : chip.isLocation
                      ? 'bg-[#e0e3e5] text-[#191c1e] hover:bg-[#d8dadc]'
                      : 'bg-[#e6e8ea] text-[#191c1e] hover:bg-[#d8dadc]'
                  }`}
                >
                  {chip.isUrgent && <AlertTriangleIcon className="w-3.5 h-3.5" />}
                  {chip.isLocation && <MapPinIcon className="w-3.5 h-3.5" />}
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Content: Feed vs Map */}
        {viewMode === 'map' ? (
          /* Interactive Map View */
          <div className="mt-4 flex flex-col gap-4">
            <div className="relative w-full h-96 sm:h-[480px] rounded-2xl overflow-hidden shadow-md border border-[#e0e3e5] bg-slate-900">
              {/* Map Background Simulation */}
              <div 
                className="w-full h-full bg-cover bg-center opacity-70"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAbige_90Ke6466bVy1xTD9Mc9QbPMNzeunWCnLlDHSDJ2JIJ-bt4arsL7CH8I33HtvSv4BBGtVNaeqcQyIxUzIKVXsbcBQlNRfcHk1diJ2R5yiu46c47zHCU2bk8x4_pLb6VLgHltm7U9drWmhJXDkGuYxkV88Saq1ChB8JCop4eXbkoH2sv7e2tWamuGuwT4ia084AiFDbCwQRVgoqYDU6YbxsNoqryjIjG0HCf3n5hNbRXMec4kO')`
                }}
              />

              {/* Hotspot Floating Markers */}
              <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2">
                <div className="group relative flex flex-col items-center cursor-pointer">
                  <span className="relative flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-[#af101a] border-2 border-white items-center justify-center text-[9px] text-white font-black">!</span>
                  </span>
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md shadow-md text-[11px] font-bold text-[#191c1e] mt-1 whitespace-nowrap">
                    Ratnapura Sector 04-B (Critical)
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 left-2/5 -translate-x-1/2 -translate-y-1/2">
                <div className="group relative flex flex-col items-center cursor-pointer">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-600 border-2 border-white"></span>
                  </span>
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md shadow-md text-[11px] font-bold text-[#191c1e] mt-1 whitespace-nowrap">
                    Kalutara (Sector K-2)
                  </div>
                </div>
              </div>

              <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2">
                <div className="group relative flex flex-col items-center cursor-pointer">
                  <span className="relative flex h-4 w-4">
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white"></span>
                  </span>
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md shadow-md text-[11px] font-bold text-[#191c1e] mt-1 whitespace-nowrap">
                    Kelani River (Kolonnawa)
                  </div>
                </div>
              </div>

              {/* Map Info Overlays */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-sm border border-white/40 flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#af101a] animate-ping"></span>
                <div>
                  <span className="text-xs font-bold text-[#191c1e] block">4 Active River Basin Hotspots</span>
                  <span className="text-[11px] text-[#5b403d]">Kelani, Kalu, Gin & Nilwala Basins</span>
                </div>
              </div>

              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-sm border border-white/40 text-xs font-bold text-[#af101a] flex items-center gap-1.5">
                <MapPinIcon className="w-4 h-4 text-[#af101a]" />
                <span>Sector 04-B Maximum Priority</span>
              </div>
            </div>

            {/* Quick Sector Quick-Select */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Kalu Ganga Basin', sub: 'Ratnapura & Kalutara', alert: 'Severe Flood Alert', count: '14 Requests' },
                { name: 'Kelani River Basin', sub: 'Kolonnawa & Biyagama', alert: 'Spill Level Warning', count: '8 Requests' },
                { name: 'Gin Ganga Basin', sub: 'Neluwa & Baddegama', alert: 'Rising Water Level', count: '6 Requests' },
                { name: 'Nilwala Basin', sub: 'Matara & Akuressa', alert: 'Moderate Alert', count: '5 Requests' }
              ].map((sector, i) => (
                <div key={i} className="bg-white p-3.5 rounded-xl border border-[#e0e3e5] shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#191c1e]">{sector.name}</h3>
                    <p className="text-[11px] text-[#5b403d]">{sector.sub}</p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#f2f4f6] flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#af101a] uppercase">{sector.alert}</span>
                    <span className="text-[11px] font-semibold text-[#191c1e]">{sector.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Feed Request Stream */
          <div className="mt-4 flex flex-col gap-4">
            {loading ? (
              <div className="py-16 text-center text-[#5b403d] bg-white rounded-2xl border border-[#e0e3e5]">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-[#af101a] border-t-transparent rounded-full mb-3"></div>
                <p className="text-sm font-semibold">Loading live emergency dispatch queue...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-16 px-4 text-center bg-white rounded-2xl border border-[#e0e3e5] shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#f2f4f6] text-[#5b403d] mx-auto flex items-center justify-center mb-3">
                  <SearchIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#191c1e]">No matching aid requests</h3>
                <p className="text-xs text-[#5b403d] max-w-sm mx-auto mt-1">
                  Try adjusting your search keywords, switching between Pending/Done tabs, or selecting the "All" filter chip.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveFilterChip('All');
                    setActiveTab('ALL');
                  }}
                  className="mt-4 px-4 py-2 bg-[#f2f4f6] hover:bg-[#e6e8ea] text-[#191c1e] text-xs font-bold rounded-xl transition"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRequests.map((item) => {
                  const isDone = item.status === 'Done';
                  const isUrgent = item.urgency === 'SOS Urgent' || item.urgency === 'Critical';

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs border transition-all flex flex-col justify-between relative overflow-hidden ${
                        isDone
                          ? 'border-emerald-200 bg-emerald-50/10'
                          : isUrgent
                          ? 'border-red-200 hover:shadow-md'
                          : 'border-[#e0e3e5] hover:shadow-md'
                      }`}
                    >
                      {/* Left color bar indicating severity */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          isDone
                            ? 'bg-emerald-600'
                            : isUrgent
                            ? 'bg-[#af101a]'
                            : item.urgency === 'High Alert'
                            ? 'bg-[#a83900]'
                            : 'bg-[#4f576d]'
                        }`}
                      />

                      <div className="pl-1.5">
                        {/* Badges & Timestamp */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isDone ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-700" />
                                Fulfilled Aid
                              </span>
                            ) : (
                              <span
                                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                                  isUrgent
                                    ? 'bg-[#ffdad6] text-[#930010]'
                                    : item.urgency === 'High Alert'
                                    ? 'bg-[#ffdbcf] text-[#802a00]'
                                    : 'bg-[#e6e8ea] text-[#191c1e]'
                                }`}
                              >
                                {isUrgent && <span className="h-1.5 w-1.5 rounded-full bg-[#af101a] animate-pulse"></span>}
                                {item.urgency}
                              </span>
                            )}

                            <span className="text-[11px] text-[#5b403d] flex items-center gap-1 bg-[#f2f4f6] px-2 py-0.5 rounded-md font-medium">
                              <ClockIcon className="w-3 h-3 text-[#5b403d]" />
                              {item.relative_time}
                            </span>
                          </div>

                          <span className="text-[11px] font-bold bg-[#e6e8ea] text-[#191c1e] px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                            {item.category === 'Rescue Boats' ? (
                              <BoatIcon className="w-3.5 h-3.5 text-[#af101a]" />
                            ) : (
                              <MapPinIcon className="w-3.5 h-3.5 text-[#a83900]" />
                            )}
                            {item.dispatch_tag}
                          </span>
                        </div>

                        {/* Title / Incident Location */}
                        <h2 className="text-base sm:text-lg font-bold text-[#191c1e] mt-2">
                          {item.title}
                        </h2>

                        {/* Shelter & Affected Count Meta */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-[#5b403d] mt-1">
                          <span className="font-semibold text-[#191c1e] flex items-center gap-1">
                            <MapPinIcon className="w-3.5 h-3.5 text-[#af101a]" />
                            {item.district} {item.ds_division ? `• ${item.ds_division}` : ''}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-[#a83900] bg-orange-50 px-2 py-0.5 rounded">
                            <UsersIcon className="w-3.5 h-3.5 text-[#a83900]" />
                            {item.quantity_or_people} people affected
                          </span>
                        </div>

                        {/* Description & Supplies Needed */}
                        <div className="mt-3 bg-[#f2f4f6] rounded-xl p-3 border border-[#e6e8ea] text-xs text-[#191c1e] leading-relaxed">
                          <p className="font-bold text-[#5b403d] mb-1">Required Supplies / Action:</p>
                          <p className="font-medium text-[#191c1e]">{item.supplies_needed}</p>
                          {item.notes && item.notes !== item.supplies_needed && (
                            <p className="mt-1.5 pt-1.5 border-t border-[#e0e3e5] text-[11px] text-[#5b403d] italic">
                              "{item.notes}"
                            </p>
                          )}
                        </div>

                        {/* Requester Contact & Status Row */}
                        <div className="mt-3 bg-white border border-[#e6e8ea] p-2.5 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#ffdad6] text-[#930010] flex items-center justify-center font-bold text-xs shrink-0">
                              {item.initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-[#191c1e] truncate">
                                {item.contact_name}
                              </span>
                              <span className="text-[11px] text-[#5b403d] truncate">
                                {item.contact_phone}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={`tel:${item.contact_phone}`}
                              className="w-8 h-8 rounded-lg bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#af101a] flex items-center justify-center transition shadow-xs"
                              title="Call Requester"
                            >
                              <PhoneIcon className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleToggleStatus(item.id)}
                              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1 ${
                                isDone
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-white text-[#5b403d] border-[#e0e3e5] hover:bg-[#f2f4f6]'
                              }`}
                              title={isDone ? "Reopen as Pending" : "Mark request as Done"}
                            >
                              {isDone ? (
                                <>
                                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Done</span>
                                </>
                              ) : (
                                <>
                                  <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Mark Done</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pl-1.5 grid grid-cols-2 gap-2 mt-3.5 pt-2 border-t border-[#f2f4f6]">
                        <button
                          onClick={() => setSelectedRequestForPledge(item)}
                          className="h-10 bg-[#af101a] hover:bg-[#8f0d15] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition"
                        >
                          <HeartHandIcon className="w-4 h-4" />
                          <span>Support / Pledge</span>
                        </button>

                        <button
                          onClick={() => setSelectedRequestForDetail(item)}
                          className="h-10 bg-[#e6e8ea] hover:bg-[#d8dadc] text-[#191c1e] text-xs font-bold rounded-xl flex items-center justify-center gap-1 active:scale-95 transition"
                        >
                          <span>Triage Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick Floating Dispatch Prompt */}
        <div className="mt-8 bg-white rounded-2xl p-4 border border-[#e0e3e5] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffdad6] text-[#af101a] flex items-center justify-center shrink-0">
              <AlertTriangleIcon className="w-5 h-5 text-[#af101a]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#191c1e]">Are you in need of emergency flood rescue or rations?</h4>
              <p className="text-xs text-[#5b403d]">Submit your coordinates directly to the Disaster Management Centre & Volunteer Flotillas.</p>
            </div>
          </div>
          <Link
            to="/request-aid"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#af101a] hover:bg-[#8f0d15] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs text-center shrink-0 transition active:scale-95"
          >
            Submit Aid Request
          </Link>
        </div>

        {/* Verified Relief Sri Lanka Hotlines Footer Section */}
        <div className="mt-10 mb-6 p-6 rounded-2xl bg-white border border-[#e6e8ea] text-center flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#5b403d] uppercase tracking-wider">
            <ShieldCheckIcon className="w-4 h-4 text-[#af101a]" />
            <span>Government Disaster Relief Hotlines</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <a
              href="tel:117"
              className="px-3.5 py-2 bg-[#ffdad6] hover:bg-[#ffb3ac] text-[#93000a] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              <span>DMC Hotline: 117</span>
            </a>
            <a
              href="tel:1990"
              className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              <span>Suwaseriya Ambulance: 1990</span>
            </a>
            <a
              href="tel:119"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              <span>Police Emergency: 119</span>
            </a>
            <a
              href="tel:1919"
              className="px-3.5 py-2 bg-[#e6e8ea] hover:bg-[#d8dadc] text-[#191c1e] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              <span>Gov Info: 1919</span>
            </a>
          </div>

          <p className="text-xs text-[#5b403d] max-w-md mt-1">
            Verified field updates coordinated with Sri Lanka Disaster Management Centre (DMC), Tri-Forces & Volunteer Rescue Units.
          </p>
        </div>
      </div>

      {/* Triage Details Modal */}
      {selectedRequestForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-[#e0e3e5] relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedRequestForDetail(null)}
              className="absolute top-4 right-4 text-[#5b403d] hover:text-black p-1 rounded-lg hover:bg-[#f2f4f6]"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-[#ffdad6] text-[#93000a] px-2.5 py-0.5 rounded-full uppercase">
                {selectedRequestForDetail.urgency}
              </span>
              <span className="text-xs font-semibold text-[#5b403d]">
                Token: {selectedRequestForDetail.token}
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#191c1e] mb-1">
              {selectedRequestForDetail.title}
            </h3>
            <p className="text-xs text-[#5b403d] mb-4">
              Registered in {selectedRequestForDetail.district} District
            </p>

            <div className="space-y-3 text-xs">
              <div className="bg-[#f2f4f6] p-3 rounded-xl border border-[#e6e8ea]">
                <span className="font-bold text-[#5b403d] block mb-1">Location Details</span>
                <p><strong className="text-[#191c1e]">District:</strong> {selectedRequestForDetail.district}</p>
                {selectedRequestForDetail.ds_division && (
                  <p><strong className="text-[#191c1e]">Divisional Secretariat:</strong> {selectedRequestForDetail.ds_division}</p>
                )}
                {selectedRequestForDetail.shelter_name && (
                  <p><strong className="text-[#191c1e]">Shelter / Camp:</strong> {selectedRequestForDetail.shelter_name}</p>
                )}
                {selectedRequestForDetail.landmark && (
                  <p><strong className="text-[#191c1e]">Landmark / Street:</strong> {selectedRequestForDetail.landmark}</p>
                )}
              </div>

              <div className="bg-[#f2f4f6] p-3 rounded-xl border border-[#e6e8ea]">
                <span className="font-bold text-[#5b403d] block mb-1">Relief Demands</span>
                <p><strong className="text-[#191c1e]">Affected Individuals:</strong> {selectedRequestForDetail.quantity_or_people} people</p>
                <p className="mt-1"><strong className="text-[#191c1e]">Required Supplies:</strong> {selectedRequestForDetail.supplies_needed}</p>
                {selectedRequestForDetail.notes && (
                  <p className="mt-1"><strong className="text-[#191c1e]">Additional Notes:</strong> {selectedRequestForDetail.notes}</p>
                )}
              </div>

              <div className="bg-[#f2f4f6] p-3 rounded-xl border border-[#e6e8ea] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#5b403d] block">Contact Coordinator</span>
                  <p className="font-bold text-[#191c1e]">{selectedRequestForDetail.contact_name}</p>
                  <p className="text-[#5b403d]">{selectedRequestForDetail.contact_phone}</p>
                </div>
                <a
                  href={`tel:${selectedRequestForDetail.contact_phone}`}
                  className="px-3.5 py-2 bg-[#af101a] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <PhoneIcon className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </a>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setSelectedRequestForPledge(selectedRequestForDetail);
                  setSelectedRequestForDetail(null);
                }}
                className="flex-1 py-2.5 bg-[#af101a] hover:bg-[#8f0d15] text-white text-xs font-bold rounded-xl transition"
              >
                Pledge Support For This Camp
              </button>
              <button
                onClick={() => setSelectedRequestForDetail(null)}
                className="px-4 py-2.5 bg-[#e6e8ea] hover:bg-[#d8dadc] text-[#191c1e] text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support / Pledge Modal */}
      {selectedRequestForPledge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#e0e3e5] relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedRequestForPledge(null)}
              className="absolute top-4 right-4 text-[#5b403d] hover:text-black p-1 rounded-lg hover:bg-[#f2f4f6]"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#191c1e] flex items-center gap-2 mb-1">
              <HeartHandIcon className="w-5 h-5 text-[#af101a]" />
              Pledge Support / Relief Dispatch
            </h3>
            <p className="text-xs text-[#5b403d] mb-4">
              Committing aid for: <span className="font-bold text-[#191c1e]">{selectedRequestForPledge.title}</span>
            </p>

            {pledgeSuccess ? (
              <div className="py-8 text-center bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircleIcon className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-900">Pledge Registered!</h4>
                <p className="text-xs text-emerald-700 mt-1">Thank you. The field coordinator has been notified.</p>
              </div>
            ) : (
              <form onSubmit={handlePledgeSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">Support Type</label>
                  <select
                    value={pledgeType}
                    onChange={(e) => setPledgeType(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#e0e3e5] focus:outline-none focus:border-[#af101a]"
                  >
                    <option value="Supplies">Dry Rations / Supplies</option>
                    <option value="Water">Clean Drinking Water</option>
                    <option value="Medical">Medical / First Aid</option>
                    <option value="Boat">Rescue Boat / Transport Unit</option>
                    <option value="Volunteer">Volunteer Manpower</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">Your Name / Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sabaragamuwa Volunteer Youth Club"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#e0e3e5] focus:outline-none focus:border-[#af101a]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">Contact Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#e0e3e5] focus:outline-none focus:border-[#af101a]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#191c1e] block mb-1">Details of items or capacity pledged</label>
                  <textarea
                    rows={3}
                    value={pledgeMessage}
                    onChange={(e) => setPledgeMessage(e.target.value)}
                    placeholder="e.g. 50 packs of rice & dhal ready for dispatch from Colombo warehouse..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-[#e0e3e5] focus:outline-none focus:border-[#af101a]"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#af101a] hover:bg-[#8f0d15] text-white font-bold rounded-xl transition active:scale-95 shadow-xs"
                  >
                    Confirm & Submit Pledge
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRequestForPledge(null)}
                    className="px-4 py-2.5 bg-[#e6e8ea] hover:bg-[#d8dadc] text-[#191c1e] font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}