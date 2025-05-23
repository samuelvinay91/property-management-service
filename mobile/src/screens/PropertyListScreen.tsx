import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Searchbar, Button, Card, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { SafeArea } from '@/components/ui/SafeArea';
import { Container } from '@/components/ui/Container';
import { theme } from '@/theme';

const { width } = Dimensions.get('window');

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  price: number;
  rentAmount?: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  images: { url: string }[];
  type: string;
  status: string;
  amenities: string[];
}

// Mock data
const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Apartment',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    price: 750000,
    rentAmount: 3500,
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1200,
    images: [{ url: 'https://via.placeholder.com/300x200' }],
    type: 'APARTMENT',
    status: 'AVAILABLE',
    amenities: ['Gym', 'Pool', 'Parking'],
  },
  {
    id: '2',
    title: 'Cozy Suburban House',
    address: '456 Oak Ave',
    city: 'Oakland',
    state: 'CA',
    price: 850000,
    rentAmount: 4200,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1800,
    images: [{ url: 'https://via.placeholder.com/300x200' }],
    type: 'HOUSE',
    status: 'AVAILABLE',
    amenities: ['Garden', 'Garage', 'Pet Friendly'],
  },
];

export default function PropertyListScreen() {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch properties from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'ALL' || property.type === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => router.push(`/property/${item.id}`)}
    >
      <Card style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.images[0]?.url || 'https://via.placeholder.com/300x200' }}
            style={styles.propertyImage}
          />
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Card.Content style={styles.cardContent}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ${item.rentAmount?.toLocaleString() || item.price.toLocaleString()}
              {item.rentAmount && <Text style={styles.priceUnit}>/month</Text>}
            </Text>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          
          <Text style={styles.address} numberOfLines={1}>
            {item.address}, {item.city}, {item.state}
          </Text>

          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.detailText}>{item.bedrooms} bed</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.detailText}>{item.bathrooms} bath</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="expand-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.detailText}>{item.squareFootage} sq ft</Text>
            </View>
          </View>

          <View style={styles.amenities}>
            {item.amenities.slice(0, 3).map((amenity, index) => (
              <Chip key={index} style={styles.amenityChip} textStyle={styles.amenityText}>
                {amenity}
              </Chip>
            ))}
            {item.amenities.length > 3 && (
              <Text style={styles.moreAmenities}>+{item.amenities.length - 3} more</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeArea>
      <Container padding="none">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Properties</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Ionicons name="options-outline" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search properties..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>

        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['ALL', 'APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE']}
            renderItem={({ item }) => (
              <Button
                mode={selectedFilter === item ? 'contained' : 'outlined'}
                onPress={() => setSelectedFilter(item)}
                style={styles.filterButton}
                compact
              >
                {item}
              </Button>
            )}
            contentContainerStyle={styles.filtersList}
          />
        </View>

        <FlatList
          data={filteredProperties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.emptyText}>No properties found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      </Container>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchbar: {
    backgroundColor: theme.colors.surface,
  },
  filtersContainer: {
    paddingVertical: 8,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterButton: {
    marginRight: 8,
  },
  list: {
    padding: 16,
  },
  propertyCard: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
  },
  imageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
  cardContent: {
    padding: 16,
  },
  priceContainer: {
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: 'normal',
    color: theme.colors.onSurfaceVariant,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  amenityChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 12,
  },
  moreAmenities: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});