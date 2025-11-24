import React from 'react';

const AddNewQuestion = ({ newQuestion, onQuestionChange, onAddQuestion, questions, duplicateError }) => {
  return (
    <div className="max-w-none lg:max-w-6xl mb-6 lg:mb-8">
      <div className="mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Add New Question</h2>
            <p className="text-gray-600 text-sm">
              Create a new feedback question for your customers to answer.
            </p>
          </div>
          <button
            onClick={onAddQuestion}
            disabled={!newQuestion.trim()}
            className={`w-full sm:w-auto px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium ${
              questions.length >= 5
                ? 'bg-gray-500 text-white hover:bg-gray-600'
                : !newQuestion.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {questions.length >= 5 ? 'Replace Question' : 'Add Question'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="new-question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question Text
            </label>
            <input
              id="new-question"
              type="text"
              placeholder="Enter a new question..."
              value={newQuestion}
              onChange={onQuestionChange}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
              maxLength={100}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
              <p className="text-xs text-gray-500">
                {newQuestion.length}/100 characters
              </p>
              {questions.length >= 5 && (
                <p className="text-xs text-yellow-600">
                  Maximum questions limit reached (5/5)
                </p>
              )}
            </div>
            {duplicateError && (
              <p className="text-xs text-red-600">{duplicateError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewQuestion;