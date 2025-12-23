import React, { useState, useEffect } from 'react';
import { CheckCircle, X, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '../../../utils/supabase';
import AlertModal from '../../ui/AlertModal';

const AssistanceResolveModal = ({ 
  request, 
  onResolve, 
  onAcknowledge, 
  onCancel,
  isVisible,
  venueId
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [alertModal, setAlertModal] = useState(null);

  // Load employees when modal opens
  useEffect(() => {
    const loadEmployees = async () => {
      if (!isVisible || !venueId) return;
      
      const { data: employeesData, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, role')
        .eq('venue_id', venueId);
        
      if (error) {
        // Error loading employees
      } else {
        setEmployees(employeesData || []);
        
        // Auto-select current user if their email matches an employee
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const currentEmployee = employeesData?.find(e => e.email === session.user.email);
          if (currentEmployee) {
            setSelectedEmployee(currentEmployee.id);
          }
        }
      }
    };
    
    loadEmployees();
  }, [isVisible, venueId]);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isVisible) {
      setNotes('');
      setSelectedEmployee('');
    }
  }, [isVisible]);

  if (!isVisible || !request) return null;

  const handleResolve = async () => {
    if (!selectedEmployee) {
      setAlertModal({
        type: 'warning',
        title: 'Missing Staff Selection',
        message: 'Please select which staff member resolved this request.'
      });
      return;
    }
    if (!notes.trim()) {
      setAlertModal({
        type: 'warning',
        title: 'Missing Notes',
        message: 'Please provide notes on how the issue was resolved.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onResolve(request.id, notes.trim(), selectedEmployee);
      setNotes('');
      setSelectedEmployee('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedEmployee) {
      setAlertModal({
        type: 'warning',
        title: 'Missing Staff Selection',
        message: 'Please select which staff member acknowledged this request.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onAcknowledge(request.id, selectedEmployee);
      setSelectedEmployee('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = () => {
    switch (request.status) {
      case 'pending':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
        };
      case 'acknowledged':
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
        };
      default:
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Professional Header */}
        <div className={`sticky top-0 px-6 py-5 border-b border-gray-200 dark:border-gray-700 ${statusInfo.bgColor}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-600">
                  {statusInfo.icon}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Assistance Request - Table {request.table_number}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Created {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    request.status === 'pending' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' :
                    request.status === 'acknowledged' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                    'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                  }`}>
                    {request.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/60 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Request Message */}
          <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Customer Request</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{request.message}</p>
              </div>
            </div>

            {request.acknowledged_at && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ✓ Acknowledged: {new Date(request.acknowledged_at).toLocaleDateString()} at {new Date(request.acknowledged_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            )}
          </div>

          {/* Staff Member Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Responsible Staff Member <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium shadow-sm"
              disabled={isSubmitting}
            >
              <option value="">Choose staff member...</option>
              {employees.length === 0 && (
                <option value="" disabled>No staff members found for this venue</option>
              )}
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} ({employee.role || 'Staff'})
                </option>
              ))}
            </select>
            {selectedEmployee && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-gray-100">{employees.find(e => e.id === selectedEmployee)?.first_name} {employees.find(e => e.id === selectedEmployee)?.last_name}</strong> will be recorded as the responsible staff member
                </span>
              </div>
            )}
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Resolution Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe how the assistance request was handled (e.g., 'Brought extra napkins and water', 'Called manager to address noise concern', 'Provided bill explanation and discount', etc.)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm shadow-sm"
              rows={4}
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
              <span>Help track what assistance was provided for similar issues in the future</span>
              <span>{notes.length}/500</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 p-6 border-t border-gray-200 dark:border-gray-600">
          <div className="space-y-3">
            {/* Primary Action - Resolve */}
            <button
              onClick={handleResolve}
              disabled={isSubmitting || !notes.trim() || !selectedEmployee}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                !notes.trim() || !selectedEmployee || isSubmitting
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resolving...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Mark as Resolved
                </div>
              )}
            </button>

            {/* Secondary Actions */}
            <div className="flex gap-3">
              {request.status === 'pending' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={isSubmitting || !selectedEmployee}
                  className={`flex-1 py-2 px-4 border-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    !selectedEmployee || isSubmitting
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600 shadow-none'
                      : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600'
                  }`}
                >
                  {isSubmitting ? 'Processing...' : 'Acknowledge Only'}
                </button>
              )}

              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 border-2 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        title={alertModal?.title}
        message={alertModal?.message}
        type={alertModal?.type}
      />
    </div>
  );
};

export default AssistanceResolveModal;