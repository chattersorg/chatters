// QuestionArchiveTab.js - Previously used questions archive

import React from 'react';
import PreviouslyUsedQuestions from './PreviouslyUsedQuestions';
import ReplaceModal from '../../common/ReplaceModal';

const QuestionArchiveTab = ({
  inactiveQuestions,
  searchTerm,
  questions,
  isReplaceModalOpen,
  replacementSource,
  pendingNewQuestion,
  selectedInactiveQuestion,
  setSearchTerm,
  handleAddInactiveQuestion,
  setSelectedInactiveQuestion,
  setReplacementSource,
  setIsReplaceModalOpen,
  handleReplaceQuestion,
}) => {

  const handleAddInactive = (question) => {
    if (questions.length >= 5) {
      setSelectedInactiveQuestion(question);
      setReplacementSource('inactive');
      setIsReplaceModalOpen(true);
    } else {
      handleAddInactiveQuestion(question);
    }
  };

  return (
    <div className="max-w-none">
      <div className="mb-6">
        <h2 className="text-base lg:text-lg font-medium text-gray-900 mb-1">Question Archive</h2>
        <p className="text-sm text-gray-600">
          Browse and reactivate questions you've used before
        </p>
      </div>

      <PreviouslyUsedQuestions
        inactiveQuestions={inactiveQuestions}
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        onAddInactiveQuestion={handleAddInactive}
      />

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

export default QuestionArchiveTab;