import React, { useState, useEffect } from 'react';
import { useVenue } from '../../context/VenueContext';
import { supabase } from '../../utils/supabase';
import usePageTitle from '../../hooks/usePageTitle';
import { Tag, ChevronDown, ChevronUp, Archive } from 'lucide-react';
import FilterSelect from '../../components/ui/FilterSelect';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const ReportsFollowUpTags = () => {
  usePageTitle('Follow-up Tags Report');
  const { venueId } = useVenue();

  const [loading, setLoading] = useState(true);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [inactiveQuestions, setInactiveQuestions] = useState([]);
  const [tagData, setTagData] = useState({});
  const [dateRange, setDateRange] = useState('30');
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    loadData();
  }, [venueId, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch all questions for this venue
      const { data: allQuestionsData, error: allQuestionsError } = await supabase
        .from('questions')
        .select('id, question, active, conditional_tags')
        .eq('venue_id', venueId);

      if (allQuestionsError) throw allQuestionsError;

      // Get question IDs for this venue to filter tag responses
      const venueQuestionIds = (allQuestionsData || []).map(q => q.id);

      // Fetch tag responses only for this venue's questions
      const { data: allTagResponses, error: allTagError } = await supabase
        .from('feedback_tag_responses')
        .select('question_id, tag, created_at')
        .in('question_id', venueQuestionIds.length > 0 ? venueQuestionIds : [-1])
        .gte('created_at', startDate.toISOString());

      if (allTagError) throw allTagError;

      // Get unique question IDs that have tag responses
      const questionIdsWithResponses = [...new Set((allTagResponses || []).map(r => r.question_id))];

      // Filter to questions that either have tags configured OR have tag responses
      const questionsWithTags = (allQuestionsData || []).filter(q =>
        (q.conditional_tags?.enabled && q.conditional_tags?.tags?.length > 0) ||
        questionIdsWithResponses.includes(q.id)
      );

      // Separate active and inactive questions
      const active = questionsWithTags.filter(q => q.active);
      const inactive = questionsWithTags.filter(q => !q.active);

      setActiveQuestions(active);
      setInactiveQuestions(inactive);

      // Tag responses are already filtered by venue question IDs
      const tagResponses = allTagResponses || [];

      // Group tag responses by question and count each tag
      const tagDataByQuestion = {};

      questionsWithTags.forEach(q => {
        const questionTags = q.conditional_tags?.tags || [];
        tagDataByQuestion[q.id] = {
          question: q.question,
          threshold: q.conditional_tags?.threshold || 3,
          tags: questionTags.reduce((acc, tag) => {
            acc[tag] = 0;
            return acc;
          }, {}),
          totalResponses: 0
        };
      });

      // Count tag responses, including tags that might not be in the current config
      tagResponses.forEach(response => {
        const questionId = response.question_id;
        if (tagDataByQuestion[questionId]) {
          // Add tag if it doesn't exist in the config (e.g., was removed)
          if (tagDataByQuestion[questionId].tags[response.tag] === undefined) {
            tagDataByQuestion[questionId].tags[response.tag] = 0;
          }
          tagDataByQuestion[questionId].tags[response.tag]++;
          tagDataByQuestion[questionId].totalResponses++;
        }
      });

      console.log('Venue ID:', venueId);
      console.log('Venue question IDs:', venueQuestionIds);
      console.log('All tag responses fetched:', allTagResponses);
      console.log('Tag responses after filter:', tagResponses);
      console.log('Tag data by question:', tagDataByQuestion);
      console.log('Questions with tags:', questionsWithTags);

      setTagData(tagDataByQuestion);
    } catch (error) {
      console.error('Error loading tag data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const getChartData = (questionId) => {
    const data = tagData[questionId];
    if (!data) return [];

    return Object.entries(data.tags)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: data.totalResponses > 0
          ? Math.round((count / data.totalResponses) * 100)
          : 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getBarColor = (index) => {
    const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];
    return colors[index % colors.length];
  };

  const renderQuestionCard = (question, isActive = true) => {
    const data = tagData[question.id];
    const chartData = getChartData(question.id);
    const isExpanded = expandedQuestions[question.id];
    const totalResponses = data?.totalResponses || 0;

    return (
      <div
        key={question.id}
        className={`bg-white dark:bg-gray-900 border rounded-lg overflow-hidden ${
          isActive
            ? 'border-gray-200 dark:border-gray-800'
            : 'border-gray-200 dark:border-gray-800 opacity-75'
        }`}
      >
        <button
          onClick={() => toggleQuestion(question.id)}
          className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isActive
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Tag className={`w-5 h-5 ${
                  isActive
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {question.question}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Tags shown for ratings below {data?.threshold || question.conditional_tags?.threshold} stars
                  {!isActive && <span className="ml-2 text-gray-400">(Archived)</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {totalResponses}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  tag selections
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-800">
            {chartData.length > 0 && totalResponses > 0 ? (
              <div className="mt-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 8, right: 8, bottom: 8, left: 120 }}
                    >
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        stroke="#64748B"
                        fontSize={12}
                        tick={{ fill: '#64748B' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="tag"
                        stroke="#64748B"
                        fontSize={12}
                        tick={{ fill: '#64748B' }}
                        width={110}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 'bold',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                        cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                        formatter={(value, name, props) => [
                          `${value} selections (${props.payload.percentage}%)`,
                          props.payload.tag
                        ]}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tag breakdown table */}
                <div className="mt-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tag
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Selections
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((item, index) => (
                        <tr key={item.tag} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getBarColor(index) }}
                              />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.tag}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-sm text-gray-600 dark:text-gray-400">
                            {item.count}
                          </td>
                          <td className="py-3 px-3 text-right text-sm text-gray-600 dark:text-gray-400">
                            {item.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="mt-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <Tag className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No tag selections recorded yet</p>
                <p className="text-xs mt-1 opacity-75">
                  Tags will appear here when customers rate below {data?.threshold || question.conditional_tags?.threshold} stars
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!venueId) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const hasAnyData = activeQuestions.length > 0 || inactiveQuestions.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Follow-up Tags</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            See which tags customers select when rating below the threshold
          </p>
        </div>
        <FilterSelect
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          options={[
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' },
            { value: '365', label: 'Last year' }
          ]}
        />
      </div>

      {!hasAnyData ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Follow-up Tags Configured
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Configure follow-up tags on your feedback questions to start collecting additional context when customers give low ratings.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Questions */}
          {activeQuestions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Active Questions ({activeQuestions.length})
              </h2>
              {activeQuestions.map(q => renderQuestionCard(q, true))}
            </div>
          )}

          {/* Inactive Questions */}
          {inactiveQuestions.length > 0 && (
            <div className="space-y-4">
              <button
                onClick={() => setShowInactive(!showInactive)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Archive className="w-4 h-4" />
                <span>Archived Questions ({inactiveQuestions.length})</span>
                {showInactive ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showInactive && (
                <div className="space-y-4">
                  {inactiveQuestions.map(q => renderQuestionCard(q, false))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsFollowUpTags;
