// ManageQuestionsTab.js - Current active questions management

import React from 'react';
import CurrentQuestions from './CurrentQuestions';

const ManageQuestionsTab = ({
  questions,
  editingQuestionId,
  editingQuestionText,
  startEditingQuestion,
  handleDeleteQuestion,
  onDragEnd,
  saveEditedQuestion,
  cancelEditingQuestion,
  handleEditTextChange,
}) => {
  return (
    <div className="max-w-none">
      <div className="mb-6">
        <h2 className="text-base lg:text-lg font-medium text-gray-900 mb-1">Current Questions</h2>
        <p className="text-sm text-gray-600">
          Manage your active feedback questions. Drag to reorder, click to edit or delete.
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="max-w-md mx-auto">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Questions</h3>
            <p className="text-gray-600 mb-4">
              You haven't created any feedback questions yet. Start by adding some questions from the "Create Questions" tab.
            </p>
          </div>
        </div>
      ) : (
        <CurrentQuestions
          questions={questions}
          onEdit={startEditingQuestion}
          onDelete={handleDeleteQuestion}
          onDragEnd={onDragEnd}
          editingQuestionId={editingQuestionId}
          editingQuestionText={editingQuestionText}
          onSaveEdit={saveEditedQuestion}
          onCancelEdit={cancelEditingQuestion}
          onEditTextChange={handleEditTextChange}
        />
      )}
    </div>
  );
};

export default ManageQuestionsTab;