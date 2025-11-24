import React from 'react';
import Modal from 'react-modal';

const ReplaceModal = ({
  isOpen,
  onRequestClose,
  replacementSource,
  pendingNewQuestion,
  selectedInactiveQuestion,
  questions,
  onReplaceQuestion,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Replace Question Modal"
      className="modal"
      overlayClassName="modal-overlay"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Replace Question</h2>
      {replacementSource === 'new' && (
        <p className="mb-4 text-gray-700 dark:text-gray-300">You are adding: "{pendingNewQuestion}"</p>
      )}
      {replacementSource === 'inactive' && (
        <p className="mb-4 text-gray-700 dark:text-gray-300">You are re-adding: "{selectedInactiveQuestion?.question}"</p>
      )}
      <p className="mb-4 text-gray-700 dark:text-gray-300">Select a question to replace:</p>
      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200"
            onClick={() => onReplaceQuestion(q.id)}
          >
            <p className="text-gray-700 dark:text-gray-200">{q.question}</p>
          </div>
        ))}
      </div>
      <button
        onClick={onRequestClose}
        className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        Cancel
      </button>
    </Modal>
  );
};

export default ReplaceModal;