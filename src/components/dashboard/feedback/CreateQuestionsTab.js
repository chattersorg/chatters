// CreateQuestionsTab.js - Suggested questions and new question creation

import React from 'react';
import SuggestedQuestions from './SuggestedQuestions';
import AddNewQuestion from './AddNewQuestion';
import ReplaceModal from '../../common/ReplaceModal';

const CreateQuestionsTab = ({
  filteredSuggestedQuestions,
  newQuestion,
  questions,
  duplicateError,
  isReplaceModalOpen,
  replacementSource,
  pendingNewQuestion,
  selectedInactiveQuestion,
  setNewQuestion,
  handleNewQuestionChange,
  handleAddQuestion,
  setIsReplaceModalOpen,
  handleReplaceQuestion,
}) => {
  return (
    <div className="max-w-none">
      <div className="mb-6">
        <h2 className="text-base lg:text-lg font-medium text-gray-900 mb-1">Create Questions</h2>
        <p className="text-sm text-gray-600">
          Choose from suggested questions or create your own custom feedback questions
        </p>
      </div>

      <div className="space-y-6 lg:space-y-8">
        <SuggestedQuestions
          suggestedQuestions={filteredSuggestedQuestions}
          onQuestionClick={(question) => setNewQuestion(question)}
        />

        <AddNewQuestion
          newQuestion={newQuestion}
          onQuestionChange={handleNewQuestionChange}
          onAddQuestion={handleAddQuestion}
          questions={questions}
          duplicateError={duplicateError}
        />
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

export default CreateQuestionsTab;