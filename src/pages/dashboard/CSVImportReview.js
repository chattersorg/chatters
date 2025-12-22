import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ChartCard } from '../../components/dashboard/layout/ModernCard';
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft, Check, AlertTriangle, Users, UserPlus, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react';

const CSVImportReview = () => {
  usePageTitle('Review CSV Import');
  const navigate = useNavigate();
  const location = useLocation();
  const { venueId, allVenues } = useVenue();

  // Get data from navigation state
  const importData = location.state;

  // State
  const [selectedForOverwrite, setSelectedForOverwrite] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDuplicates, setShowDuplicates] = useState(true);
  const [showNewEmployees, setShowNewEmployees] = useState(true);

  // Redirect if no import data
  useEffect(() => {
    if (!importData || !importData.parsedEmployees) {
      navigate('/staff/team');
    }
  }, [importData, navigate]);

  if (!importData) {
    return null;
  }

  const { parsedEmployees, duplicates, newEmployees, targetVenueId, venueName } = importData;

  const toggleOverwrite = (email) => {
    const newSelected = new Set(selectedForOverwrite);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedForOverwrite(newSelected);
  };

  const selectAllDuplicates = () => {
    if (selectedForOverwrite.size === duplicates.length) {
      setSelectedForOverwrite(new Set());
    } else {
      setSelectedForOverwrite(new Set(duplicates.map(d => d.email)));
    }
  };

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate initial progress
      setProgress(10);

      // Get the duplicate entries that should be overwritten
      const duplicatesToOverwrite = duplicates.filter(d => selectedForOverwrite.has(d.email));

      let insertedCount = 0;
      let updatedCount = 0;
      const totalOperations = newEmployees.length + duplicatesToOverwrite.length;
      let completedOperations = 0;

      // Insert new employees
      if (newEmployees.length > 0) {
        setProgress(20);

        const employeesToInsert = newEmployees.map(emp => {
          const { id, ...empWithoutId } = emp;
          return {
            ...empWithoutId,
            venue_id: targetVenueId
          };
        });

        const { data: insertedData, error: insertError } = await supabase
          .from('employees')
          .insert(employeesToInsert)
          .select();

        if (insertError) {
          console.error('Error inserting employees:', insertError);
          throw new Error(insertError.message);
        }

        insertedCount = insertedData?.length || 0;
        completedOperations += newEmployees.length;
        setProgress(20 + (completedOperations / totalOperations) * 60);
      }

      // Update duplicate employees that user chose to overwrite
      if (duplicatesToOverwrite.length > 0) {
        for (const duplicate of duplicatesToOverwrite) {
          const { error: updateError } = await supabase
            .from('employees')
            .update({
              first_name: duplicate.new.first_name,
              last_name: duplicate.new.last_name,
              email: duplicate.new.email,
              role: duplicate.new.role,
              location: duplicate.new.location,
              phone: duplicate.new.phone
            })
            .eq('id', duplicate.existing.id);

          if (!updateError) {
            updatedCount++;
          }

          completedOperations++;
          setProgress(20 + (completedOperations / totalOperations) * 60);
        }
      }

      // Complete
      setProgress(100);

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 800));

      // Navigate back with success message
      navigate('/staff/team', {
        state: {
          message: `Successfully ${insertedCount > 0 ? `added ${insertedCount} employee${insertedCount !== 1 ? 's' : ''}` : ''}${insertedCount > 0 && updatedCount > 0 ? ' and ' : ''}${updatedCount > 0 ? `updated ${updatedCount} employee${updatedCount !== 1 ? 's' : ''}` : ''}`,
          success: true
        }
      });

    } catch (error) {
      console.error('Import failed:', error);
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const totalChanges = newEmployees.length + selectedForOverwrite.size;

  return (
    <div className="space-y-6">
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Importing Employees
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please wait while we process your import...
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                {progress < 100 ? `${Math.round(progress)}% complete` : 'Complete!'}
              </p>
            </div>
          </div>
        </div>
      )}

      <ChartCard
        title="Review CSV Import"
        subtitle={`Importing employees to ${venueName || 'your venue'}`}
      >
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/staff/team')}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Staff List
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{newEmployees.length}</p>
                <p className="text-sm text-green-600 dark:text-green-500">New employees</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{duplicates.length}</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-500">Existing employees found</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{parsedEmployees.length}</p>
                <p className="text-sm text-blue-600 dark:text-blue-500">Total in CSV</p>
              </div>
            </div>
          </div>
        </div>

        {/* Duplicates Section */}
        {duplicates.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowDuplicates(!showDuplicates)}
              className="w-full flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                    {duplicates.length} Existing Employee{duplicates.length !== 1 ? 's' : ''} Found
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Matched by ID or email - select which ones to update
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  {selectedForOverwrite.size} selected for update
                </span>
                {showDuplicates ? (
                  <ChevronUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
            </button>

            {showDuplicates && (
              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {/* Select All Header */}
                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedForOverwrite.size === duplicates.length}
                      onChange={selectAllDuplicates}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select all for update
                    </span>
                  </label>
                </div>

                {/* Duplicate Items */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                  {duplicates.map((duplicate) => (
                    <div
                      key={duplicate.email}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        selectedForOverwrite.has(duplicate.email) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedForOverwrite.has(duplicate.email)}
                          onChange={() => toggleOverwrite(duplicate.email)}
                          className="w-4 h-4 mt-1 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {duplicate.email}
                            </span>
                          </div>

                          {/* Comparison Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {/* Current Data */}
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase">
                                Current
                              </div>
                              <div className="space-y-1">
                                <div><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className="text-gray-900 dark:text-white">{duplicate.existing.first_name} {duplicate.existing.last_name}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Role:</span> <span className="text-gray-900 dark:text-white">{duplicate.existing.role || '-'}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Location:</span> <span className="text-gray-900 dark:text-white">{duplicate.existing.location || '-'}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="text-gray-900 dark:text-white">{duplicate.existing.phone || '-'}</span></div>
                              </div>
                            </div>

                            {/* New Data */}
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase">
                                From CSV
                              </div>
                              <div className="space-y-1">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Name:</span>{' '}
                                  <span className={duplicate.new.first_name !== duplicate.existing.first_name || duplicate.new.last_name !== duplicate.existing.last_name ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white'}>
                                    {duplicate.new.first_name} {duplicate.new.last_name}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Role:</span>{' '}
                                  <span className={duplicate.new.role !== duplicate.existing.role ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white'}>
                                    {duplicate.new.role || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Location:</span>{' '}
                                  <span className={duplicate.new.location !== duplicate.existing.location ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white'}>
                                    {duplicate.new.location || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Phone:</span>{' '}
                                  <span className={duplicate.new.phone !== duplicate.existing.phone ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-900 dark:text-white'}>
                                    {duplicate.new.phone || '-'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* New Employees Section */}
        {newEmployees.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowNewEmployees(!showNewEmployees)}
              className="w-full flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-green-900 dark:text-green-200">
                    {newEmployees.length} New Employee{newEmployees.length !== 1 ? 's' : ''} to Add
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    These employees will be added to your team
                  </p>
                </div>
              </div>
              {showNewEmployees ? (
                <ChevronUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
            </button>

            {showNewEmployees && (
              <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                  {newEmployees.map((employee, index) => (
                    <div key={index} className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-medium text-green-600 dark:text-green-400">
                        {`${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</p>
                      </div>
                      <div className="text-right">
                        {employee.role && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {employee.role}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {totalChanges > 0 ? (
              <span>
                <span className="font-semibold text-gray-900 dark:text-white">{totalChanges}</span> change{totalChanges !== 1 ? 's' : ''} will be made
              </span>
            ) : (
              <span>No changes selected</span>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/staff/team')}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmImport}
              disabled={isProcessing || totalChanges === 0}
              className="min-w-[140px]"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Import
            </Button>
          </div>
        </div>
      </ChartCard>
    </div>
  );
};

export default CSVImportReview;
