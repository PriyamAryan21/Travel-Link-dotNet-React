import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import TripsPage from './features/trips/TripsPage';
import GroupsPage from './features/groups/GroupPage';
import GroupDetailPage from './features/groups/GroupDetailPage';
import TripDetailPage from './features/trips/TripDetailPage';
import ExpensesPage from './features/expenses/ExpensePage';
import GroupExpensePage from './features/expenses/GroupExpensePage';
import UserExpensePage from './features/expenses/UserExpensePage';
import ExpenseDetailPage from './features/expenses/ExpenseDetailPage';
import ItinerariesPage from './features/itinerary/ItinerariesPage';
import TripItineraryPage from './features/itinerary/TripItineraryPage';
import ItineraryResultPage from './features/itinerary/ItineraryResultPage';
import FriendsPage from './features/friends/FriendPage';
import ProfilePage from './features/profile/ProfilePage';
import LocationPage from './features/location/LocationPage';
import OfflineOverlay from './components/layout/OfflineOverlay';

function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/:tripId" element={<TripDetailPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:groupId" element={<GroupDetailPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/expenses/:expenseId" element={<ExpenseDetailPage />} />
            <Route path="/expenses/group/:groupId" element={<GroupExpensePage />} />
            <Route path="/expenses/user/:userId" element={<UserExpensePage />} />
            <Route path="/itineraries" element={<ItinerariesPage />} />
            <Route path="/trips/:tripId/itinerary/:itineraryId" element={<TripItineraryPage />} />
            <Route path="/trips/:tripId/itinerary/:itineraryId/results" element={<ItineraryResultPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/location" element={<LocationPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <OfflineOverlay />
    </ThemeProvider>
  );
}

/* Temporary placeholder — delete when you build real pages */
function PlaceholderPage({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="glass-card" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '3rem' }}>{emoji}</span>
      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '1.75rem',
        color: 'var(--color-text)',
      }}>
        {title}
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        Coming soon — this page is under construction
      </p>
    </div>
  );
}

export default App;
