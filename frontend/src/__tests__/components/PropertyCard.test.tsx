import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { PropertyCard } from '@/components/PropertyCard';
import { Property } from '@/types';

const mockProperty: Property = {
  id: '1',
  title: 'Modern Downtown Apartment',
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94102',
  bedrooms: 2,
  bathrooms: 2,
  squareFootage: 1200,
  rentAmount: 3500,
  images: [
    { id: '1', url: 'https://example.com/image1.jpg', alt: 'Property image' }
  ],
  amenities: [
    { id: '1', name: 'Gym' },
    { id: '2', name: 'Pool' },
    { id: '3', name: 'Parking' }
  ],
  status: 'AVAILABLE',
  type: 'APARTMENT',
  owner: {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  }
};

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

describe('PropertyCard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders property information correctly', () => {
    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={mockProperty} />
      </MockedProvider>
    );

    expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, San Francisco, CA 94102')).toBeInTheDocument();
    expect(screen.getByText('$3,500/month')).toBeInTheDocument();
    expect(screen.getByText('2 bed')).toBeInTheDocument();
    expect(screen.getByText('2 bath')).toBeInTheDocument();
    expect(screen.getByText('1,200 sq ft')).toBeInTheDocument();
  });

  it('displays amenities', () => {
    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={mockProperty} />
      </MockedProvider>
    );

    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Pool')).toBeInTheDocument();
    expect(screen.getByText('Parking')).toBeInTheDocument();
  });

  it('shows property image', () => {
    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={mockProperty} />
      </MockedProvider>
    );

    const image = screen.getByAltText('Modern Downtown Apartment');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('image1.jpg'));
  });

  it('navigates to property detail when clicked', () => {
    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={mockProperty} />
      </MockedProvider>
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockRouter.push).toHaveBeenCalledWith('/properties/1');
  });

  it('handles favorite toggle', async () => {
    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={mockProperty} />
      </MockedProvider>
    );

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
    });
  });

  it('displays correct status badge', () => {
    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={mockProperty} />
      </MockedProvider>
    );

    expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
  });

  it('shows owner information', () => {
    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={mockProperty} />
      </MockedProvider>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles missing image gracefully', () => {
    const propertyWithoutImage = {
      ...mockProperty,
      images: []
    };

    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={propertyWithoutImage} />
      </MockedProvider>
    );

    // Should show placeholder or default image
    const image = screen.getByAltText('Modern Downtown Apartment');
    expect(image).toBeInTheDocument();
  });

  it('displays correct property type', () => {
    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={mockProperty} />
      </MockedProvider>
    );

    expect(screen.getByText('APARTMENT')).toBeInTheDocument();
  });

  it('shows contact owner button', () => {
    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={mockProperty} />
      </MockedProvider>
    );

    expect(screen.getByText('Contact Owner')).toBeInTheDocument();
  });

  it('handles share functionality', () => {
    render(
      <MockedProvider mocks={[]}>
        <PropertyCard property={mockProperty} />
      </MockedProvider>
    );

    const shareButton = screen.getByLabelText('Share property');
    fireEvent.click(shareButton);

    // Should trigger share functionality
    // This would typically open a share modal or copy link to clipboard
  });

  describe('responsive design', () => {
    it('adapts to mobile view', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <MockedProvider mocks={[]}>
          <PropertyCard property={mockProperty} />
        </MockedProvider>
      );

      // Card should still render properly on mobile
      expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <MockedProvider mocks={[]}>
          <PropertyCard property={mockProperty} />
        </MockedProvider>
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', expect.stringContaining('property'));
      expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
      expect(screen.getByLabelText('Share property')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <MockedProvider mocks={[]}>
          <PropertyCard property={mockProperty} />
        </MockedProvider>
      );

      const card = screen.getByRole('button');
      card.focus();
      
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
      expect(mockRouter.push).toHaveBeenCalledWith('/properties/1');

      fireEvent.keyDown(card, { key: ' ', code: 'Space' });
      expect(mockRouter.push).toHaveBeenCalledTimes(2);
    });
  });
});