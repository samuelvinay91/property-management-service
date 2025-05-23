import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Card, Surface, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeArea } from '@/components/ui/SafeArea';
import { Container } from '@/components/ui/Container';
import { theme } from '@/theme';

const { width } = Dimensions.get('window');

const quickActions = [
  {
    id: '1',
    title: 'Pay Rent',
    subtitle: 'Quick payment',
    icon: 'card-outline',
    color: '#10B981',
    route: '/payments',
  },
  {
    id: '2',
    title: 'Maintenance',
    subtitle: 'Request service',
    icon: 'construct-outline',
    color: '#F59E0B',
    route: '/maintenance',
  },
  {
    id: '3',
    title: 'Messages',
    subtitle: 'Chat with landlord',
    icon: 'chatbubble-outline',
    color: '#3B82F6',
    route: '/messages',
  },
  {
    id: '4',
    title: 'Documents',
    subtitle: 'View lease & docs',
    icon: 'document-text-outline',
    color: '#8B5CF6',
    route: '/documents',
  },
];

const upcomingItems = [
  {
    id: '1',
    title: 'Rent Payment Due',
    subtitle: 'Due in 5 days - $2,500',
    type: 'payment',
    urgent: true,
  },
  {
    id: '2',
    title: 'Maintenance Scheduled',
    subtitle: 'AC inspection - Tomorrow 2:00 PM',
    type: 'maintenance',
    urgent: false,
  },
  {
    id: '3',
    title: 'Lease Renewal',
    subtitle: 'Expires in 30 days',
    type: 'lease',
    urgent: false,
  },
];

export default function DashboardScreen() {
  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeArea>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Container style={styles.content}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>John Doe</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-circle-outline" size={40} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Property Card */}
          <Card style={styles.propertyCard}>
            <Card.Content>
              <View style={styles.propertyHeader}>
                <View style={styles.propertyIcon}>
                  <Ionicons name="home" size={24} color="white" />
                </View>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle}>Downtown Apartment</Text>
                  <Text style={styles.propertyAddress}>123 Main St, Unit 2B</Text>
                  <Text style={styles.propertyRent}>$2,500/month</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionCard}
                  onPress={() => handleQuickAction(action.route)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon as any} size={24} color="white" />
                  </View>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Card style={styles.activityCard}>
              <Card.Content>
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Payment Processed</Text>
                    <Text style={styles.activitySubtitle}>January rent payment - $2,500</Text>
                    <Text style={styles.activityTime}>2 days ago</Text>
                  </View>
                </View>

                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="construct" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Maintenance Request</Text>
                    <Text style={styles.activitySubtitle}>AC unit not cooling properly</Text>
                    <Text style={styles.activityTime}>1 week ago</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>

          {/* Upcoming Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {upcomingItems.map((item) => (
              <Card key={item.id} style={[styles.upcomingCard, item.urgent && styles.urgentCard]}>
                <Card.Content>
                  <View style={styles.upcomingItem}>
                    <View style={styles.upcomingContent}>
                      <Text style={[styles.upcomingTitle, item.urgent && styles.urgentText]}>
                        {item.title}
                      </Text>
                      <Text style={styles.upcomingSubtitle}>{item.subtitle}</Text>
                    </View>
                    {item.urgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>Urgent</Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>

          {/* Support Section */}
          <Card style={styles.supportCard}>
            <Card.Content>
              <View style={styles.supportContent}>
                <View style={styles.supportIcon}>
                  <Ionicons name="help-circle-outline" size={32} color={theme.colors.primary} />
                </View>
                <View style={styles.supportText}>
                  <Text style={styles.supportTitle}>Need Help?</Text>
                  <Text style={styles.supportSubtitle}>
                    Contact support or browse our FAQ
                  </Text>
                </View>
                <Button mode="outlined" compact>
                  Contact
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Container>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  profileButton: {
    padding: 4,
  },
  propertyCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: 24,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  propertyRent: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 48) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  activityIcon: {
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  upcomingCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  upcomingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  urgentText: {
    color: '#EF4444',
  },
  upcomingSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  urgentBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  urgentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  supportCard: {
    backgroundColor: theme.colors.surface,
    marginTop: 12,
  },
  supportContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportIcon: {
    marginRight: 16,
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  supportSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
});