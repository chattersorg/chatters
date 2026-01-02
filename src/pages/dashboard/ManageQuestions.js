// ManageQuestions.js — Refactored with tabbed interface like ReportsPage

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { DragDropContext } from 'react-beautiful-dnd';
// Removed PageContainer import - using modern layout
import usePageTitle from '../../hooks/usePageTitle';
import { useVenue } from '../../context/VenueContext';
import AlertModal from '../../components/ui/AlertModal';

// Import tab components
import QRCodeTab from '../../components/dashboard/feedback/QRCodeTab';
import QuestionManagementTab from '../../components/dashboard/feedback/QuestionManagementTab';

const ManageQuestions = () => {
  usePageTitle('Feedback Manager');
  const { venueId } = useVenue();

  // State for active tab
  const [activeTab, setActiveTab] = useState('QRCode');
  // Add mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // All your existing state variables
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');
  const [inactiveQuestions, setInactiveQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [selectedInactiveQuestion, setSelectedInactiveQuestion] = useState(null);
  const [pendingNewQuestion, setPendingNewQuestion] = useState('');
  const [replacementSource, setReplacementSource] = useState(null);
  const [duplicateError, setDuplicateError] = useState('');
  const [addedSuggestedQuestions, setAddedSuggestedQuestions] = useState([]);
  const [alertModal, setAlertModal] = useState(null);

  const qrCodeRef = useRef(null);

  const suggestedQuestions = [
    'How was the service today?',
    'How would you rate the atmosphere?',
    'Was your order prepared correctly?',
    'How clean was the venue?',
  ];

  const filteredSuggestedQuestions = suggestedQuestions.filter(
    (question) => !addedSuggestedQuestions.includes(question)
  );

  // Navigation items
  const navItems = [
    { id: 'QRCode', label: 'QR Code & Sharing' },
    { id: 'Questions', label: 'Question Management' },
  ];

  // Close mobile menu when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!venueId) return;
    fetchQuestions(venueId);
    fetchInactiveQuestions(venueId);
  }, [venueId]);

  const fetchQuestions = async (venueId) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('venue_id', venueId)
      .eq('active', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching questions:', error);
    } else {
      setQuestions(data);
      const addedQuestions = data.map((q) => q.question);
      setAddedSuggestedQuestions(addedQuestions.filter((q) => suggestedQuestions.includes(q)));
    }
  };

  const fetchInactiveQuestions = async (venueId) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('venue_id', venueId)
      .eq('active', false);

    if (error) {
      console.error('Error fetching inactive questions:', error);
    } else {
      setInactiveQuestions(data);
    }
  };

  const handleAddQuestion = async () => {
    if (questions.length >= 5) {
      setPendingNewQuestion(newQuestion);
      setReplacementSource('new');
      setIsReplaceModalOpen(true);
      return;
    }

    if (!newQuestion.trim()) {
      setAlertModal({
        type: 'warning',
        title: 'Invalid Question',
        message: 'Question cannot be empty.'
      });
      return;
    }

    if (newQuestion.length > 100) {
      setAlertModal({
        type: 'warning',
        title: 'Question Too Long',
        message: 'Question cannot exceed 100 characters.'
      });
      return;
    }

    const isDuplicate = await checkForDuplicateQuestion(newQuestion, true);
    if (isDuplicate) {
      setAlertModal({
        type: 'warning',
        title: 'Duplicate Question',
        message: 'This question already exists.'
      });
      return;
    }

    const { data, error } = await supabase
      .from('questions')
      .insert([{ venue_id: venueId, question: newQuestion, order: questions.length, active: true }])
      .select();

    if (error) {
      console.error('Error adding question:', error);
    } else {
      setQuestions([...questions, data[0]]);
      setNewQuestion('');

      if (suggestedQuestions.includes(newQuestion)) {
        setAddedSuggestedQuestions([...addedSuggestedQuestions, newQuestion]);
      }
    }
  };

  const handleAddInactiveQuestion = async (inactiveQuestion) => {
    const { error } = await supabase
      .from('questions')
      .update({ active: true, order: questions.length + 1 })
      .eq('id', inactiveQuestion.id);

    if (error) {
      console.error('Error re-adding inactive question:', error);
    } else {
      fetchQuestions(venueId);
      fetchInactiveQuestions(venueId);
    }
  };

  const checkForDuplicateQuestion = async (questionText, isActive = true) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('venue_id', venueId)
      .eq('question', questionText)
      .eq('active', isActive);

    if (error) {
      console.error('Error checking for duplicate question:', error);
      return false;
    }

    return data.length > 0;
  };

  const handleReplaceQuestion = async (questionIdToReplace) => {
    if (replacementSource === 'new' && !pendingNewQuestion.trim()) {
      setAlertModal({
        type: 'warning',
        title: 'Missing Question',
        message: 'Please enter a question to add.'
      });
      return;
    }

    if (replacementSource === 'inactive' && !selectedInactiveQuestion) {
      setAlertModal({
        type: 'warning',
        title: 'No Selection',
        message: 'Please select a question to re-add.'
      });
      return;
    }

    const questionToAdd = replacementSource === 'new' ? pendingNewQuestion : selectedInactiveQuestion.question;

    if (replacementSource === 'new') {
      const isDuplicate = await checkForDuplicateQuestion(questionToAdd, true);
      if (isDuplicate) {
        setAlertModal({
          type: 'warning',
          title: 'Duplicate Question',
          message: 'This question already exists. Please select a unique question.'
        });
        return;
      }
    }

    await supabase
      .from('questions')
      .update({ active: false })
      .eq('id', questionIdToReplace);

    if (replacementSource === 'new') {
      const { data, error } = await supabase
        .from('questions')
        .insert([{ venue_id: venueId, question: pendingNewQuestion, order: questions.length, active: true }])
        .select();

      if (error) {
        console.error('Error adding new question:', error);
      } else {
        const updatedQuestions = questions.filter((q) => q.id !== questionIdToReplace);
        setQuestions([...updatedQuestions, data[0]]);
        setNewQuestion('');
      }
    } else if (replacementSource === 'inactive') {
      await supabase
        .from('questions')
        .update({ active: true, order: questions.length })
        .eq('id', selectedInactiveQuestion.id);

      fetchQuestions(venueId);
      fetchInactiveQuestions(venueId);
    }

    setPendingNewQuestion('');
    setSelectedInactiveQuestion(null);
    setReplacementSource(null);
    setIsReplaceModalOpen(false);
  };

  const handleNewQuestionChange = (e) => {
    setNewQuestion(e.target.value);
    setDuplicateError('');
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const reorderedQuestions = Array.from(questions);
    const [movedQuestion] = reorderedQuestions.splice(result.source.index, 1);
    reorderedQuestions.splice(result.destination.index, 0, movedQuestion);

    setQuestions(reorderedQuestions);

    const updates = reorderedQuestions.map((q, index) => ({
      id: q.id,
      order: index + 1,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('questions')
        .update({ order: update.order })
        .eq('id', update.id);

      if (error) {
        console.error('Error updating question order:', error);
        fetchQuestions(venueId);
        return;
      }
    }
  };

  const startEditingQuestion = (questionId, questionText) => {
    setEditingQuestionId(questionId);
    setEditingQuestionText(questionText);
  };

  const cancelEditingQuestion = () => {
    setEditingQuestionId(null);
    setEditingQuestionText('');
  };

  const handleEditTextChange = (newText) => {
    setEditingQuestionText(newText);
  };

  const saveEditedQuestion = async () => {
    if (!editingQuestionText.trim()) {
      setAlertModal({
        type: 'warning',
        title: 'Invalid Question',
        message: 'Question cannot be empty.'
      });
      return;
    }

    if (editingQuestionText.length > 100) {
      setAlertModal({
        type: 'warning',
        title: 'Question Too Long',
        message: 'Question cannot exceed 100 characters.'
      });
      return;
    }

    const { error } = await supabase
      .from('questions')
      .update({ question: editingQuestionText })
      .eq('id', editingQuestionId);

    if (error) {
      console.error('Error updating question:', error);
    } else {
      const updatedQuestions = questions.map((q) =>
        q.id === editingQuestionId ? { ...q, question: editingQuestionText } : q
      );
      setQuestions(updatedQuestions);
      setEditingQuestionId(null);
      setEditingQuestionText('');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const { error } = await supabase
      .from('questions')
      .update({ active: false })
      .eq('id', questionId);

    if (error) {
      console.error('Error marking question as inactive:', error);
    } else {
      setQuestions(questions.filter((q) => q.id !== questionId));
      fetchInactiveQuestions(venueId);
    }
  };

  const handleEditQuestion = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      setEditingQuestionId(questionId);
      setEditingQuestionText(question.question);
    }
  };

  const handleSaveEditQuestion = async () => {
    if (!editingQuestionText.trim()) {
      setAlertModal({
        type: 'warning',
        title: 'Invalid Question',
        message: 'Question cannot be empty.'
      });
      return;
    }

    if (editingQuestionText.length > 100) {
      setAlertModal({
        type: 'warning',
        title: 'Question Too Long',
        message: 'Question cannot exceed 100 characters.'
      });
      return;
    }

    const { error } = await supabase
      .from('questions')
      .update({ question: editingQuestionText })
      .eq('id', editingQuestionId);

    if (error) {
      console.error('Error updating question:', error);
    } else {
      setQuestions(questions.map(q => 
        q.id === editingQuestionId 
          ? { ...q, question: editingQuestionText }
          : q
      ));
      setEditingQuestionId(null);
      setEditingQuestionText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditingQuestionText('');
  };

  const handleActivateQuestion = async (questionId) => {
    if (questions.length >= 5) {
      setSelectedInactiveQuestion(inactiveQuestions.find(q => q.id === questionId));
      setReplacementSource('inactive');
      setIsReplaceModalOpen(true);
      return;
    }

    const { error } = await supabase
      .from('questions')
      .update({ active: true, order: questions.length })
      .eq('id', questionId);

    if (error) {
      console.error('Error activating question:', error);
    } else {
      const activatedQuestion = inactiveQuestions.find(q => q.id === questionId);
      setInactiveQuestions(inactiveQuestions.filter(q => q.id !== questionId));
      if (activatedQuestion) {
        setQuestions([...questions, { ...activatedQuestion, active: true, order: questions.length }]);
      }
    }
  };

  const feedbackUrl = `${window.location.origin}/feedback/${venueId}`;

  // Props to pass to tab components
  const tabProps = {
    // Data
    questions,
    newQuestion,
    editingQuestionId,
    editingQuestionText,
    inactiveQuestions,
    searchTerm,
    isReplaceModalOpen,
    selectedInactiveQuestion,
    pendingNewQuestion,
    replacementSource,
    duplicateError,
    addedSuggestedQuestions,
    suggestedQuestions,
    filteredSuggestedQuestions,
    feedbackUrl,
    venueId,
    qrCodeRef,

    // Setters
    setNewQuestion,
    setEditingQuestionId,
    setEditingQuestionText,
    setSearchTerm,
    setIsReplaceModalOpen,
    setSelectedInactiveQuestion,
    setPendingNewQuestion,
    setReplacementSource,
    setDuplicateError,

    // Actions
    handleAddQuestion,
    handleAddInactiveQuestion,
    handleReplaceQuestion,
    onReplaceQuestion: handleReplaceQuestion,
    handleNewQuestionChange,
    onDragEnd,
    startEditingQuestion,
    cancelEditingQuestion,
    handleEditTextChange,
    saveEditedQuestion,
    handleDeleteQuestion,
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'QRCode':
        return <QRCodeTab {...tabProps} />;
      case 'Questions':
        return <QuestionManagementTab {...tabProps} />;
      default:
        return <QuestionManagementTab {...tabProps} />;
    }
  };

  if (!venueId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Questions</h2>
            <p className="text-gray-600">Create and organise customer feedback questions for your venue.</p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
            <span className="text-blue-700 font-semibold">Active: {questions.length}/5</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <DragDropContext onDragEnd={onDragEnd}>
          <QuestionManagementTab
            questions={questions}
            setQuestions={setQuestions}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            editingQuestionId={editingQuestionId}
            setEditingQuestionId={setEditingQuestionId}
            editingQuestionText={editingQuestionText}
            setEditingQuestionText={setEditingQuestionText}
            inactiveQuestions={inactiveQuestions}
            setInactiveQuestions={setInactiveQuestions}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isReplaceModalOpen={isReplaceModalOpen}
            setIsReplaceModalOpen={setIsReplaceModalOpen}
            selectedInactiveQuestion={selectedInactiveQuestion}
            setSelectedInactiveQuestion={setSelectedInactiveQuestion}
            pendingNewQuestion={pendingNewQuestion}
            setPendingNewQuestion={setPendingNewQuestion}
            replacementSource={replacementSource}
            setReplacementSource={setReplacementSource}
            duplicateError={duplicateError}
            setDuplicateError={setDuplicateError}
            addedSuggestedQuestions={addedSuggestedQuestions}
            setAddedSuggestedQuestions={setAddedSuggestedQuestions}
            handleAddQuestion={handleAddQuestion}
            handleEditQuestion={handleEditQuestion}
            handleSaveEditQuestion={handleSaveEditQuestion}
            handleCancelEdit={handleCancelEdit}
            handleDeleteQuestion={handleDeleteQuestion}
            handleActivateQuestion={handleActivateQuestion}
            filteredSuggestedQuestions={filteredSuggestedQuestions}
            onDragEnd={onDragEnd}
            venueId={venueId}
            setAlertModal={setAlertModal}
            handleReplaceQuestion={handleReplaceQuestion}
            handleAddInactiveQuestion={handleAddInactiveQuestion}
            handleNewQuestionChange={handleNewQuestionChange}
            startEditingQuestion={startEditingQuestion}
            cancelEditingQuestion={cancelEditingQuestion}
            handleEditTextChange={handleEditTextChange}
            saveEditedQuestion={saveEditedQuestion}
          />
        </DragDropContext>
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

export default ManageQuestions;