import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';
import { supabase } from '../../utils/supabase';
import { parseEmployeesCSV } from '../../utils/csvUtils';
import {
  ArrowLeft,
  Building2,
  User,
  MapPin,
  Plus,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  Upload,
  Users,
  X,
  FileSpreadsheet,
  Check,
  Clock,
  CreditCard,
  Globe
} from 'lucide-react';

// Country configurations
const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' }
];

// Romanian counties (județe)
const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani',
  'Brăila', 'Brașov', 'București', 'Buzău', 'Călărași', 'Caraș-Severin',
  'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu',
  'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș',
  'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Sălaj', 'Satu Mare',
  'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vâlcea', 'Vaslui', 'Vrancea'
];

// Venue types with their default feedback questions
const VENUE_TYPES = [
  { value: 'pub', label: 'Pub' },
  { value: 'gastropub', label: 'Gastropub' },
  { value: 'bar', label: 'Bar' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'fine_dining', label: 'Fine Dining' },
  { value: 'competitive_socialising', label: 'Competitive Socialising' }
];

// Default questions based on venue type
const DEFAULT_QUESTIONS = {
  pub: [
    { question: 'How was the quality of your drinks?', type: 'rating' },
    { question: 'How was the atmosphere?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'Was the pub clean and well-maintained?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  gastropub: [
    { question: 'How was the quality of your food?', type: 'rating' },
    { question: 'How was the quality of your drinks?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'How was the atmosphere?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  bar: [
    { question: 'How was the quality of your drinks?', type: 'rating' },
    { question: 'How was the atmosphere and music?', type: 'rating' },
    { question: 'How was the service from our bar staff?', type: 'rating' },
    { question: 'How was the cleanliness?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  cafe: [
    { question: 'How was the quality of your food and drinks?', type: 'rating' },
    { question: 'How was the service?', type: 'rating' },
    { question: 'How was the atmosphere?', type: 'rating' },
    { question: 'Was the cafe clean and comfortable?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  hotel: [
    { question: 'How was your check-in experience?', type: 'rating' },
    { question: 'How was the cleanliness of your room?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'How were the hotel facilities?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  restaurant: [
    { question: 'How was the quality of your food?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'How was the atmosphere?', type: 'rating' },
    { question: 'How was the value for money?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  fine_dining: [
    { question: 'How was the quality and presentation of your food?', type: 'rating' },
    { question: 'How was the wine and drinks selection?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'How was the overall dining experience?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ],
  competitive_socialising: [
    { question: 'How was your activity experience?', type: 'rating' },
    { question: 'How was the quality of food and drinks?', type: 'rating' },
    { question: 'How was the service from our staff?', type: 'rating' },
    { question: 'Was the venue clean and well-maintained?', type: 'rating' },
    { question: 'Any additional feedback?', type: 'text' }
  ]
};

const emptyVenue = (inheritCountry = 'GB') => ({
  name: '',
  type: '',
  country: inheritCountry, // Inherit from account by default
  addressLine1: '',
  addressLine2: '',
  city: '',
  county: '', // For Romanian addresses (județ)
  postcode: '',
  questions: [],
  staff: [],
  staffErrors: [],
  _expanded: true
});

const AdminCreateAccount = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const fileInputRefs = useRef({});
  const [formData, setFormData] = useState({
    // Account info
    companyName: '',
    billingEmail: '',
    accountPhone: '',
    country: 'GB', // Account-level country (default for venues)
    // Master user info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Trial settings
    startTrial: true,
    trialDays: 14,
    // Venues
    venues: [emptyVenue('GB')]
  });
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // When account country changes, update all venues that haven't been explicitly set
      if (name === 'country') {
        updated.venues = prev.venues.map(v => ({
          ...v,
          country: value,
          // Clear county field if switching away from Romania
          county: value === 'RO' ? v.county : ''
        }));
      }

      return updated;
    });
  };

  const setVenueField = (index, name, value) =>
    setFormData(prev => {
      const venues = [...prev.venues];
      venues[index] = { ...venues[index], [name]: value };

      // If venue type changes, pre-populate questions
      if (name === 'type' && value) {
        venues[index].questions = DEFAULT_QUESTIONS[value] || [];
      }

      // If venue country changes, clear county if not Romania
      if (name === 'country' && value !== 'RO') {
        venues[index].county = '';
      }

      return { ...prev, venues };
    });

  const toggleVenueExpanded = (index) =>
    setFormData(prev => {
      const venues = [...prev.venues];
      venues[index] = { ...venues[index], _expanded: !venues[index]._expanded };
      return { ...prev, venues };
    });

  const addVenue = () =>
    setFormData(prev => ({ ...prev, venues: [...prev.venues, emptyVenue(prev.country)] }));

  const removeVenue = (index) =>
    setFormData(prev => {
      const venues = prev.venues.slice();
      venues.splice(index, 1);
      return { ...prev, venues: venues.length ? venues : [emptyVenue()] };
    });

  const handleStaffCSVUpload = async (index, file) => {
    if (!file) return;

    try {
      const { employees, errors } = await parseEmployeesCSV(file);

      setFormData(prev => {
        const venues = [...prev.venues];
        venues[index] = {
          ...venues[index],
          staff: employees,
          staffErrors: errors
        };
        return { ...prev, venues };
      });

      if (errors.length > 0) {
        toast.error(`CSV parsed with ${errors.length} warning(s)`);
      } else if (employees.length > 0) {
        toast.success(`${employees.length} staff member(s) loaded`);
      }
    } catch (error) {
      toast.error(`Failed to parse CSV: ${error.message}`);
    }

    // Reset file input
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = '';
    }
  };

  const clearStaffData = (index) => {
    setFormData(prev => {
      const venues = [...prev.venues];
      venues[index] = {
        ...venues[index],
        staff: [],
        staffErrors: []
      };
      return { ...prev, venues };
    });
  };

  const validate = () => {
    const e = {};

    // Account validation
    if (!formData.companyName?.trim()) e.companyName = 'Company name is required';

    // Master user validation
    if (!formData.firstName?.trim()) e.firstName = 'First name is required';
    if (!formData.lastName?.trim()) e.lastName = 'Last name is required';
    if (!formData.email?.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) e.email = 'Enter a valid email';

    // Venue validation
    formData.venues.forEach((v, i) => {
      if (!v.name?.trim()) e[`venue_${i}_name`] = 'Venue name is required';
      if (!v.type) e[`venue_${i}_type`] = 'Venue type is required';
      if (!v.postcode?.trim()) e[`venue_${i}_postcode`] = v.country === 'RO' ? 'Cod poștal is required' : 'Postcode is required';
      if (!v.city?.trim()) e[`venue_${i}_city`] = v.country === 'RO' ? 'Oraș is required' : 'City is required';
      if (!v.addressLine1?.trim()) e[`venue_${i}_addressLine1`] = v.country === 'RO' ? 'Strada is required' : 'Address is required';
      // Require county for Romanian addresses
      if (v.country === 'RO' && !v.county?.trim()) e[`venue_${i}_county`] = 'Județ is required';
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      const first = document.querySelector('[data-error="true"]');
      if (first?.scrollIntoView) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const apiUrl = window.location.hostname === 'localhost'
        ? 'https://my.getchatters.com/api/admin/create-account'
        : '/api/admin/create-account';

      // Prepare venues payload
      const venuesPayload = formData.venues.map(venue => ({
        name: venue.name.trim(),
        type: venue.type,
        country: venue.country,
        address: {
          line1: venue.addressLine1.trim(),
          line2: venue.addressLine2?.trim() || '',
          city: venue.city.trim(),
          county: venue.county?.trim() || '',
          postcode: venue.postcode.trim().toUpperCase(),
          country: venue.country
        },
        questions: venue.questions,
        staff: venue.staff || []
      }));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          companyName: formData.companyName.trim(),
          phone: formData.phone?.trim() || null,
          accountPhone: formData.accountPhone?.trim() || null,
          billingEmail: formData.billingEmail?.trim()?.toLowerCase() || formData.email.trim().toLowerCase(),
          country: formData.country,
          startTrial: formData.startTrial,
          trialDays: formData.trialDays,
          venues: venuesPayload
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      toast.success('Account created! Invitation email sent to master user.');
      navigate('/admin');

    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // Calculate totals for summary
  const totalStaff = formData.venues.reduce((sum, v) => sum + (v.staff?.length || 0), 0);
  const completedVenues = formData.venues.filter(v => v.name && v.type && v.addressLine1 && v.city && v.postcode).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>Create Account - Admin Center - Chatters</title>
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <h1 className="text-lg font-semibold text-gray-900">
                Create New Account
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={creating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column - Account & User Info */}
            <div className="lg:col-span-1 space-y-6">

              {/* Account Information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Account</h2>
                      <p className="text-xs text-gray-500">Company details</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setField('companyName', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
                      data-error={!!errors.companyName}
                      placeholder="The King's Arms Ltd"
                    />
                    {errors.companyName && <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Billing Email
                    </label>
                    <input
                      type="email"
                      value={formData.billingEmail}
                      onChange={(e) => setField('billingEmail', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="accounts@company.com"
                    />
                    <p className="text-xs text-gray-400 mt-1">Defaults to master user email</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Company Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.accountPhone}
                      onChange={(e) => setField('accountPhone', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+44 20 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setField('country', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Default country for venues</p>
                  </div>
                </div>
              </div>

              {/* Master User */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Master User</h2>
                      <p className="text-xs text-gray-500">Account owner</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">
                        An invitation email will be sent to set up their password.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setField('firstName', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                        data-error={!!errors.firstName}
                        placeholder="John"
                      />
                      {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setField('lastName', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                        data-error={!!errors.lastName}
                        placeholder="Smith"
                      />
                      {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setField('email', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      data-error={!!errors.email}
                      placeholder="john@company.com"
                    />
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+44 7700 900000"
                    />
                  </div>
                </div>
              </div>

              {/* Trial & Billing */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Trial & Billing</h2>
                      <p className="text-xs text-gray-500">Subscription settings</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Start with trial</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.startTrial}
                      onChange={(e) => setField('startTrial', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>

                  {formData.startTrial && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Trial Duration
                      </label>
                      <select
                        value={formData.trialDays}
                        onChange={(e) => setField('trialDays', parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Card - Sticky */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white sticky top-24">
                <h3 className="text-sm font-semibold mb-4">Account Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Company</span>
                    <span className="text-sm font-medium">{formData.companyName || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Master User</span>
                    <span className="text-sm font-medium">
                      {formData.firstName || formData.lastName
                        ? `${formData.firstName} ${formData.lastName}`.trim()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Venues</span>
                    <span className="text-sm font-medium">{completedVenues} / {formData.venues.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Staff Members</span>
                    <span className="text-sm font-medium">{totalStaff}</span>
                  </div>
                  {formData.startTrial && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Trial Period</span>
                      <span className="text-sm font-medium text-green-400">{formData.trialDays} days</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Venues */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Venues</h2>
                      <p className="text-xs text-gray-500">{formData.venues.length} venue{formData.venues.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addVenue}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Venue
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {formData.venues.map((venue, index) => (
                    <div key={index} className="bg-white">
                      {/* Venue header */}
                      <div
                        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleVenueExpanded(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            venue.name && venue.type ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Building2 className={`w-4 h-4 ${
                              venue.name && venue.type ? 'text-green-600' : 'text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">
                              {venue.name?.trim() || `Venue ${index + 1}`}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {venue.type && (
                                <span className="text-xs text-gray-500">
                                  {VENUE_TYPES.find(t => t.value === venue.type)?.label}
                                </span>
                              )}
                              {venue.staff.length > 0 && (
                                <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                  {venue.staff.length} staff
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {formData.venues.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeVenue(index); }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {venue._expanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Venue body */}
                      {venue._expanded && (
                        <div className="px-5 pb-5 space-y-5">
                          {/* Basic Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Venue Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={venue.name}
                                onChange={(e) => setVenueField(index, 'name', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_name`] ? 'border-red-500' : 'border-gray-300'}`}
                                data-error={!!errors[`venue_${index}_name`]}
                                placeholder="The King's Arms"
                              />
                              {errors[`venue_${index}_name`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_name`]}</p>}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Venue Type <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={venue.type}
                                onChange={(e) => setVenueField(index, 'type', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_type`] ? 'border-red-500' : 'border-gray-300'}`}
                                data-error={!!errors[`venue_${index}_type`]}
                              >
                                <option value="">Select type...</option>
                                {VENUE_TYPES.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                              {errors[`venue_${index}_type`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_type`]}</p>}
                            </div>
                          </div>

                          {/* Country & Address */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Country selector */}
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Country <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={venue.country}
                                onChange={(e) => setVenueField(index, 'country', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {COUNTRIES.map(c => (
                                  <option key={c.code} value={c.code}>
                                    {c.flag} {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {venue.country === 'RO' ? 'Strada (Street)' : 'Address'} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={venue.addressLine1}
                                onChange={(e) => setVenueField(index, 'addressLine1', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_addressLine1`] ? 'border-red-500' : 'border-gray-300'}`}
                                data-error={!!errors[`venue_${index}_addressLine1`]}
                                placeholder={venue.country === 'RO' ? 'Strada Victoriei 123' : '123 High Street'}
                              />
                              {errors[`venue_${index}_addressLine1`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_addressLine1`]}</p>}
                            </div>

                            <div className="md:col-span-2">
                              <input
                                type="text"
                                value={venue.addressLine2}
                                onChange={(e) => setVenueField(index, 'addressLine2', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={venue.country === 'RO' ? 'Bloc, Scara, Apartament (optional)' : 'Address line 2 (optional)'}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {venue.country === 'RO' ? 'Oraș (City)' : 'City'} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={venue.city}
                                onChange={(e) => setVenueField(index, 'city', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_city`] ? 'border-red-500' : 'border-gray-300'}`}
                                data-error={!!errors[`venue_${index}_city`]}
                                placeholder={venue.country === 'RO' ? 'București' : 'London'}
                              />
                              {errors[`venue_${index}_city`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_city`]}</p>}
                            </div>

                            {/* County/Județ - shown for Romania */}
                            {venue.country === 'RO' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                  Județ (County) <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={venue.county}
                                  onChange={(e) => setVenueField(index, 'county', e.target.value)}
                                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_county`] ? 'border-red-500' : 'border-gray-300'}`}
                                  data-error={!!errors[`venue_${index}_county`]}
                                >
                                  <option value="">Select județ...</option>
                                  {ROMANIAN_COUNTIES.map(county => (
                                    <option key={county} value={county}>{county}</option>
                                  ))}
                                </select>
                                {errors[`venue_${index}_county`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_county`]}</p>}
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {venue.country === 'RO' ? 'Cod Poștal' : 'Postcode'} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={venue.postcode}
                                onChange={(e) => setVenueField(index, 'postcode', venue.country === 'GB' ? e.target.value.toUpperCase() : e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_postcode`] ? 'border-red-500' : 'border-gray-300'}`}
                                data-error={!!errors[`venue_${index}_postcode`]}
                                placeholder={venue.country === 'RO' ? '010101' : 'SW1A 1AA'}
                              />
                              {errors[`venue_${index}_postcode`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_postcode`]}</p>}
                            </div>
                          </div>

                          {/* Pre-populated questions preview */}
                          {venue.questions.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Feedback Questions</h4>
                              <div className="space-y-2">
                                {venue.questions.map((q, qIndex) => (
                                  <div key={qIndex} className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-xs flex items-center justify-center font-medium text-gray-500">
                                      {qIndex + 1}
                                    </span>
                                    <span className="flex-1">{q.question}</span>
                                    <span className="text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded">{q.type}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-3">
                                Can be customised later in the dashboard
                              </p>
                            </div>
                          )}

                          {/* Staff CSV Upload */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              Staff List
                              <span className="text-xs text-gray-400 font-normal">(optional)</span>
                            </h4>

                            {venue.staff.length === 0 ? (
                              <div className="border border-dashed border-gray-200 rounded-lg p-5 text-center hover:border-gray-300 transition-colors">
                                <FileSpreadsheet className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 mb-1">
                                  Upload a CSV file with staff members
                                </p>
                                <p className="text-xs text-gray-400 mb-3">
                                  First Name, Last Name, Email (required) + Phone, Role, Location
                                </p>
                                <input
                                  type="file"
                                  accept=".csv"
                                  ref={(el) => fileInputRefs.current[index] = el}
                                  onChange={(e) => handleStaffCSVUpload(index, e.target.files[0])}
                                  className="hidden"
                                  id={`staff-csv-${index}`}
                                />
                                <label
                                  htmlFor={`staff-csv-${index}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                                >
                                  <Upload className="w-4 h-4" />
                                  Choose File
                                </label>
                              </div>
                            ) : (
                              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                                      <Check className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-green-800">
                                        {venue.staff.length} staff member{venue.staff.length !== 1 ? 's' : ''} loaded
                                      </p>
                                      {venue.staffErrors.length > 0 && (
                                        <p className="text-xs text-amber-600">
                                          {venue.staffErrors.length} skipped
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => clearStaffData(index)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Staff preview */}
                                <div className="bg-white rounded-lg border border-green-100 overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-gray-600 font-medium">Name</th>
                                        <th className="px-3 py-2 text-left text-gray-600 font-medium">Email</th>
                                        <th className="px-3 py-2 text-left text-gray-600 font-medium">Role</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {venue.staff.slice(0, 3).map((staff, sIndex) => (
                                        <tr key={sIndex}>
                                          <td className="px-3 py-2 text-gray-900">
                                            {staff.first_name} {staff.last_name}
                                          </td>
                                          <td className="px-3 py-2 text-gray-500">{staff.email}</td>
                                          <td className="px-3 py-2 text-gray-500">{staff.role || 'employee'}</td>
                                        </tr>
                                      ))}
                                      {venue.staff.length > 3 && (
                                        <tr>
                                          <td colSpan={3} className="px-3 py-2 text-center text-gray-400">
                                            +{venue.staff.length - 3} more
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateAccount;
