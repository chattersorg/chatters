import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet';
import { supabase } from '../../utils/supabase';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Plus,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

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

const emptyVenue = () => ({
  name: '',
  type: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postcode: '',
  questions: [],
  _expanded: true
});

const AdminCreateAccount = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    // Account info
    companyName: '',
    billingEmail: '',
    accountPhone: '',
    // Master user info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Trial settings
    startTrial: true,
    trialDays: 14,
    // Venues
    venues: [emptyVenue()]
  });
  const [errors, setErrors] = useState({});

  const setField = (name, value) =>
    setFormData(prev => ({ ...prev, [name]: value }));

  const setVenueField = (index, name, value) =>
    setFormData(prev => {
      const venues = [...prev.venues];
      venues[index] = { ...venues[index], [name]: value };

      // If venue type changes, pre-populate questions
      if (name === 'type' && value) {
        venues[index].questions = DEFAULT_QUESTIONS[value] || [];
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
    setFormData(prev => ({ ...prev, venues: [...prev.venues, emptyVenue()] }));

  const removeVenue = (index) =>
    setFormData(prev => {
      const venues = prev.venues.slice();
      venues.splice(index, 1);
      return { ...prev, venues: venues.length ? venues : [emptyVenue()] };
    });

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
      if (!v.postcode?.trim()) e[`venue_${i}_postcode`] = 'Postcode is required';
      if (!v.city?.trim()) e[`venue_${i}_city`] = 'City is required';
      if (!v.addressLine1?.trim()) e[`venue_${i}_addressLine1`] = 'Address is required';
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
        address: {
          line1: venue.addressLine1.trim(),
          line2: venue.addressLine2?.trim() || '',
          city: venue.city.trim(),
          postcode: venue.postcode.trim().toUpperCase()
        },
        questions: venue.questions
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Create Account - Admin Center - Chatters</title>
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="py-6">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Accounts
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Create New Account
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Set up a new customer account with venues and master user. An invitation email will be sent automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Account Information */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
                <p className="text-sm text-gray-500">Company details for billing and identification</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setField('companyName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
                  data-error={!!errors.companyName}
                  placeholder="e.g. The King's Arms Ltd"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="accounts@company.com (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to use master user email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Phone
                </label>
                <input
                  type="tel"
                  value={formData.accountPhone}
                  onChange={(e) => setField('accountPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+44 20 1234 5678"
                />
              </div>
            </div>
          </section>

          {/* Master User */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Master User</h2>
                <p className="text-sm text-gray-500">Primary account owner who will receive the invitation email</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  An email will be automatically sent to this user with a link to set their password and access the dashboard.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                  data-error={!!errors.firstName}
                  placeholder="John"
                />
                {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                  data-error={!!errors.lastName}
                  placeholder="Smith"
                />
                {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+44 7700 900000"
                />
              </div>
            </div>
          </section>

          {/* Trial Settings */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trial Settings</h2>

            <div className="flex items-start gap-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.startTrial}
                  onChange={(e) => setField('startTrial', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Start with trial period</span>
              </label>

              {formData.startTrial && (
                <div className="flex items-center gap-2">
                  <select
                    value={formData.trialDays}
                    onChange={(e) => setField('trialDays', parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                  <span className="text-sm text-gray-500">trial duration</span>
                </div>
              )}
            </div>
          </section>

          {/* Venues */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Venues</h2>
                  <p className="text-sm text-gray-500">Add one or more venues for this account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addVenue}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <Plus className="w-4 h-4" />
                Add Venue
              </button>
            </div>

            <div className="space-y-4">
              {formData.venues.map((venue, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Venue header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                    onClick={() => toggleVenueExpanded(index)}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {venue.name?.trim() || `Venue ${index + 1}`}
                      </span>
                      {venue.type && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          {VENUE_TYPES.find(t => t.value === venue.type)?.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.venues.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeVenue(index); }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {venue._expanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Venue body */}
                  {venue._expanded && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Venue Name *
                          </label>
                          <input
                            type="text"
                            value={venue.name}
                            onChange={(e) => setVenueField(index, 'name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_name`] ? 'border-red-500' : 'border-gray-300'}`}
                            data-error={!!errors[`venue_${index}_name`]}
                            placeholder="e.g. The King's Arms"
                          />
                          {errors[`venue_${index}_name`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_name`]}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Venue Type *
                          </label>
                          <select
                            value={venue.type}
                            onChange={(e) => setVenueField(index, 'type', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_type`] ? 'border-red-500' : 'border-gray-300'}`}
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

                      {/* Address */}
                      <div className="pt-2 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Address</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              value={venue.addressLine1}
                              onChange={(e) => setVenueField(index, 'addressLine1', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_addressLine1`] ? 'border-red-500' : 'border-gray-300'}`}
                              data-error={!!errors[`venue_${index}_addressLine1`]}
                              placeholder="123 High Street"
                            />
                            {errors[`venue_${index}_addressLine1`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_addressLine1`]}</p>}
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Address Line 2
                            </label>
                            <input
                              type="text"
                              value={venue.addressLine2}
                              onChange={(e) => setVenueField(index, 'addressLine2', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Suite 100 (optional)"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              City *
                            </label>
                            <input
                              type="text"
                              value={venue.city}
                              onChange={(e) => setVenueField(index, 'city', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_city`] ? 'border-red-500' : 'border-gray-300'}`}
                              data-error={!!errors[`venue_${index}_city`]}
                              placeholder="London"
                            />
                            {errors[`venue_${index}_city`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_city`]}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Postcode *
                            </label>
                            <input
                              type="text"
                              value={venue.postcode}
                              onChange={(e) => setVenueField(index, 'postcode', e.target.value.toUpperCase())}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors[`venue_${index}_postcode`] ? 'border-red-500' : 'border-gray-300'}`}
                              data-error={!!errors[`venue_${index}_postcode`]}
                              placeholder="SW1A 1AA"
                            />
                            {errors[`venue_${index}_postcode`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_postcode`]}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Pre-populated questions preview */}
                      {venue.questions.length > 0 && (
                        <div className="pt-2 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Default Feedback Questions</h4>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <ul className="space-y-1.5">
                              {venue.questions.map((q, qIndex) => (
                                <li key={qIndex} className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-medium">
                                    {qIndex + 1}
                                  </span>
                                  {q.question}
                                  <span className="text-xs text-gray-400">({q.type})</span>
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-gray-500 mt-2">
                              These questions will be pre-configured for this venue. They can be customised later in the dashboard.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-500">Venues</p>
                <p className="text-lg font-semibold text-gray-900">{formData.venues.length}</p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateAccount;
