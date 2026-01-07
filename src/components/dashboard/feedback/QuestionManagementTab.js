// QuestionManagementTab.js — Comprehensive question management with better UX

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, GripVertical, Archive, RotateCcw, X, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import ReplaceModal from '../../common/ReplaceModal';
import { PermissionGate } from '../../../context/PermissionsContext';

// Suggested Questions Component - moved outside to prevent re-creation
const SuggestedQuestionsSection = ({ filteredSuggestedQuestions, setNewQuestion }) => (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
          <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        Quick Start - Suggested Questions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredSuggestedQuestions.map((question, index) => (
          <div
            key={index}
            onClick={() => setNewQuestion(question)}
            className="group bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{question}</p>
              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
      {filteredSuggestedQuestions.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p className="text-sm">All suggested questions have been added!</p>
        </div>
      )}
    </div>
  );

// Create New Question Component - moved outside to prevent re-creation
const CreateQuestionSection = ({
  newQuestion,
  handleNewQuestionChange,
  questions,
  duplicateError,
  handleAddQuestion,
  newQuestionConditionalTags,
  handleNewQuestionConditionalTagsChange
}) => (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
          <Edit3 className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        Create Custom Question
      </h3>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="new-question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question Text
            </label>
            <div className="relative">
              <input
                id="new-question"
                type="text"
                placeholder="Enter your custom question..."
                value={newQuestion}
                onChange={(e) => handleNewQuestionChange(e)}
                className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                maxLength={100}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                {newQuestion.length}/100
              </span>
            </div>
          </div>

          {newQuestion.trim() && (
            <ConditionalTagsEditor
              conditionalTags={newQuestionConditionalTags}
              onUpdate={handleNewQuestionConditionalTagsChange}
            />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {questions.length >= 5 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Will replace existing question</span>
                </div>
              )}
              {duplicateError && (
                <p className="text-xs text-red-600 dark:text-red-400">{duplicateError}</p>
              )}
            </div>
            <PermissionGate permission="questions.edit">
              <button
                onClick={handleAddQuestion}
                disabled={!newQuestion.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  !newQuestion.trim()
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                }`}
              >
                <Plus className="w-4 h-4" />
                {questions.length >= 5 ? 'Replace Question' : 'Add Question'}
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </div>
  );

// Conditional Tags Editor Component
const ConditionalTagsEditor = ({ conditionalTags, onUpdate }) => {
  const [enabled, setEnabled] = useState(conditionalTags?.enabled || false);
  const [threshold, setThreshold] = useState(conditionalTags?.threshold || 3);
  const [tags, setTags] = useState(conditionalTags?.tags || []);
  const [newTag, setNewTag] = useState('');

  // Use ref to store onUpdate to avoid infinite loops in useEffect
  const onUpdateRef = React.useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    onUpdateRef.current({
      enabled,
      threshold,
      tags
    });
  }, [enabled, threshold, tags]);

  const addTag = () => {
    const trimmedTag = newTag.trim();
    // Case-insensitive duplicate check
    const isDuplicate = tags.some(t => t.toLowerCase() === trimmedTag.toLowerCase());
    if (trimmedTag && !isDuplicate) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Follow-up Tags</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {enabled && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Show tags when rating is below
            </label>
            <div className="flex items-center gap-2">
              <select
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={2}>2 stars</option>
                <option value={3}>3 stars</option>
                <option value={4}>4 stars</option>
                <option value={5}>5 stars</option>
              </select>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (ratings of {threshold - 1} or lower will show tags)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Tags to show
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-purple-600 dark:hover:text-purple-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">No tags added yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag (e.g., Too slow, Too cold)"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={50}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!newTag.trim()}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-600 dark:disabled:text-gray-400 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            When customers rate this question below {threshold} stars, they'll be prompted to select one or more tags to provide additional context.
          </p>
        </div>
      )}
    </div>
  );
};

// Active Questions Component - moved outside to prevent re-creation
const ActiveQuestionsSection = ({
  questions,
  editingQuestionId,
  editingQuestionText,
  editingConditionalTags,
  handleEditTextChange,
  handleConditionalTagsChange,
  cancelEditingQuestion,
  saveEditedQuestion,
  startEditingQuestion,
  handleDeleteQuestion
}) => (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
          <GripVertical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        Current Questions ({questions.length}/5)
      </h3>

      {questions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Active Questions</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first feedback question using the suggestions above or write a custom one.
            </p>
          </div>
        </div>
      ) : (
        <Droppable droppableId="questions">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-3 transition-colors duration-200 ${
                snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2' : ''
              }`}
            >
              {questions.map((q, index) => (
                <Draggable key={q.id} draggableId={q.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white dark:bg-gray-900 border rounded-lg transition-all duration-200 ${
                        snapshot.isDragging
                          ? 'shadow-lg border-blue-300 dark:border-blue-600 rotate-1'
                          : 'border-gray-200 dark:border-gray-800 hover:shadow-md'
                      }`}
                    >
                      <div className="p-5">
                        {editingQuestionId === q.id ? (
                          // Edit mode
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Edit Question
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={editingQuestionText}
                                  onChange={(e) => handleEditTextChange(e.target.value)}
                                  className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  maxLength={100}
                                  autoFocus
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">
                                  {editingQuestionText.length}/100
                                </span>
                              </div>
                            </div>

                            <ConditionalTagsEditor
                              conditionalTags={editingConditionalTags}
                              onUpdate={handleConditionalTagsChange}
                            />

                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={cancelEditingQuestion}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveEditedQuestion}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display mode
                          <div className="flex items-center space-x-4">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                            >
                              <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium rounded-full">
                                  {index + 1}
                                </span>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">{q.question}</h4>
                                {q.conditional_tags?.enabled && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                    <Tag className="w-3 h-3" />
                                    {q.conditional_tags.tags?.length || 0} tags
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Customers will rate this 1-5 stars
                                {q.conditional_tags?.enabled && (
                                  <span className="ml-1">• Tags shown for ratings below {q.conditional_tags.threshold} stars</span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <PermissionGate permission="questions.edit">
                                <button
                                  onClick={() => startEditingQuestion(q.id, q.question)}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all duration-200"
                                  title="Edit question"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="questions.edit">
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all duration-200"
                                  title="Archive question"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              </PermissionGate>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );

// Archive Section Component - moved outside to prevent re-creation
const ArchiveSection = ({ 
  inactiveQuestions, 
  searchTerm, 
  setSearchTerm, 
  filteredInactiveQuestions, 
  handleAddInactive 
}) => (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
          <Archive className="w-4 h-4 text-gray-600" />
        </div>
        Question Archive ({filteredInactiveQuestions.length})
      </h3>

      {inactiveQuestions.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search archived questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        {filteredInactiveQuestions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? (
              <>
                <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <p className="font-medium mb-1">No questions found</p>
                <p className="text-sm">Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <Archive className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <p className="font-medium mb-1">No archived questions</p>
                <p className="text-sm">Questions you remove will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredInactiveQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                onClick={() => handleAddInactive(q)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 mb-1">{q.question}</p>
                    <p className="text-xs text-gray-500">Click to reactivate</p>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Archived
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddInactive(q);
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-all duration-200"
                      title="Reactivate question"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

const QuestionManagementTab = ({
  questions,
  newQuestion,
  editingQuestionId,
  editingQuestionText,
  editingConditionalTags,
  inactiveQuestions,
  searchTerm,
  isReplaceModalOpen,
  selectedInactiveQuestion,
  pendingNewQuestion,
  replacementSource,
  duplicateError,
  filteredSuggestedQuestions,
  setNewQuestion,
  setSearchTerm,
  setIsReplaceModalOpen,
  setSelectedInactiveQuestion,
  setReplacementSource,
  handleAddQuestion,
  handleNewQuestionChange,
  startEditingQuestion,
  handleDeleteQuestion,
  saveEditedQuestion,
  cancelEditingQuestion,
  handleEditTextChange,
  handleConditionalTagsChange,
  handleAddInactiveQuestion,
  handleReplaceQuestion,
  newQuestionConditionalTags,
  handleNewQuestionConditionalTagsChange,
}) => {
  const [view, setView] = useState('active'); // 'active', 'create', 'archive'

  const handleAddInactive = (question) => {
    if (questions.length >= 5) {
      setSelectedInactiveQuestion(question);
      setReplacementSource('inactive');
      setIsReplaceModalOpen(true);
    } else {
      handleAddInactiveQuestion(question);
    }
  };

  const filteredInactiveQuestions = inactiveQuestions.filter(q => {
    // Filter by search term
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());

    // Check if question text already exists in active questions
    const isDuplicate = questions.some(activeQ =>
      activeQ.question.toLowerCase().trim() === q.question.toLowerCase().trim()
    );

    return matchesSearch && !isDuplicate;
  });

  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);

  return (
    <div className="max-w-none space-y-8">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Add Questions */}
        <div className="space-y-6">
          <CreateQuestionSection
            newQuestion={newQuestion}
            handleNewQuestionChange={handleNewQuestionChange}
            questions={questions}
            duplicateError={duplicateError}
            handleAddQuestion={handleAddQuestion}
            newQuestionConditionalTags={newQuestionConditionalTags}
            handleNewQuestionConditionalTagsChange={handleNewQuestionConditionalTagsChange}
          />

          <SuggestedQuestionsSection
            filteredSuggestedQuestions={filteredSuggestedQuestions}
            setNewQuestion={setNewQuestion}
          />
        </div>

        {/* Right Column - Current Questions */}
        <div>
          <ActiveQuestionsSection
            questions={questions}
            editingQuestionId={editingQuestionId}
            editingQuestionText={editingQuestionText}
            editingConditionalTags={editingConditionalTags}
            handleEditTextChange={handleEditTextChange}
            handleConditionalTagsChange={handleConditionalTagsChange}
            cancelEditingQuestion={cancelEditingQuestion}
            saveEditedQuestion={saveEditedQuestion}
            startEditingQuestion={startEditingQuestion}
            handleDeleteQuestion={handleDeleteQuestion}
          />
        </div>
      </div>

      {/* Archived Questions - Collapsible Section */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
        <button
          onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
              <Archive className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Question Archive ({filteredInactiveQuestions.length})
            </h3>
          </div>
          <div className={`transform transition-transform duration-200 ${isArchiveExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isArchiveExpanded && (
          <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">
            <div className="pt-5">
              {inactiveQuestions.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search archived questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              )}

              {filteredInactiveQuestions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? (
                    <>
                      <Search className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="font-medium mb-1">No questions found</p>
                      <p className="text-sm">Try adjusting your search terms</p>
                    </>
                  ) : (
                    <>
                      <Archive className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="font-medium mb-1">No archived questions</p>
                      <p className="text-sm">Questions you remove will appear here</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredInactiveQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer"
                      onClick={() => handleAddInactive(q)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{q.question}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Click to reactivate</p>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                            Archived
                          </span>
                          <PermissionGate permission="questions.edit">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddInactive(q);
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-all duration-200"
                              title="Reactivate question"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ReplaceModal
        isOpen={isReplaceModalOpen}
        onRequestClose={() => setIsReplaceModalOpen(false)}
        replacementSource={replacementSource}
        pendingNewQuestion={pendingNewQuestion}
        selectedInactiveQuestion={selectedInactiveQuestion}
        questions={questions}
        onReplaceQuestion={handleReplaceQuestion}
      />
    </div>
  );
};

export default QuestionManagementTab;