import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardFrame from './DashboardFrame';
import { Star, Trash2, CheckCircle, XCircle } from 'lucide-react';

const TablesPage = () => {
  const [feedback, setFeedback] = useState([]);
  const [activeTab, setActiveTab] = useState('unactioned');
  const [sortBy, setSortBy] = useState('mostRecent');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch feedback from Supabase
  const fetchFeedback = async () => {
    const today = getTodayDate();

    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        questions (question)  // Use "question" instead of "question_text"
      `)
      .not('table_number', 'is', null)
      .gte('timestamp', `${today}T00:00:00Z`)
      .lte('timestamp', `${today}T23:59:59Z`)
      .order('timestamp', { ascending: false })
      .range((page - 1) * 10, page * 10 - 1);

    if (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to fetch feedback');
    } else {
      // Group feedback by session_id or id if session_id is missing
      const groupedFeedback = data.reduce((acc, fb) => {
        const key = fb.session_id || fb.id;
        if (!acc[key]) {
          acc[key] = {
            id: fb.id,
            session_id: fb.session_id,
            table_number: fb.table_number,
            timestamp: fb.timestamp,
            is_actioned: fb.is_actioned,
            questions: fb.questions ? fb.questions.map(q => ({
              question_id: q.id, // Use q.id instead of q.question_id
              question_text: q.question, // Use q.question instead of q.question_text
              sentiment: fb.sentiment,
              rating: fb.rating,
            })) : [], // Handle null or undefined questions
            additional_feedback: fb.additional_feedback,
          };
        }
        return acc;
      }, {});

      const feedbackList = Object.values(groupedFeedback);
      setFeedback((prev) => (page === 1 ? feedbackList : [...prev, ...feedbackList]));
      setHasMore(data.length === 10);
    }
  };

  // Set up real-time updates
  const setupRealtimeUpdates = () => {
    const feedbackSubscription = supabase
      .channel('feedback')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'feedback', 
          filter: 'table_number=not.is.null' 
        },
        (payload) => {
          const today = getTodayDate();
          const feedbackDate = new Date(payload.new.timestamp).toISOString().split('T')[0];
          
          // Only add feedback if it's from today and not already in the state
          if (feedbackDate === today && !feedback.some(fb => fb.id === payload.new.id)) {
            setFeedback((prev) => [payload.new, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'feedback', 
          filter: 'table_number=not.is.null' 
        },
        (payload) => {
          setFeedback((prev) =>
            prev.map((fb) => (fb.session_id === payload.new.session_id ? payload.new : fb))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedbackSubscription);
    };
  };

  useEffect(() => {
    fetchFeedback();
    const unsubscribe = setupRealtimeUpdates();
    return () => unsubscribe();
  }, [activeTab, page]);

  // Toggle feedback actioned status
  const toggleActionedStatus = async (feedbackId, isActioned) => {
    if (!feedbackId) {
      console.error('Feedback ID is null or undefined');
      toast.error('Failed to update feedback status: Feedback ID is missing');
      return;
    }

    const { data, error } = await supabase
      .from('feedback')
      .update({ is_actioned: !isActioned })
      .eq('id', feedbackId)
      .select();

    if (error) {
      console.error('Error toggling feedback status:', error);
      toast.error(`Failed to update feedback status: ${error.message}`);
    } else {
      toast.success(`Feedback marked as ${!isActioned ? 'actioned' : 'unactioned'}`);
      fetchFeedback();
    }
  };

  // Remove feedback from the list (not from the database)
  const handleDelete = (feedbackId) => {
    setFeedback((prev) => prev.filter((fb) => fb.id !== feedbackId));
  };

  // Load more feedback for infinite scroll
  const loadMoreFeedback = () => {
    setPage((prev) => prev + 1);
  };

  // Calculate average rating for a feedback entry
  const calculateAverageRating = (questions) => {
    if (!questions || questions.length === 0) return 0;
    const total = questions.reduce((sum, question) => sum + (question.rating || 0), 0);
    return (total / questions.length).toFixed(1);
  };

  // Calculate counts for unactioned and actioned feedback
  const unactionedCount = feedback.filter((fb) => !fb.is_actioned).length;
  const actionedCount = feedback.filter((fb) => fb.is_actioned).length;

  return (
    <DashboardFrame>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Today's Feedback</h1>

        {/* Tabs for Actioned/Unactioned Feedback */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('unactioned')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              activeTab === 'unactioned'
                ? 'bg-custom-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unactioned ({unactionedCount})
          </button>
          <button
            onClick={() => setActiveTab('actioned')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              activeTab === 'actioned'
                ? 'bg-custom-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Actioned ({actionedCount})
          </button>
        </div>

        {/* Feedback Cards */}
        <InfiniteScroll
          dataLength={feedback.length}
          next={loadMoreFeedback}
          hasMore={hasMore}
          loader={null} // Remove the "Loading..." text
        >
          <div className="space-y-3">
            {feedback
              .filter((fb) => (activeTab === 'unactioned' ? !fb.is_actioned : fb.is_actioned))
              .map((fb) => (
                <FeedbackCard
                  key={fb.id}
                  fb={fb}
                  onDelete={handleDelete}
                  onToggleAction={toggleActionedStatus}
                />
              ))}
          </div>
        </InfiniteScroll>

        {/* Toast Notifications */}
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </DashboardFrame>
  );
};

// FeedbackCard Component
const FeedbackCard = ({ fb, onDelete, onToggleAction }) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const calculateAverageRating = (questions) => {
    if (!questions || questions.length === 0) return 0; // Handle empty questions
    const sum = questions.reduce((acc, q) => acc + q.rating, 0);
    return (sum / questions.length).toFixed(1);
  };

  const handleDelete = () => {
    onDelete(fb.id);
    setShowDeleteConfirmation(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl border border-gray-100">
      {/* Header Section */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900">Table {fb.table_number}</h3>
            {fb.is_actioned && (
              <span className="bg-green-100 text-custom-green text-xs px-2 py-1 rounded-full font-medium">
                Actioned
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {new Date(fb.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleAction(fb.id, fb.is_actioned)}
            className={`
              inline-flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm
              transition-colors duration-200
              ${fb.is_actioned
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-custom-green text-white hover:bg-custom-green-hover'}
            `}
          >
            {fb.is_actioned ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {fb.is_actioned ? 'Mark Unactioned' : 'Mark Actioned'}
          </button>

          {/* Delete Button with Confirmation Tooltip */}
          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirmation(!showDeleteConfirmation)}
              className="p-2 text-gray-400 hover:text-custom-red rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {showDeleteConfirmation && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                <p className="text-sm text-gray-600 font-medium">Are you sure you want to delete this feedback?</p>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowDeleteConfirmation(false)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-custom-red hover:bg-red-600 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Section */}
      <div className="mt-6 flex items-center gap-6">
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
          <p className="text-sm text-gray-600 font-medium">Average Rating</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {calculateAverageRating(fb.questions)}
            </span>
            <Star className="w-5 h-5 text-custom-yellow fill-custom-yellow" />
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-900 mb-3">Feedback Details</h4>
        <div className="space-y-3">
          {fb.questions && fb.questions.length > 0 ? (
            fb.questions.map((question, index) => (
              <div
                key={question.question_id}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex justify-between items-start gap-4">
                  <p className="text-sm text-gray-600 flex-1">
                    <span className="font-medium text-gray-900">{question.question_text}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{question.rating}</span>
                    <Star className="w-4 h-4 text-custom-yellow fill-custom-yellow" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No questions available.</p>
          )}
        </div>
      </div>

      {/* Additional Feedback Section */}
      {fb.additional_feedback && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 mb-3">Additional Comments</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 italic">"{fb.additional_feedback}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesPage;