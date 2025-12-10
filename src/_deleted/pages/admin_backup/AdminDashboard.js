import React, { useMemo, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabase';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  Loader2, 
  Image as ImageIcon,
  Building2,
  Users,
  TrendingUp,
  Upload,
  Download,
  Eye,
  CheckCircle,
  Search,
  Edit,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Filter,
  X
} from 'lucide-react';

const emptyVenue = () => ({
  name: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postcode: '',
  tableCount: '',
  logo: null,
  _open: true,           // UI only
  _previewUrl: null,     // UI only
  _csvFile: null,        // CSV file for employees
  _csvPreview: null,     // Parsed CSV data
});

const in30Days = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10); // yyyy-mm-dd for input[type=date]
};

// CSV parsing helper
const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredHeaders = ['first_name', 'last_name', 'role'];
  const hasRequired = requiredHeaders.every(h => headers.includes(h));
  
  if (!hasRequired) {
    throw new Error(`CSV must include columns: ${requiredHeaders.join(', ')}`);
  }
  
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  }).filter(row => row.first_name && row.last_name);
  
  return { headers, rows };
};

export default function AdminDashboard() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    accountPhone: '',
    companyName: '',
    trialEndsAt: in30Days(),
    venues: [emptyVenue()],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Account statistics state
  const [accountStats, setAccountStats] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    trialAccounts: 0,
    totalVenues: 0,
    loading: true
  });

  // Account management state
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, trial, paid, expired
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [editingAccountData, setEditingAccountData] = useState(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  const totalTables = useMemo(
    () =>
      formData.venues.reduce(
        (acc, v) => acc + (Number.isFinite(+v.tableCount) ? parseInt(v.tableCount || '0', 10) : 0),
        0
      ),
    [formData.venues]
  );

  // Load account statistics and detailed accounts
  useEffect(() => {
    const loadDetailedAccounts = async () => {
      try {
        setAccountsLoading(true);
        
        // Load accounts
        const { data: accountsData, error } = await supabase
          .from('accounts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading accounts:', error);
          throw error;
        }

        // Load venues and link to accounts
        const { data: venuesData, error: venuesError } = await supabase
          .from('venues')
          .select('id, name, table_count, address, account_id');

        if (venuesError) {
          console.error('Error loading venues:', venuesError);
        }

        // Link venues to accounts
        const accountsWithVenues = (accountsData || []).map(account => {
          const accountVenues = (venuesData || []).filter(venue => venue.account_id === account.id);
          return { ...account, venues: accountVenues };
        });

        setAccounts(accountsWithVenues);

        // Calculate statistics
        const now = new Date();
        const totalVenues = accountsWithVenues?.reduce((total, account) => 
          total + (account.venues?.length || 0), 0) || 0;
        
        const activeAccounts = accountsWithVenues?.filter(a => 
          a.is_paid || (a.trial_ends_at && new Date(a.trial_ends_at) > now)
        ).length || 0;
        
        const trialAccounts = accountsWithVenues?.filter(a => 
          !a.is_paid && a.trial_ends_at && new Date(a.trial_ends_at) > now
        ).length || 0;

        setAccountStats({
          totalAccounts: accountsWithVenues?.length || 0,
          activeAccounts,
          trialAccounts,
          totalVenues,
          loading: false
        });
      } catch (error) {
        console.error('Error loading accounts:', error);
        toast.error('Failed to load accounts');
        setAccountStats(prev => ({ ...prev, loading: false }));
      } finally {
        setAccountsLoading(false);
      }
    };

    loadDetailedAccounts();
  }, []);

  const setField = (name, value) =>
    setFormData(prev => ({ ...prev, [name]: value }));

  const setVenueField = (index, name, value) =>
    setFormData(prev => {
      const venues = [...prev.venues];
      venues[index] = { ...venues[index], [name]: value };
      return { ...prev, venues };
    });

  const toggleVenueOpen = (index) =>
    setFormData(prev => {
      const venues = [...prev.venues];
      venues[index] = { ...venues[index], _open: !venues[index]._open };
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

  const onLogoChange = (index, file) => {
    if (!file) {
      setVenueField(index, 'logo', null);
      setVenueField(index, '_previewUrl', null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Logo must be an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB.');
      return;
    }
    setVenueField(index, 'logo', file);
    setVenueField(index, '_previewUrl', URL.createObjectURL(file));
  };

  // CSV employee upload handling
  const onCSVChange = (index, file) => {
    if (!file) {
      setVenueField(index, '_csvFile', null);
      setVenueField(index, '_csvPreview', null);
      return;
    }
    
    if (!file.name.endsWith('.csv')) {
      toast.error('Employee file must be a CSV.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = parseCSV(e.target.result);
        setVenueField(index, '_csvFile', file);
        setVenueField(index, '_csvPreview', csvData);
        toast.success(`${csvData.rows.length} employees found in CSV`);
      } catch (error) {
        toast.error(error.message);
        setVenueField(index, '_csvFile', null);
        setVenueField(index, '_csvPreview', null);
      }
    };
    reader.readAsText(file);
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const csvContent = 'first_name,last_name,role,email,phone\n' +
                      'John,Smith,Server,john@example.com,07123456789\n' +
                      'Jane,Doe,Manager,jane@example.com,07987654321\n' +
                      'Mike,Johnson,Chef,,07555123456';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validate = () => {
    const e = {};

    // Basic account + user checks
    if (!formData.email?.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) e.email = 'Enter a valid email';

    if (!formData.firstName?.trim()) e.firstName = 'First name is required';
    if (!formData.lastName?.trim()) e.lastName = 'Last name is required';
    if (!formData.companyName?.trim()) e.companyName = 'Company name is required';
    if (!formData.accountPhone?.trim()) e.accountPhone = 'Company phone is required';
    if (!formData.phone?.trim()) e.phone = 'User phone is required';
    if (!formData.trialEndsAt) e.trialEndsAt = 'Trial end date is required';

    // Venues
    formData.venues.forEach((v, i) => {
      if (!v.name?.trim()) e[`venue_${i}_name`] = 'Venue name is required';
      const t = parseInt(v.tableCount || '0', 10);
      if (!Number.isFinite(t) || t < 1) e[`venue_${i}_tableCount`] = 'Table count must be ≥ 1';
      if (!v.postcode?.trim()) e[`venue_${i}_postcode`] = 'Postcode is required';
      if (!v.city?.trim()) e[`venue_${i}_city`] = 'City is required';
      if (!v.addressLine1?.trim()) e[`venue_${i}_addressLine1`] = 'Address line 1 is required';
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Fix the highlighted fields.');
      const first = document.querySelector('[data-error="true"]');
      if (first?.scrollIntoView) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLoading(true);

    try {
      // Build venues with optional logo upload
      const venuesPayload = await Promise.all(
        formData.venues.map(async (venue) => {
          let logoPath = null;

          if (venue.logo) {
            const fileName = `${Date.now()}-${venue.logo.name.replace(/\s+/g, '-')}`;
            const filePath = `logos/${fileName}`;
            const { error: uploadError } = await supabase.storage
              .from('venue-assets')
              .upload(filePath, venue.logo);

            if (uploadError) throw uploadError;
            logoPath = filePath;
          }

          return {
            name: venue.name.trim(),
            table_count: parseInt(venue.tableCount, 10),
            logo: logoPath,
            primary_color: '#000000',
            secondary_color: '#ffffff',
            address: {
              line1: venue.addressLine1,
              line2: venue.addressLine2,
              city: venue.city,
              postcode: venue.postcode.toUpperCase(),
            },
            employees: venue._csvPreview?.rows || [],
          };
        })
      );

      const payload = {
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        accountPhone: formData.accountPhone.trim(),
        companyName: formData.companyName.trim(),
        trialEndsAt: formData.trialEndsAt, // yyyy-mm-dd
        venues: venuesPayload,
      };

      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Unknown error');

      toast.success('Master user and locations created 🎉');
      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        accountPhone: '',
        companyName: '',
        trialEndsAt: in30Days(),
        venues: [emptyVenue()],
      });
      setErrors({});
      
      // Refresh account stats and accounts list
      setAccountStats(prev => ({ ...prev, loading: true }));
      // Refresh accounts list by re-running the useEffect
      window.location.reload();
    } catch (err) {
      console.error('[AdminDashboard] submit error', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search accounts
  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    
    return accounts.filter(account => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.venues?.some(venue => 
          venue.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Status filter  
      const now = new Date();
      const isTrialActive = account.trial_ends_at && new Date(account.trial_ends_at) > now;
      const isExpired = account.trial_ends_at && new Date(account.trial_ends_at) <= now && !account.is_paid;
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'trial' && !account.is_paid && isTrialActive) ||
        (filterStatus === 'paid' && account.is_paid) ||
        (filterStatus === 'expired' && isExpired);

      return matchesSearch && matchesStatus;
    });
  }, [accounts, searchTerm, filterStatus]);

  const openAccountModal = (account) => {
    setSelectedAccount(account);
    setShowAccountModal(true);
  };

  const closeAccountModal = () => {
    setSelectedAccount(null);
    setShowAccountModal(false);
    setIsEditingAccount(false);
    setEditingAccountData(null);
  };

  const startEditingAccount = () => {
    setIsEditingAccount(true);
    setEditingAccountData({
      name: selectedAccount.name || '',
      is_paid: selectedAccount.is_paid || false,
      trial_ends_at: selectedAccount.trial_ends_at ? selectedAccount.trial_ends_at.split('T')[0] : '',
      phone: selectedAccount.phone || ''
    });
  };

  const cancelEditingAccount = () => {
    setIsEditingAccount(false);
    setEditingAccountData(null);
  };

  const saveAccountChanges = async () => {
    if (!editingAccountData || !selectedAccount) return;
    
    setIsSavingAccount(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: editingAccountData.name,
          is_paid: editingAccountData.is_paid,
          trial_ends_at: editingAccountData.trial_ends_at || null,
          phone: editingAccountData.phone
        })
        .eq('id', selectedAccount.id);

      if (error) throw error;

      // Update the account in our local state
      const updatedAccount = {
        ...selectedAccount,
        ...editingAccountData
      };
      setSelectedAccount(updatedAccount);
      setAccounts(prev => prev.map(acc => 
        acc.id === selectedAccount.id ? updatedAccount : acc
      ));

      setIsEditingAccount(false);
      setEditingAccountData(null);
      toast.success('Account updated successfully!');
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account: ' + error.message);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const getAccountStatus = (account) => {
    const now = new Date();
    if (account.is_paid) return { status: 'paid', color: 'green', label: 'Paid' };
    if (account.trial_ends_at && new Date(account.trial_ends_at) > now) {
      return { status: 'trial', color: 'blue', label: 'Trial' };
    }
    return { status: 'expired', color: 'red', label: 'Expired' };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Chatters Admin Center</h1>
        <p className="text-gray-600 mt-1">
          Create a master user, company, and one or more locations. You can add more locations later.
        </p>
      </div>

      {/* Account Statistics */}
      <section className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          System Overview
        </h2>
        
        {accountStats.loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading statistics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Accounts</p>
                  <p className="text-2xl font-bold text-blue-900">{accountStats.totalAccounts}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Accounts</p>
                  <p className="text-2xl font-bold text-green-900">{accountStats.activeAccounts}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Trial Accounts</p>
                  <p className="text-2xl font-bold text-yellow-900">{accountStats.trialAccounts}</p>
                </div>
                <Users className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total Venues</p>
                  <p className="text-2xl font-bold text-purple-900">{accountStats.totalVenues}</p>
                </div>
                <Building2 className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Account Management Section */}
      <section className="bg-white rounded-2xl shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Account Management
          </h2>
          <div className="text-sm text-gray-500">
            {filteredAccounts.length} of {accounts.length} accounts
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search accounts, users, or venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Accounts</option>
              <option value="trial">Trial Accounts</option>
              <option value="paid">Paid Accounts</option>
              <option value="expired">Expired Accounts</option>
            </select>
          </div>
        </div>

        {/* Accounts List */}
        {accountsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading accounts...</span>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No accounts match your search' : 'No accounts found'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search terms or filters' 
                : 'Create your first account using the form below'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAccounts.map((account) => {
              const status = getAccountStatus(account);
              const masterUser = account.users?.find(u => u.role === 'master');
              const venueCount = account.venues?.length || 0;
              const totalTables = account.venues?.reduce((sum, v) => sum + (v.table_count || 0), 0) || 0;

              return (
                <div
                  key={account.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openAccountModal(account)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {account.name || 'Unnamed Account'}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          status.color === 'green' ? 'bg-green-100 text-green-800' :
                          status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{masterUser?.email || 'No master user'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{venueCount} venue{venueCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{totalTables} tables</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {account.trial_ends_at 
                              ? `Trial ends ${new Date(account.trial_ends_at).toLocaleDateString()}`
                              : 'No trial date'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAccountModal(account);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit account"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account & Master User */}
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Account & Master User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={(e) => setField('companyName', e.target.value)}
                className={`w-full border rounded px-3 py-2 ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
                data-error={!!errors.companyName}
              />
              {errors.companyName && <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Company Phone</label>
              <input
                type="tel"
                name="accountPhone"
                value={formData.accountPhone}
                onChange={(e) => setField('accountPhone', e.target.value)}
                className={`w-full border rounded px-3 py-2 ${errors.accountPhone ? 'border-red-500' : 'border-gray-300'}`}
                data-error={!!errors.accountPhone}
              />
              {errors.accountPhone && <p className="text-xs text-red-600 mt-1">{errors.accountPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Admin Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setField('email', e.target.value)}
                className={`w-full border rounded px-3 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                data-error={!!errors.email}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  className={`w-full border rounded px-3 py-2 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                  data-error={!!errors.firstName}
                />
                {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  className={`w-full border rounded px-3 py-2 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                  data-error={!!errors.lastName}
                />
                {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">User Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => setField('phone', e.target.value)}
                className={`w-full border rounded px-3 py-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                data-error={!!errors.phone}
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Trial Ends</label>
              <input
                type="date"
                name="trialEndsAt"
                min={new Date().toISOString().slice(0,10)}
                value={formData.trialEndsAt}
                onChange={(e) => setField('trialEndsAt', e.target.value)}
                className={`w-full border rounded px-3 py-2 ${errors.trialEndsAt ? 'border-red-500' : 'border-gray-300'}`}
                data-error={!!errors.trialEndsAt}
              />
              {errors.trialEndsAt && <p className="text-xs text-red-600 mt-1">{errors.trialEndsAt}</p>}
            </div>
          </div>
        </section>

        {/* Locations */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Venues & Staff
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={downloadCSVTemplate}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
              >
                <Download className="w-4 h-4" /> CSV Template
              </button>
              <button 
                type="button" 
                onClick={addVenue} 
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Venue
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {formData.venues.map((venue, index) => (
              <div key={index} className="border rounded-xl overflow-hidden">
                {/* Card header */}
                <button
                  type="button"
                  onClick={() => toggleVenueOpen(index)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50"
                >
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {venue.name?.trim() ? venue.name : `Venue ${index + 1}`}
                      {venue._csvPreview && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          {venue._csvPreview.rows.length} employees
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Number(venue.tableCount || 0)} tables
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${venue._open ? 'rotate-180' : ''}`} />
                </button>

                {/* Card body */}
                {venue._open && (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Venue Name</label>
                        <input
                          type="text"
                          name="name"
                          value={venue.name}
                          onChange={(e) => setVenueField(index, 'name', e.target.value)}
                          className={`w-full border rounded px-3 py-2 ${errors[`venue_${index}_name`] ? 'border-red-500' : 'border-gray-300'}`}
                          data-error={!!errors[`venue_${index}_name`]}
                        />
                        {errors[`venue_${index}_name`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_name`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Table Count</label>
                        <input
                          type="number"
                          min={1}
                          name="tableCount"
                          value={venue.tableCount}
                          onChange={(e) => setVenueField(index, 'tableCount', e.target.value)}
                          className={`w-full border rounded px-3 py-2 ${errors[`venue_${index}_tableCount`] ? 'border-red-500' : 'border-gray-300'}`}
                          data-error={!!errors[`venue_${index}_tableCount`]}
                        />
                        {errors[`venue_${index}_tableCount`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_tableCount`]}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium">Address Line 1</label>
                        <input
                          type="text"
                          name="addressLine1"
                          value={venue.addressLine1}
                          onChange={(e) => setVenueField(index, 'addressLine1', e.target.value)}
                          className={`w-full border rounded px-3 py-2 ${errors[`venue_${index}_addressLine1`] ? 'border-red-500' : 'border-gray-300'}`}
                          data-error={!!errors[`venue_${index}_addressLine1`]}
                        />
                        {errors[`venue_${index}_addressLine1`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_addressLine1`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Address Line 2</label>
                        <input
                          type="text"
                          name="addressLine2"
                          value={venue.addressLine2}
                          onChange={(e) => setVenueField(index, 'addressLine2', e.target.value)}
                          className="w-full border rounded px-3 py-2 border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">City</label>
                        <input
                          type="text"
                          name="city"
                          value={venue.city}
                          onChange={(e) => setVenueField(index, 'city', e.target.value)}
                          className={`w-full border rounded px-3 py-2 ${errors[`venue_${index}_city`] ? 'border-red-500' : 'border-gray-300'}`}
                          data-error={!!errors[`venue_${index}_city`]}
                        />
                        {errors[`venue_${index}_city`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_city`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Postcode</label>
                        <input
                          type="text"
                          name="postcode"
                          value={venue.postcode}
                          onChange={(e) => setVenueField(index, 'postcode', e.target.value.toUpperCase())}
                          className={`w-full border rounded px-3 py-2 ${errors[`venue_${index}_postcode`] ? 'border-red-500' : 'border-gray-300'}`}
                          data-error={!!errors[`venue_${index}_postcode`]}
                        />
                        {errors[`venue_${index}_postcode`] && <p className="text-xs text-red-600 mt-1">{errors[`venue_${index}_postcode`]}</p>}
                      </div>
                    </div>

                    {/* Logo and Employee Upload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Logo Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Logo</label>
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer bg-white hover:bg-gray-50">
                            <ImageIcon className="w-4 h-4" />
                            <span>Upload Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => onLogoChange(index, e.target.files?.[0] || null)}
                            />
                          </label>
                          {venue._previewUrl && (
                            <img src={venue._previewUrl} alt="preview" className="h-10 w-10 rounded object-cover border" />
                          )}
                          {venue.logo && (
                            <button
                              type="button"
                              onClick={() => onLogoChange(index, null)}
                              className="text-sm text-gray-600 hover:text-gray-900 underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Employee CSV Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Employee List (CSV)</label>
                        <div className="space-y-2">
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer bg-white hover:bg-gray-50">
                            <Upload className="w-4 h-4" />
                            <span>Upload CSV</span>
                            <input
                              type="file"
                              accept=".csv"
                              className="hidden"
                              onChange={(e) => onCSVChange(index, e.target.files?.[0] || null)}
                            />
                          </label>
                          {venue._csvFile && (
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {venue._csvFile.name} ({venue._csvPreview?.rows.length} employees)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CSV Preview */}
                    {venue._csvPreview && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Employee Preview</span>
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          <div className="text-xs text-green-700 space-y-1">
                            {venue._csvPreview.rows.slice(0, 5).map((row, i) => (
                              <div key={i} className="flex gap-4">
                                <span className="font-medium">{row.first_name} {row.last_name}</span>
                                <span>{row.role}</span>
                                <span className="text-green-600">{row.email}</span>
                              </div>
                            ))}
                            {venue._csvPreview.rows.length > 5 && (
                              <div className="text-green-600 italic">
                                ...and {venue._csvPreview.rows.length - 5} more
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Remove Venue */}
                    <div className="flex justify-end pt-2">
                      {formData.venues.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVenue(index)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" /> Remove Venue
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Enhanced Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-600">Venues</p>
                <p className="font-semibold text-lg">{formData.venues.length}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Total Tables</p>
                <p className="font-semibold text-lg">{totalTables}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Total Employees</p>
                <p className="font-semibold text-lg">
                  {formData.venues.reduce((acc, v) => acc + (v._csvPreview?.rows.length || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Logos</p>
                <p className="font-semibold text-lg">
                  {formData.venues.filter(v => v.logo).length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setFormData({ 
                email: '', 
                firstName: '', 
                lastName: '', 
                phone: '', 
                accountPhone: '', 
                companyName: '', 
                trialEndsAt: in30Days(), 
                venues: [emptyVenue()] 
              });
              setErrors({});
              toast('Form cleared');
            }}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
            disabled={loading}
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 font-medium"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {loading ? 'Creating Account...' : 'Create Account & Venues'}
          </button>
        </div>
      </form>

      {/* Account Edit Modal */}
      {showAccountModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditingAccount ? 'Edit Account' : 'Account Details'}: {selectedAccount.name}
              </h2>
              <button
                onClick={closeAccountModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    {isEditingAccount ? (
                      <input
                        type="text"
                        value={editingAccountData?.name || ''}
                        onChange={(e) => setEditingAccountData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter account name"
                      />
                    ) : (
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        {selectedAccount.name || 'Not set'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {isEditingAccount ? (
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={editingAccountData?.is_paid || false}
                            onChange={(e) => setEditingAccountData(prev => ({ ...prev, is_paid: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm">Paid Account</span>
                        </label>
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          getAccountStatus(selectedAccount).color === 'green' ? 'bg-green-100 text-green-800' :
                          getAccountStatus(selectedAccount).color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getAccountStatus(selectedAccount).label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trial End Date</label>
                    {isEditingAccount ? (
                      <input
                        type="date"
                        value={editingAccountData?.trial_ends_at || ''}
                        onChange={(e) => setEditingAccountData(prev => ({ ...prev, trial_ends_at: e.target.value }))}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        {selectedAccount.trial_ends_at 
                          ? new Date(selectedAccount.trial_ends_at).toLocaleDateString()
                          : 'No trial date set'
                        }
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {isEditingAccount ? (
                      <input
                        type="tel"
                        value={editingAccountData?.phone || ''}
                        onChange={(e) => setEditingAccountData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="p-2 bg-gray-50 rounded border text-sm">
                        {selectedAccount.phone || 'Not set'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <div className="p-2 bg-gray-50 rounded border text-sm">
                      {new Date(selectedAccount.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Venues */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Venues ({selectedAccount.venues?.length || 0})
              </h3>
              <div className="space-y-3">
                {selectedAccount.venues?.length ? (
                  selectedAccount.venues.map((venue) => (
                    <div key={venue.id} className="p-4 bg-gray-50 rounded border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{venue.name}</div>
                          <div className="text-sm text-gray-600">
                            {venue.table_count || 0} tables
                          </div>
                          {venue.address && (
                            <div className="text-xs text-gray-500 mt-1">
                              {typeof venue.address === 'string' ? venue.address : 
                               venue.address.line1 ? `${venue.address.line1}, ${venue.address.city} ${venue.address.postcode}` :
                               'No address'
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No venues found</div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              {isEditingAccount ? (
                <>
                  <button
                    onClick={cancelEditingAccount}
                    disabled={isSavingAccount}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAccountChanges}
                    disabled={isSavingAccount}
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingAccount ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={closeAccountModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={startEditingAccount}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Edit Account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}