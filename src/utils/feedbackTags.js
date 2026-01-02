export const QUESTION_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'service', label: 'Service' },
  { value: 'food', label: 'Food' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'atmosphere', label: 'Atmosphere' },
  { value: 'value', label: 'Value' },
  { value: 'cleanliness', label: 'Cleanliness' },
];

export const DEFAULT_FOLLOW_UP_TAGS = {
  general: ['Wait time', 'Quality', 'Staff', 'Cleanliness', 'Other'],
  service: ['Wait time', 'Staff attentiveness', 'Friendliness', 'Order accuracy', 'Helpfulness', 'Other'],
  food: ['Temperature', 'Taste', 'Presentation', 'Portion size', 'Dietary needs', 'Other'],
  drinks: ['Temperature', 'Taste', 'Wait time', 'Incorrect order', 'Value', 'Other'],
  atmosphere: ['Noise level', 'Cleanliness', 'Comfort', 'Temperature', 'Crowded', 'Other'],
  value: ['Too expensive', 'Portion size', 'Quality vs price', 'Charges unclear', 'Expectations not met', 'Other'],
  cleanliness: ['Table', 'Floors', 'Restrooms', 'Overall hygiene', 'Other'],
};

export const getDefaultTagsForCategory = (category) => {
  const tags = DEFAULT_FOLLOW_UP_TAGS[category] || DEFAULT_FOLLOW_UP_TAGS.general;
  const unique = Array.from(new Set(tags.filter(Boolean)));
  return unique.length > 0 ? unique : DEFAULT_FOLLOW_UP_TAGS.general;
};

export const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  if (!unique.includes('Other')) {
    unique.push('Other');
  }
  return unique;
};
