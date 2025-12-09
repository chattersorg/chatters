const https = require('https');
const crypto = require('crypto');

const API_URL = 'https://xjznwqvwlooarskroogf.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqem53cXZ3bG9vYXJza3Jvb2dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwODgwNCwiZXhwIjoyMDY2NTg0ODA0fQ.7EZdFEIzOTQm12SLq2YOQjfBR5vhiKzacUJfEiAsCEU';

const request = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : null);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate resolution time in minutes (weighted towards 7-10 minute average)
const getResolutionTimeMinutes = () => {
  // Use normal distribution centered around 8.5 minutes
  // 40% 5-7 minutes
  // 40% 7-10 minutes
  // 15% 10-15 minutes
  // 5% 15-30 minutes
  const rand = Math.random();

  if (rand < 0.40) {
    // 5-7 minutes
    return Math.floor(Math.random() * 3) + 5;
  } else if (rand < 0.80) {
    // 7-10 minutes
    return Math.floor(Math.random() * 4) + 7;
  } else if (rand < 0.95) {
    // 10-15 minutes
    return Math.floor(Math.random() * 6) + 10;
  } else {
    // 15-30 minutes
    return Math.floor(Math.random() * 16) + 15;
  }
};

const resolutionTypes = [
  'staff_resolved',
  'positive_feedback_cleared',
  'dismissed'
];

const resolutionNotes = {
  'staff_resolved': [
    'Issue resolved to customer satisfaction',
    'Addressed immediately with customer',
    'Corrected the issue and apologized',
    'Provided replacement/alternative',
    'Manager spoke with customer directly',
    'Issue fixed, customer happy',
    'Resolved on the spot',
    'Spoke with customer at their table',
    'Addressed concern face-to-face',
    'Manager visited table to discuss',
    'Handled personally with customer',
    'Direct conversation with guest'
  ],
  'positive_feedback_cleared': [
    'Positive feedback - no action required',
    'Acknowledged and thanked customer',
    'Feedback noted for team',
    'Great to hear!',
    'Passed compliments to team',
    'Team appreciated the feedback',
    'Noted and shared with staff'
  ],
  'dismissed': [
    'Duplicate entry',
    'Not actionable',
    'Already addressed',
    'No response needed',
    'Cleared after review'
  ]
};

