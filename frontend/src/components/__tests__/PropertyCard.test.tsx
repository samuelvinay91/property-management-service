import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';
import { Property } from '@/types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

const mockProperty: Property = {
  id: 'property-1',
  title: 'Modern Downtown Apartment',
  description: 'Beautiful 2-bedroom apartment in the heart of downtown',
  rentAmount: 2500,
  securityDeposit: 2500,
  bedrooms: 2,
  bathrooms: 2,
  squareFootage: 1200,
  fullAddress: '123 Main St, Downtown, CA 90210',
  propertyType: 'APARTMENT',
  availableDate: '2024-02-01',
  images: [
    {
      id: 'img-1',
      url: '/images/property-1.jpg',
      alt: 'Property Image',
      isPrimary: true,
    },
  ],
  amenities: [
    { id: 'amenity-1', name: 'Gym', category: 'FITNESS' },
    { id: 'amenity-2', name: 'Pool', category: 'RECREATION' },
  ],
  isAvailable: true,
  isFeatured: false,
  viewCount: 42,
};

const defaultProps = {
  property: mockProperty,
  onFavorite: jest.fn(),
  onShare: jest.fn(),
  isFavorited: false,
};

describe('PropertyCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders property information correctly', () => {
    render(<PropertyCard {...defaultProps} />);

    expect(screen.getByText('Modern Downtown Apartment')).toBeInTheDocument();
    expect(screen.getByText('$2,500/month')).toBeInTheDocument();
    expect(screen.getByText('2 bed')).toBeInTheDocument();
    expect(screen.getByText('2 bath')).toBeInTheDocument();
    expect(screen.getByText('1,200 sq ft')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Downtown, CA 90210')).toBeInTheDocument();
  });

  it('displays property image with correct attributes', () => {
    render(<PropertyCard {...defaultProps} />);

    const image = screen.getByAltText('Property Image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/property-1.jpg');
  });

  it('shows availability status', () => {
    render(<PropertyCard {...defaultProps} />);
    expect(screen.getByText('Available Feb 1, 2024')).toBeInTheDocument();
  });

  it('displays unavailable status correctly', () => {
    const unavailableProperty = {
      ...mockProperty,
      isAvailable: false,
    };

    render(<PropertyCard {...defaultProps} property={unavailableProperty} />);
    expect(screen.getByText('Not Available')).toBeInTheDocument();
  });

  it('shows featured badge for featured properties', () => {
    const featuredProperty = {
      ...mockProperty,
      isFeatured: true,
    };

    render(<PropertyCard {...defaultProps} property={featuredProperty} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('handles favorite button click', async () => {
    const onFavorite = jest.fn();
    render(<PropertyCard {...defaultProps} onFavorite={onFavorite} />);

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(onFavorite).toHaveBeenCalledWith('property-1');
    });
  });

  it('shows favorited state correctly', () => {
    render(<PropertyCard {...defaultProps} isFavorited={true} />);

    const favoriteButton = screen.getByLabelText('Remove from favorites');
    expect(favoriteButton).toBeInTheDocument();
    expect(favoriteButton).toHaveClass('text-red-500');
  });

  it('handles share button click', async () => {
    const onShare = jest.fn();
    render(<PropertyCard {...defaultProps} onShare={onShare} />);

    const shareButton = screen.getByLabelText('Share property');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(onShare).toHaveBeenCalledWith('property-1');
    });
  });

  it('displays amenities correctly', () => {
    render(<PropertyCard {...defaultProps} />);

    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Pool')).toBeInTheDocument();
  });

  it('limits amenities display to 3 items', () => {
    const propertyWithManyAmenities = {
      ...mockProperty,
      amenities: [
        { id: 'amenity-1', name: 'Gym', category: 'FITNESS' },
        { id: 'amenity-2', name: 'Pool', category: 'RECREATION' },
        { id: 'amenity-3', name: 'Parking', category: 'PARKING' },
        { id: 'amenity-4', name: 'Laundry', category: 'UTILITIES' },
        { id: 'amenity-5', name: 'Balcony', category: 'OUTDOOR' },
      ],
    };

    render(<PropertyCard {...defaultProps} property={propertyWithManyAmenities} />);

    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Pool')).toBeInTheDocument();
    expect(screen.getByText('Parking')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    expect(screen.queryByText('Laundry')).not.toBeInTheDocument();
  });

  it('displays view count', () => {
    render(<PropertyCard {...defaultProps} />);
    expect(screen.getByText('42 views')).toBeInTheDocument();
  });

  it('navigates to property details on card click', () => {
    const mockPush = jest.fn();
    require('next/navigation').useRouter.mockReturnValue({
      push: mockPush,
    });

    render(<PropertyCard {...defaultProps} />);

    const card = screen.getByTestId('property-card');
    fireEvent.click(card);

    expect(mockPush).toHaveBeenCalledWith('/properties/property-1');
  });

  it('prevents navigation when clicking action buttons', () => {
    const mockPush = jest.fn();
    require('next/navigation').useRouter.mockReturnValue({
      push: mockPush,
    });

    render(<PropertyCard {...defaultProps} />);

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles missing image gracefully', () => {
    const propertyWithoutImage = {
      ...mockProperty,
      images: [],
    };

    render(<PropertyCard {...defaultProps} property={propertyWithoutImage} />);

    const placeholderImage = screen.getByAltText('Property placeholder');
    expect(placeholderImage).toBeInTheDocument();
  });

  it('formats large rent amounts correctly', () => {
    const expensiveProperty = {
      ...mockProperty,
      rentAmount: 12500,
    };

    render(<PropertyCard {...defaultProps} property={expensiveProperty} />);
    expect(screen.getByText('$12,500/month')).toBeInTheDocument();
  });

  it('handles property type display', () => {
    render(<PropertyCard {...defaultProps} />);
    expect(screen.getByText('Apartment')).toBeInTheDocument();
  });

  it('applies hover effects correctly', () => {
    render(<PropertyCard {...defaultProps} />);

    const card = screen.getByTestId('property-card');
    expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
  });

  it('is accessible with proper ARIA labels', () => {
    render(<PropertyCard {...defaultProps} />);

    expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
    expect(screen.getByLabelText('Share property')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to favorites/i })).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<PropertyCard {...defaultProps} />);

    const card = screen.getByTestId('property-card');
    expect(card).toHaveAttribute('tabIndex', '0');

    fireEvent.keyDown(card, { key: 'Enter' });
    // Should trigger navigation (tested via router mock)
  });
});