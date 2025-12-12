import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/dashboard/layout/PageContainer';

export default function LocationsPage() {
  const [venues, setVenues] = useState([]);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueEmail, setNewVenueEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVenues = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      setUserId(user.id);

      const { data: userRow } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single();

      if (!userRow) return;

      setAccountId(userRow.account_id);

      const { data: venuesData } = await supabase
        .from('venues')
        .select('*')
        .eq('account_id', userRow.account_id)
        .order('created_at', { ascending: false });

      setVenues(venuesData || []);
    };

    fetchVenues();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newVenueName || !accountId || !userId) return;

    setLoading(true);

    const { data: venueData, error: venueError } = await supabase
      .from('venues')
      .insert([
        {
          name: newVenueName,
          email: newVenueEmail || null,
          account_id: accountId,
          logo: null,
          address: {},
          primary_color: '#000000',
          secondary_color: '#ffffff',
          tripadvisor_link: '',
          google_review_link: '',
        },
      ])
      .select()
      .single();

    if (venueError || !venueData) {
      console.error('Venue creation error:', venueError);
      setLoading(false);
      return;
    }

    const { error: staffError } = await supabase.from('staff').insert([
      {
        first_name: 'Unnamed',
        last_name: 'Manager',
        user_id: userId,
        venue_id: venueData.id,
        role: 'manager',
      },
    ]);

    if (staffError) {
      console.error('Staff creation error:', staffError);
    }

    setNewVenueName('');
    setNewVenueEmail('');

    const { data: updatedVenues } = await supabase
      .from('venues')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    setVenues(updatedVenues || []);
    setLoading(false);
  };

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-6">Locations</h1>

      <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Add New Location</h2>
        <div>
          <label className="block text-sm font-medium">Venue Name</label>
          <input
            type="text"
            value={newVenueName}
            onChange={(e) => setNewVenueName(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email (optional)</label>
          <input
            type="email"
            value={newVenueEmail}
            onChange={(e) => setNewVenueEmail(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-custom-blue-hover"
        >
          {loading ? 'Creating...' : 'Create Location'}
        </button>
      </form>

      <div className="grid gap-4">
        {venues.map((venue) => (
          <div key={venue.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <div className="font-medium text-lg">{venue.name}</div>
              <div className="text-sm text-gray-500">
                Created: {new Date(venue.created_at).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => console.log('Manage venue:', venue.id)}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
            >
              Manage
            </button>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}