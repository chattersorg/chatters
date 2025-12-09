const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  'https://xjznwqvwlooarskroogf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqem53cXZ3bG9vYXJza3Jvb2dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwODgwNCwiZXhwIjoyMDY2NTg0ODA0fQ.7EZdFEIzOTQm12SLq2YOQjfBR5vhiKzacUJfEiAsCEU'
);

// Venue configurations
const venues = {
  'ba9c45d4-3947-4560-9327-7f00c695d177': { // The Fox
    name: 'The Fox',
    questions: [51, 54, 52, 53],
    employees: [
      'ad06e7f4-e412-4058-9138-2ddbd803538c', '6ab430f5-2d44-4326-af9b-4c68fa1a5559',
      '0c0b3c12-b6c6-4035-9ce6-a2bd5c0fe47e', '422ea33f-b999-460e-8999-bc3009409ecb',
      'fa0b5fbc-3388-4c11-8ce0-c4c89513e716', 'a1d264a3-80ab-45cf-acb6-68b43de3b131',
      '0791b9c6-ade5-48a8-8318-a0c1db24bd93', '3f6932fc-d1d2-4fe0-99b9-ffc561c1bb40',
      '6dcec251-c046-4d12-a11f-be4604daf3fc', '6ba01faa-d812-4f82-a5fa-e385c5f88924',
      '6b3247d6-f5d9-436a-984e-0bd94aa0caef', 'cc1f052e-58fe-499d-bd15-25e3f5e14dba',
      '714c96a5-7277-4e7d-a53f-8a56e2f1d2ac', '7a036447-cd22-4e4b-8ed1-8ae8466a0c83'
    ]
  },
  'd877bd0b-6522-409f-9192-ca996e1a7f48': { // Lions Head
    name: 'Lions Head Pub',
    questions: [60, 61, 62, 55],
    employees: [
      '23e47920-59f1-47f6-9b66-49d1f1036aac', '362ca4ef-8bbb-4474-8dea-312b56479d66',
      'ce1be31c-f468-4ffe-9a1e-3638cacb4458', '7fc74d21-72d5-4cc4-9391-284355875337',
      'd117dc8a-4776-4706-93bb-c06e67c3a9bd', '6ea546dd-14c3-4e17-8408-aafce086392b',
      '0660bae1-9b59-4ed8-824f-ab2aea88754b', 'c74a9901-78a8-4785-8281-cf101f927621',
      'db1ed2fa-fb4d-4e26-b5c2-d3d76a153d9f', '59f09b12-0b51-4e46-8fef-fc5eb612b1de',
      'ad9e4d7b-3593-4d7a-94c4-e57065b21d24', 'a31e0827-b175-4c7c-9ec6-6d1c22274045',
      '9765a80d-36b4-4169-b165-9d154595f4a7', '3146decd-27a2-4431-a0cc-7c9d2e9901e9'
    ]
  },
  'd7683570-11ac-4007-ba95-dcdb4ef6c101': { // Dunn Inn
    name: 'The Dunn Inn',
    questions: [56, 69, 66, 68],
    employees: [
      '14901106-ac5f-49f6-97ec-b7e281a149fa', 'd61cf462-3504-4915-9a61-204c7e56daee',
      'e6da79e4-767a-4018-bec5-97dacbf20b15', '8dd0564d-bd68-44b3-8028-907d6c6a9f4a',
      '270dcdba-c247-4426-9925-4db7afddc190', 'b477ae52-206f-4f43-9845-b059b9cee7b6',
      '1842db5f-2937-4e6a-8ee0-56556b5d324f', '7a86460b-0de1-4e21-bebd-dea5c26a6cc9',
      '178e5239-9290-41f1-97a8-20c82f927953', '29c985ee-11bc-44a8-b9a5-88a50cf334f5',
      'b7845d99-634f-4f64-8605-248772a2acc7', '2575a81b-f8b8-4416-a64f-d8f91fc57019',
      '39bbe026-40cd-436f-ba29-a21774046786', 'b5af9b76-f58e-4f33-90fe-58f37baf1bcb'
    ]
  }
};

