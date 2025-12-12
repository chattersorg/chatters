// /pages/admin/TestDashboardPage.jsx
import React from 'react';
import UpdatedDashboardFrame from '../../components/dashboard/layout/UpdatedDashboardFrame';
import { useVenue } from '../../context/VenueContext';

const TestDashboardPage = () => {
  const { venueId, venueName } = useVenue();

  return (
    <UpdatedDashboardFrame>
      <div>
        <h1 className="text-2xl font-bold mb-4">Test Dashboard Page</h1>

        <div className="space-y-2 text-muted-foreground">
          <p><strong>Venue Name:</strong> {venueName || 'No venue selected'}</p>
          <p><strong>Venue ID:</strong> {venueId || 'N/A'}</p>
        </div>
      </div>
    </UpdatedDashboardFrame>
  );
};

export default TestDashboardPage;