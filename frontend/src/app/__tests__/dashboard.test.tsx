import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import DashboardPage from '../dashboard/page';
import { GET_DASHBOARD_STATS } from '@/lib/graphql/queries';

// Mock the auth store
const mockAuthStore = {
  user: {
    id: 'user-1',
    email: 'test@propflow.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'PROPERTY_MANAGER',
  },
  isAuthenticated: true,
};

jest.mock('@/store/auth', () => ({
  useAuthStore: () => mockAuthStore,
}));

const mockDashboardData = {
  dashboardStats: {
    totalProperties: 5,
    totalUnits: 25,
    occupiedUnits: 20,
    totalTenants: 20,
    monthlyRevenue: 50000,
    pendingMaintenance: 3,
    upcomingBookings: 7,
    recentActivities: [
      {
        id: 'activity-1',
        type: 'PAYMENT_RECEIVED',
        description: 'Rent payment received for Unit 2B',
        timestamp: '2024-01-15T10:00:00Z',
      },
      {
        id: 'activity-2',
        type: 'MAINTENANCE_REQUEST',
        description: 'New maintenance request for leaky faucet',
        timestamp: '2024-01-14T15:30:00Z',
      },
    ],
  },
};

const mocks = [
  {
    request: {
      query: GET_DASHBOARD_STATS,
    },
    result: {
      data: mockDashboardData,
    },
  },
];

const errorMocks = [
  {
    request: {
      query: GET_DASHBOARD_STATS,
    },
    error: new Error('Failed to fetch dashboard data'),
  },
];

const loadingMocks = [
  {
    request: {
      query: GET_DASHBOARD_STATS,
    },
    delay: Infinity, // Never resolves
  },
];

describe('Dashboard Page', () => {
  it('renders loading state initially', () => {
    render(
      <MockedProvider mocks={loadingMocks}>
        <DashboardPage />
      </MockedProvider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays dashboard stats correctly', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Check stat cards
    expect(screen.getByText('5')).toBeInTheDocument(); // Total Properties
    expect(screen.getByText('20/25')).toBeInTheDocument(); // Unit Occupancy
    expect(screen.getByText('80% occupied')).toBeInTheDocument(); // Occupancy rate
    expect(screen.getByText('20')).toBeInTheDocument(); // Active Tenants
    expect(screen.getByText('$50,000')).toBeInTheDocument(); // Monthly Revenue
    expect(screen.getByText('3')).toBeInTheDocument(); // Pending Maintenance
    expect(screen.getByText('7')).toBeInTheDocument(); // Upcoming Bookings
  });

  it('displays recent activities', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Activities')).toBeInTheDocument();
    });

    expect(screen.getByText('Rent payment received for Unit 2B')).toBeInTheDocument();
    expect(screen.getByText('New maintenance request for leaky faucet')).toBeInTheDocument();
  });

  it('calculates occupancy rate correctly', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      // 20 occupied out of 25 total = 80%
      expect(screen.getByText('80% occupied')).toBeInTheDocument();
    });
  });

  it('displays property performance section', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Property Performance')).toBeInTheDocument();
    });

    expect(screen.getByText('Occupancy Rate')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Avg. Rent')).toBeInTheDocument();
    expect(screen.getByText('Collection Rate')).toBeInTheDocument();
  });

  it('displays quick actions', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    expect(screen.getByText('Add New Property')).toBeInTheDocument();
    expect(screen.getByText('Create Maintenance Request')).toBeInTheDocument();
    expect(screen.getByText('Schedule Inspection')).toBeInTheDocument();
  });

  it('handles error state gracefully', async () => {
    render(
      <MockedProvider mocks={errorMocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch dashboard data')).toBeInTheDocument();
  });

  it('displays welcome message', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(
      screen.getByText("Welcome back! Here's what's happening with your properties.")
    ).toBeInTheDocument();
  });

  it('formats large numbers correctly', async () => {
    const largeNumberMocks = [
      {
        request: {
          query: GET_DASHBOARD_STATS,
        },
        result: {
          data: {
            dashboardStats: {
              ...mockDashboardData.dashboardStats,
              monthlyRevenue: 125000,
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={largeNumberMocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('$125,000')).toBeInTheDocument();
    });
  });

  it('handles zero values correctly', async () => {
    const zeroValueMocks = [
      {
        request: {
          query: GET_DASHBOARD_STATS,
        },
        result: {
          data: {
            dashboardStats: {
              ...mockDashboardData.dashboardStats,
              totalProperties: 0,
              totalUnits: 0,
              occupiedUnits: 0,
              pendingMaintenance: 0,
              recentActivities: [],
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={zeroValueMocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Should handle zero values gracefully
    expect(screen.getByText('0/0')).toBeInTheDocument(); // Unit occupancy
    expect(screen.getByText('No recent activities')).toBeInTheDocument();
  });

  it('displays stat card icons correctly', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Check that icon containers are present
    const statCards = screen.getAllByTestId(/stat-card/);
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('handles activity timestamps correctly', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Activities')).toBeInTheDocument();
    });

    // Check that dates are formatted
    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/1\/14\/2024/)).toBeInTheDocument();
  });

  it('is responsive and accessible', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <DashboardPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Check that main sections have proper headings
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent Activities' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Property Performance' })).toBeInTheDocument();
  });
});