// Feedback comments for different sentiments
const positiveComments = [
  'Excellent service, very attentive staff!',
  'Really enjoyed the atmosphere here',
  'Food was delicious, will definitely return',
  'Staff were friendly and professional',
  'Great experience overall',
  'Lovely venue, highly recommend',
  'Perfect for a night out',
  'Amazing cocktails and great service',
  'The team here are fantastic',
  'Best pub in the area!',
  'Really impressed with the quality',
  'Wonderful evening, thank you!',
  'Staff made us feel very welcome',
  'Great food and even better service',
  'Will be coming back soon!',
  null, null, null, null, null
];

const neutralComments = [
  'Service was okay',
  'Decent experience',
  'Food was average',
  'Nothing special but not bad',
  'Could be better',
  null, null, null
];

const negativeComments = [
  'Had to wait too long for drinks',
  'Staff seemed distracted',
  'Food took a while to arrive',
  'Could improve the service speed',
  'Table was not cleaned properly',
  'Music was too loud',
  null
];

const assistanceMessages = [
  'Could we get some more water please?',
  'Need the bill when you get a chance',
  'Can we order more drinks?',
  'Need some extra napkins',
  'Could we have the dessert menu?',
  'Can we move to a different table?',
  'Need help with menu choices',
  'Can we get some condiments please?',
  'Ready to order',
  'Need assistance with allergy information',
  'Could use some more cutlery',
  'Want to add to our order'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRating() {
  const rand = Math.random();
  if (rand < 0.02) return 1;
  if (rand < 0.05) return 2;
  if (rand < 0.20) return 3;
  if (rand < 0.65) return 4;
  return 5;
}

function getSentiment(rating) {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

function getComment(rating) {
  if (rating >= 4) return randomChoice(positiveComments);
  if (rating === 3) return randomChoice(neutralComments);
  return randomChoice(negativeComments);
}

function generateBusinessTime(date) {
  const hour = randomInt(11, 22);
  const minute = randomInt(0, 59);
  const second = randomInt(0, 59);
  const newDate = new Date(date);
  newDate.setHours(hour, minute, second, 0);
  return newDate;
}

async function generateDemoData() {
  console.log('Starting demo data generation...\n');

  const today = new Date('2025-12-09T23:59:59');
  const startDate = new Date('2025-11-09T00:00:00');

  let totalFeedback = 0;
  let totalAssistance = 0;

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    const dateStr = currentDate.toISOString().split('T')[0];

    console.log('Processing ' + dateStr + '...');

    for (const [venueId, config] of Object.entries(venues)) {
      const sessionsPerDay = randomInt(45, 50);
      const feedbackRecords = [];

      for (let s = 0; s < sessionsPerDay; s++) {
        const sessionId = uuidv4();
        const sessionTime = generateBusinessTime(currentDate);
        const tableNumber = randomInt(1, 25);

        const questionsToAnswer = Math.random() > 0.1 ? config.questions : config.questions.slice(0, randomInt(2, config.questions.length));

        for (const questionId of questionsToAnswer) {
          const rating = generateRating();
          const sentiment = getSentiment(rating);

          const shouldResolve = Math.random() < 0.95;
          const isNegative = rating <= 2;

          let resolved_at = null;
          let resolved_by = null;
          let co_resolver_id = null;
          let resolution_type = null;
          let is_actioned = false;

          if (shouldResolve) {
            is_actioned = true;
            const resolutionMinutes = randomInt(3, 15);
            resolved_at = new Date(sessionTime.getTime() + resolutionMinutes * 60 * 1000);
            resolved_by = randomChoice(config.employees);

            if (Math.random() < 0.2) {
              const otherEmployees = config.employees.filter(e => e !== resolved_by);
              co_resolver_id = randomChoice(otherEmployees);
            }

            if (isNegative) {
              resolution_type = 'staff_resolved';
            } else if (rating >= 4) {
              resolution_type = 'positive_feedback_cleared';
            } else {
              resolution_type = Math.random() > 0.5 ? 'staff_resolved' : 'dismissed';
            }
          }

          feedbackRecords.push({
            question_id: questionId,
            venue_id: venueId,
            session_id: sessionId,
            rating: rating,
            sentiment: sentiment,
            additional_feedback: getComment(rating),
            table_number: tableNumber,
            timestamp: sessionTime.toISOString(),
            created_at: sessionTime.toISOString(),
            is_actioned: is_actioned,
            resolved_at: resolved_at ? resolved_at.toISOString() : null,
            resolved_by: resolved_by,
            co_resolver_id: co_resolver_id,
            resolution_type: resolution_type,
            dismissed: resolution_type === 'dismissed',
            dismissed_at: resolution_type === 'dismissed' ? resolved_at.toISOString() : null
          });
        }
      }

      const batchSize = 500;
      for (let i = 0; i < feedbackRecords.length; i += batchSize) {
        const batch = feedbackRecords.slice(i, i + batchSize);
        const { error } = await supabase.from('feedback').insert(batch);
        if (error) {
          console.error('Error inserting feedback batch for ' + config.name + ':', error.message);
        }
      }
      totalFeedback += feedbackRecords.length;

      const assistancePerDay = randomInt(5, 10);
      const assistanceRecords = [];

      for (let a = 0; a < assistancePerDay; a++) {
        const requestTime = generateBusinessTime(currentDate);
        const tableNumber = randomInt(1, 25);

        const shouldResolve = Math.random() < 0.95;

        let status = 'pending';
        let acknowledged_at = null;
        let acknowledged_by = null;
        let resolved_at = null;
        let resolved_by = null;

        if (shouldResolve) {
          status = 'resolved';
          const ackMinutes = randomInt(1, 3);
          acknowledged_at = new Date(requestTime.getTime() + ackMinutes * 60 * 1000);
          acknowledged_by = randomChoice(config.employees);

          const resolveMinutes = randomInt(5, 12);
          resolved_at = new Date(requestTime.getTime() + resolveMinutes * 60 * 1000);
          resolved_by = acknowledged_by;
        } else if (Math.random() < 0.5) {
          status = 'acknowledged';
          const ackMinutes = randomInt(1, 3);
          acknowledged_at = new Date(requestTime.getTime() + ackMinutes * 60 * 1000);
          acknowledged_by = randomChoice(config.employees);
        }

        assistanceRecords.push({
          venue_id: venueId,
          table_number: tableNumber,
          message: randomChoice(assistanceMessages),
          status: status,
          created_at: requestTime.toISOString(),
          acknowledged_at: acknowledged_at ? acknowledged_at.toISOString() : null,
          acknowledged_by: acknowledged_by,
          resolved_at: resolved_at ? resolved_at.toISOString() : null,
          resolved_by: resolved_by,
          updated_at: (resolved_at || acknowledged_at || requestTime).toISOString()
        });
      }

      const { error: assistanceError } = await supabase.from('assistance_requests').insert(assistanceRecords);
      if (assistanceError) {
        console.error('Error inserting assistance for ' + config.name + ':', assistanceError.message);
      }
      totalAssistance += assistanceRecords.length;
    }
  }

  console.log('\n=== GENERATION COMPLETE ===');
  console.log('Total feedback records: ' + totalFeedback);
  console.log('Total assistance requests: ' + totalAssistance);
  console.log('Date range: 2025-11-09 to 2025-12-09 (31 days)');
  console.log('Venues: The Fox, Lions Head Pub, The Dunn Inn');
}

generateDemoData().catch(console.error);
