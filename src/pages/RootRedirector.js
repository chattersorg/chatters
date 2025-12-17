export default function RootRedirector() {
  const { session, isLoading } = useSessionContext();
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user) {
        setLoadingRole(false);
        return;
      }

      // Try by ID first, then fall back to email
      let userData = null;

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (data) {
        userData = data;
      } else {
        // Fallback: query by email
        const { data: dataByEmail } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .is('deleted_at', null)
          .single();
        userData = dataByEmail;
      }

      if (userData) setRole(userData.role || null);
      setLoadingRole(false);
    };
    fetchRole();
  }, [session?.user]);

  if (isLoading || loadingRole) {
    return <div className="p-4">Loading...</div>;
  }

  if (role === 'admin') {
    return (
      <AdminFrame>
        <AdminDashboard />
      </AdminFrame>
    );
  }

  return (
    <DashboardFrame>
      <DashboardPage />
    </DashboardFrame>
  );
}