const updateFeedbackResolutions = async () => {
  try {
    console.log('Fetching venues and staff...\n');
    const venues = await request('GET', '/rest/v1/venues?select=id,name');

    for (const venue of venues) {
      console.log(`=== ${venue.name} ===`);

      // Get employees for this venue
      const employees = await request('GET',
        `/rest/v1/employees?select=id,first_name,last_name&venue_id=eq.${venue.id}`
      );

      if (employees.length === 0) {
        console.log('  No employees found, skipping...\n');
        continue;
      }

      console.log(`  Employees: ${employees.length}`);

      // Get all feedback for last 30 days that needs resolution data
      const startDate = new Date('2025-11-10');
      const endDate = new Date('2025-12-10'); // End date exclusive

      // Fetch ALL feedback (no limit) - need to add headers for unlimited response
      const allFeedback = [];
      let offset = 0;
      const limit = 1000;

      while (true) {
        const batch = await request('GET',
          `/rest/v1/feedback?select=id,timestamp,sentiment,is_actioned,resolved_at&venue_id=eq.${venue.id}&timestamp=gte.${startDate.toISOString()}&timestamp=lt.${endDate.toISOString()}&order=timestamp.asc&limit=${limit}&offset=${offset}`
        );

        allFeedback.push(...batch);

        if (batch.length < limit) break; // No more data
        offset += limit;
      }

      const feedback = allFeedback;

      console.log(`  Total feedback entries: ${feedback.length}`);

      // Categorize feedback
      let toResolve = [];

      feedback.forEach(f => {
        // Skip if already resolved
        if (f.resolved_at) return;

        // Skip positive feedback without action needed (80% of positive)
        if (f.sentiment === 'positive' && Math.random() > 0.2) return;

        // For negative and assistance - resolve 85%
        if ((f.sentiment === 'negative' || f.sentiment === 'assistance') && Math.random() < 0.85) {
          toResolve.push(f);
        }

        // For neutral - resolve 50%
        if (f.sentiment === 'neutral' && Math.random() < 0.50) {
          toResolve.push(f);
        }

        // For positive - resolve 20% (those that got through the filter)
        if (f.sentiment === 'positive') {
          toResolve.push(f);
        }
      });

      console.log(`  Feedback to resolve: ${toResolve.length}`);

      // Update feedback in batches
      const updates = [];

      for (const f of toResolve) {
        const resolutionMinutes = getResolutionTimeMinutes();
        const resolvedAt = new Date(f.timestamp);
        resolvedAt.setMinutes(resolvedAt.getMinutes() + resolutionMinutes);

        // Pick resolution type based on sentiment
        let resolutionType;
        if (f.sentiment === 'positive') {
          resolutionType = 'positive_feedback_cleared';
        } else if (f.sentiment === 'assistance') {
          resolutionType = 'staff_resolved';
        } else if (f.sentiment === 'negative') {
          const rand = Math.random();
          if (rand < 0.85) resolutionType = 'staff_resolved';
          else resolutionType = 'dismissed'; // Some negative feedback dismissed as not actionable
        } else {
          // neutral
          const rand = Math.random();
          if (rand < 0.75) resolutionType = 'staff_resolved';
          else resolutionType = 'positive_feedback_cleared';
        }

        const resolvedBy = getRandomItem(employees).id;
        const notes = getRandomItem(resolutionNotes[resolutionType]);

        // 20% chance of co-resolver for staff_resolved items
        let coResolverId = null;
        if (resolutionType === 'staff_resolved' && Math.random() < 0.2) {
          const otherEmployees = employees.filter(e => e.id !== resolvedBy);
          if (otherEmployees.length > 0) {
            coResolverId = getRandomItem(otherEmployees).id;
          }
        }

        updates.push({
          id: f.id,
          is_actioned: true,
          resolved_at: resolvedAt.toISOString(),
          resolved_by: resolvedBy,
          resolution_type: resolutionType,
          resolution_notes: notes,
          co_resolver_id: coResolverId
        });
      }

      // Update in batches of 500
      if (updates.length > 0) {
        console.log(`  Updating ${updates.length} feedback entries...`);

        for (let i = 0; i < updates.length; i += 500) {
          const batch = updates.slice(i, i + 500);

          // Update each item individually since batch PATCH isn't well supported
          for (const update of batch) {
            await request('PATCH', `/rest/v1/feedback?id=eq.${update.id}`, {
              is_actioned: update.is_actioned,
              resolved_at: update.resolved_at,
              resolved_by: update.resolved_by,
              resolution_type: update.resolution_type,
              resolution_notes: update.resolution_notes,
              co_resolver_id: update.co_resolver_id
            });
          }

          const batchNum = Math.floor(i/500) + 1;
          const totalBatches = Math.ceil(updates.length/500);
          console.log(`    Batch ${batchNum}/${totalBatches} updated`);
        }

        console.log(`  ✓ Complete!\n`);
      } else {
        console.log(`  No updates needed\n`);
      }
    }

    console.log('\n✓ Feedback resolution updates complete!');

    // Print summary stats
    console.log('\n=== SUMMARY ===');
    for (const venue of venues) {
      const resolved = await request('GET',
        `/rest/v1/feedback?select=id,resolution_type&venue_id=eq.${venue.id}&resolved_at=not.is.null`
      );

      const byType = {};
      resolved.forEach(f => {
        byType[f.resolution_type] = (byType[f.resolution_type] || 0) + 1;
      });

      console.log(`\n${venue.name}:`);
      console.log(`  Total resolved: ${resolved.length}`);
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
};

updateFeedbackResolutions();
