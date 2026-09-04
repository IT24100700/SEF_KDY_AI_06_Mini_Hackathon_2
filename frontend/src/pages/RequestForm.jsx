import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Ratnapura', 'Kandy', 
  'Galle', 'Matara', 'Kegalle', 'Kurunegala', 'Puttalam'
];

export default function RequestForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    district: '',
    contact_name: '',
    contact_phone: '',
    people_affected: '',
    supplies_needed: '',
    urgency: 'High',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Shelter or Camp name is required.';
    }
    if (!formData.district) {
      newErrors.district = 'Please select an affected district.';
    }
    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'Contact coordinator name is required.';
    }

    // Sri Lankan mobile number validation (07x or +947x)
    const slPhoneRegex = /^(?:0|94|\+94)?7[0-9]{8}$/;
    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = 'Contact phone number is required.';
    } else if (!slPhoneRegex.test(formData.contact_phone.replace(/\s+/g, ''))) {
      newErrors.contact_phone = 'Enter a valid Sri Lankan mobile number (e.g., 0771234567).';
    }

    if (!formData.people_affected || Number(formData.people_affected) <= 0) {
      newErrors.people_affected = 'Please enter a valid number of affected people (> 0).';
    }

    if (!formData.supplies_needed.trim()) {
      newErrors.supplies_needed = 'Specify the urgent items needed (e.g., drinking water, panadol, blankets).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      type: 'REQUEST',
      title: formData.title.trim(),
      district: formData.district,
      contact_name: formData.contact_name.trim(),
      contact_phone: formData.contact_phone.trim(),
      category: 'Emergency Relief',
      quantity_or_people: parseInt(formData.people_affected, 10),
      supplies_needed: formData.supplies_needed.trim(),
      urgency: formData.urgency,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    try {
      if (supabase) {
        await supabase.from('items').insert([payload]);
      }
      // Backup to local storage for offline resilience
      const existing = JSON.parse(localStorage.getItem('local_items') || '[]');
      localStorage.setItem('local_items', JSON.stringify([payload, ...existing]));

      setSuccess(true);
      setTimeout(() => {
        navigate('/requests');
      }, 1500);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold">
            SOS
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Submit Emergency Aid Request</h1>
            <p className="text-sm text-slate-500">Post critical supply shortages for flood relief camps</p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            Request registered successfully! Redirecting to live board...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Camp / Shelter Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Kelaniya Raja Maha Vihara Relief Camp"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition ${
                errors.title ? 'border-red-500 bg-red-50/30' : 'border-slate-300 focus:border-blue-500'
              }`}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                District *
              </label>
              <select
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition bg-white ${
                  errors.district ? 'border-red-500 bg-red-50/30' : 'border-slate-300 focus:border-blue-500'
                }`}
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              >
                <option value="">Select District</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.district && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.district}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Urgency Level
              </label>
              <select
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              >
                <option value="Critical">🔴 Critical (immediate risk)</option>
                <option value="High">🟠 High (within 12 hours)</option>
                <option value="Moderate">🔵 Moderate (within 24 hours)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Coordinator Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rev. Saranankara"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition ${
                  errors.contact_name ? 'border-red-500 bg-red-50/30' : 'border-slate-300 focus:border-blue-500'
                }`}
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
              {errors.contact_name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.contact_name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Mobile (+94 / 07x) *
              </label>
              <input
                type="text"
                placeholder="0771234567"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition ${
                  errors.contact_phone ? 'border-red-500 bg-red-50/30' : 'border-slate-300 focus:border-blue-500'
                }`}
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
              {errors.contact_phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.contact_phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Estimated Displaced People in Camp *
            </label>
            <input
              type="number"
              placeholder="e.g. 150"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition ${
                errors.people_affected ? 'border-red-500 bg-red-50/30' : 'border-slate-300 focus:border-blue-500'
              }`}
              value={formData.people_affected}
              onChange={(e) => setFormData({ ...formData, people_affected: e.target.value })}
            />
            {errors.people_affected && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.people_affected}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Supplies Urgently Needed *
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 500L Clean drinking water bottles, Paracetamol, 80 packets of dry biscuits, baby diapers"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition ${
                errors.supplies_needed ? 'border-red-500 bg-red-50/30' : 'border-slate-300 focus:border-blue-500'
              }`}
              value={formData.supplies_needed}
              onChange={(e) => setFormData({ ...formData, supplies_needed: e.target.value })}
            />
            {errors.supplies_needed && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.supplies_needed}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Submitting...' : (
              <>
                <Send className="w-4 h-4" />
                Publish Aid Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}