import type { Meta, StoryObj } from '@storybook/react';
import { PropertyCard } from './PropertyCard';

const meta: Meta<typeof PropertyCard> = {
  title: 'Components/PropertyCard',
  component: PropertyCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modern property card component with responsive design and interactive features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onEdit: { action: 'edited' },
    onDelete: { action: 'deleted' },
    onView: { action: 'viewed' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    property: {
      id: '1',
      title: 'Luxury Downtown Apartment',
      description: 'Beautiful 2-bedroom apartment in the heart of downtown with modern amenities and stunning city views.',
      address: '123 Main Street, Downtown, City 12345',
      price: 2500,
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      type: 'apartment',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      ],
      amenities: ['Pool', 'Gym', 'Parking', 'Balcony'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    },
  },
};

export const House: Story = {
  args: {
    property: {
      id: '2',
      title: 'Family House with Garden',
      description: 'Spacious 4-bedroom house perfect for families, featuring a large garden and quiet neighborhood.',
      address: '456 Oak Avenue, Suburbia, City 12346',
      price: 3200,
      bedrooms: 4,
      bathrooms: 3,
      area: 2400,
      type: 'house',
      status: 'available',
      images: [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
      ],
      amenities: ['Garden', 'Garage', 'Fireplace'],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
    },
  },
};

export const Rented: Story = {
  args: {
    property: {
      id: '3',
      title: 'Modern Studio Loft',
      description: 'Contemporary studio loft with high ceilings and industrial design elements.',
      address: '789 Industrial Blvd, Arts District, City 12347',
      price: 1800,
      bedrooms: 0,
      bathrooms: 1,
      area: 650,
      type: 'studio',
      status: 'rented',
      images: [
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop',
      ],
      amenities: ['High Ceilings', 'Exposed Brick', 'Modern Kitchen'],
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-22'),
    },
  },
};

export const Maintenance: Story = {
  args: {
    property: {
      id: '4',
      title: 'Beachfront Condo',
      description: 'Stunning beachfront condominium with panoramic ocean views and resort-style amenities.',
      address: '321 Ocean Drive, Beachfront, City 12348',
      price: 4500,
      bedrooms: 3,
      bathrooms: 2,
      area: 1800,
      type: 'condo',
      status: 'maintenance',
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
      ],
      amenities: ['Ocean View', 'Beach Access', 'Concierge', 'Pool'],
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-25'),
    },
  },
};

export const Loading: Story = {
  args: {
    property: {
      id: '5',
      title: 'Loading...',
      description: 'Loading property details...',
      address: 'Loading address...',
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      type: 'apartment',
      status: 'available',
      images: [],
      amenities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    loading: true,
  },
};

export const Mobile: Story = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};

export const Tablet: Story = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};