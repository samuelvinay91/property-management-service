import request from 'supertest';
import { Application } from 'express';
import { Connection } from 'typeorm';
import { createTestGateway } from '../helpers/testGateway';

describe('Property Management E2E Tests', () => {
  let app: Application;
  let connection: Connection;
  let authToken: string;
  let propertyManagerToken: string;
  let tenantToken: string;

  beforeAll(async () => {
    app = await createTestGateway();
    connection = global.__DB_CONNECTION__;
  });

  beforeEach(async () => {
    // Clean up database
    await connection.query('DELETE FROM users');
    await connection.query('DELETE FROM properties');
    await connection.query('DELETE FROM maintenance_requests');
    await connection.query('DELETE FROM bookings');
    await connection.query('DELETE FROM payments');

    // Create test users and get tokens
    const { authToken: pmToken } = await createPropertyManager(app);
    const { authToken: tToken } = await createTenant(app);
    
    propertyManagerToken = pmToken;
    tenantToken = tToken;
    authToken = pmToken; // Default to property manager
  });

  describe('Complete Property Management Workflow', () => {
    it('should handle full property lifecycle', async () => {
      // 1. Property Manager creates a property
      const propertyData = {
        name: 'Sunset Apartments',
        type: 'APARTMENT',
        address: {
          street: '123 Sunset Blvd',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210'
        },
        units: [
          { number: '101', rentAmount: 2500, bedrooms: 2, bathrooms: 2 },
          { number: '102', rentAmount: 2800, bedrooms: 3, bathrooms: 2 }
        ]
      };

      const createPropertyResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${propertyManagerToken}`)
        .send({
          query: `
            mutation CreateProperty($input: CreatePropertyInput!) {
              createProperty(input: $input) {
                id
                name
                type
                status
                address {
                  street
                  city
                  state
                }
                units {
                  id
                  number
                  rentAmount
                  isOccupied
                }
              }
            }
          `,
          variables: { input: propertyData }
        })
        .expect(200);

      expect(createPropertyResponse.body.data.createProperty).toMatchObject({
        name: 'Sunset Apartments',
        type: 'APARTMENT',
        status: 'ACTIVE',
        address: {
          street: '123 Sunset Blvd',
          city: 'Los Angeles',
          state: 'CA'
        },
        units: expect.arrayContaining([
          expect.objectContaining({
            number: '101',
            rentAmount: 2500,
            isOccupied: false
          })
        ])
      });

      const propertyId = createPropertyResponse.body.data.createProperty.id;
      const unitId = createPropertyResponse.body.data.createProperty.units[0].id;

      // 2. Tenant searches for properties
      const searchResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          query: `
            query SearchProperties($input: PropertySearchInput!) {
              searchProperties(input: $input) {
                properties {
                  id
                  name
                  rentAmount
                  bedrooms
                  bathrooms
                  isAvailable
                }
                total
              }
            }
          `,
          variables: {
            input: {
              location: 'Los Angeles',
              maxRent: 3000,
              minBedrooms: 2
            }
          }
        })
        .expect(200);

      expect(searchResponse.body.data.searchProperties.properties).toHaveLength(1);
      expect(searchResponse.body.data.searchProperties.properties[0].name).toBe('Sunset Apartments');

      // 3. Tenant books a viewing
      const bookingResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          query: `
            mutation CreateBooking($input: CreateBookingInput!) {
              createBooking(input: $input) {
                id
                title
                type
                status
                startTime
                endTime
                property {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            input: {
              propertyId,
              unitId,
              type: 'VIEWING',
              title: 'Property Viewing',
              startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
              description: 'Interested in renting this unit'
            }
          }
        })
        .expect(200);

      expect(bookingResponse.body.data.createBooking).toMatchObject({
        title: 'Property Viewing',
        type: 'VIEWING',
        status: 'PENDING',
        property: {
          name: 'Sunset Apartments'
        }
      });

      const bookingId = bookingResponse.body.data.createBooking.id;

      // 4. Property Manager approves booking
      const approveBookingResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${propertyManagerToken}`)
        .send({
          query: `
            mutation UpdateBookingStatus($id: ID!, $status: BookingStatus!) {
              updateBookingStatus(id: $id, status: $status) {
                id
                status
              }
            }
          `,
          variables: {
            id: bookingId,
            status: 'CONFIRMED'
          }
        })
        .expect(200);

      expect(approveBookingResponse.body.data.updateBookingStatus.status).toBe('CONFIRMED');

      // 5. Tenant applies for lease
      const applicationResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          query: `
            mutation CreateApplication($input: CreateApplicationInput!) {
              createApplication(input: $input) {
                id
                status
                propertyId
                unitId
                monthlyIncome
                employmentStatus
              }
            }
          `,
          variables: {
            input: {
              propertyId,
              unitId,
              monthlyIncome: 7500,
              employmentStatus: 'EMPLOYED',
              moveInDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
              references: [
                {
                  name: 'Previous Landlord',
                  phone: '555-0123',
                  relationship: 'LANDLORD'
                }
              ]
            }
          }
        })
        .expect(200);

      expect(applicationResponse.body.data.createApplication).toMatchObject({
        status: 'PENDING',
        propertyId,
        unitId,
        monthlyIncome: 7500,
        employmentStatus: 'EMPLOYED'
      });

      const applicationId = applicationResponse.body.data.createApplication.id;

      // 6. Property Manager approves application and creates lease
      const approveApplicationResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${propertyManagerToken}`)
        .send({
          query: `
            mutation ApproveApplication($id: ID!) {
              approveApplication(id: $id) {
                id
                status
                lease {
                  id
                  status
                  startDate
                  endDate
                  monthlyRent
                  securityDeposit
                }
              }
            }
          `,
          variables: { id: applicationId }
        })
        .expect(200);

      expect(approveApplicationResponse.body.data.approveApplication).toMatchObject({
        status: 'APPROVED',
        lease: expect.objectContaining({
          status: 'PENDING',
          monthlyRent: 2500
        })
      });

      const leaseId = approveApplicationResponse.body.data.approveApplication.lease.id;

      // 7. Tenant pays security deposit
      const securityDepositResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          query: `
            mutation ProcessPayment($input: PaymentInput!) {
              processPayment(input: $input) {
                id
                amount
                type
                status
                transactionId
              }
            }
          `,
          variables: {
            input: {
              amount: 2500,
              type: 'SECURITY_DEPOSIT',
              paymentMethod: 'CREDIT_CARD',
              leaseId,
              description: 'Security deposit for Sunset Apartments Unit 101'
            }
          }
        })
        .expect(200);

      expect(securityDepositResponse.body.data.processPayment).toMatchObject({
        amount: 2500,
        type: 'SECURITY_DEPOSIT',
        status: 'COMPLETED'
      });

      // 8. Lease becomes active
      const activateLeaseResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${propertyManagerToken}`)
        .send({
          query: `
            mutation ActivateLease($id: ID!) {
              activateLease(id: $id) {
                id
                status
                unit {
                  isOccupied
                }
              }
            }
          `,
          variables: { id: leaseId }
        })
        .expect(200);

      expect(activateLeaseResponse.body.data.activateLease).toMatchObject({
        status: 'ACTIVE',
        unit: {
          isOccupied: true
        }
      });

      // 9. Tenant submits maintenance request
      const maintenanceResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          query: `
            mutation CreateMaintenanceRequest($input: CreateMaintenanceRequestInput!) {
              createMaintenanceRequest(input: $input) {
                id
                title
                category
                priority
                status
                description
              }
            }
          `,
          variables: {
            input: {
              propertyId,
              unitId,
              category: 'PLUMBING',
              priority: 'MEDIUM',
              title: 'Leaky Kitchen Faucet',
              description: 'The kitchen faucet has been dripping constantly for the past few days.'
            }
          }
        })
        .expect(200);

      expect(maintenanceResponse.body.data.createMaintenanceRequest).toMatchObject({
        title: 'Leaky Kitchen Faucet',
        category: 'PLUMBING',
        priority: 'MEDIUM',
        status: 'PENDING'
      });

      // 10. Property Manager assigns maintenance request
      const maintenanceId = maintenanceResponse.body.data.createMaintenanceRequest.id;

      const assignMaintenanceResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${propertyManagerToken}`)
        .send({
          query: `
            mutation AssignMaintenanceRequest($id: ID!, $vendorId: ID!) {
              assignMaintenanceRequest(id: $id, vendorId: $vendorId) {
                id
                status
                assignedVendor {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            id: maintenanceId,
            vendorId: 'vendor-1' // Assume vendor exists
          }
        })
        .expect(200);

      expect(assignMaintenanceResponse.body.data.assignMaintenanceRequest).toMatchObject({
        status: 'IN_PROGRESS',
        assignedVendor: expect.objectContaining({
          name: expect.any(String)
        })
      });

      // 11. Tenant pays first month's rent
      const rentPaymentResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          query: `
            mutation ProcessPayment($input: PaymentInput!) {
              processPayment(input: $input) {
                id
                amount
                type
                status
                dueDate
              }
            }
          `,
          variables: {
            input: {
              amount: 2500,
              type: 'RENT',
              paymentMethod: 'BANK_TRANSFER',
              leaseId,
              description: 'Monthly rent for September 2024'
            }
          }
        })
        .expect(200);

      expect(rentPaymentResponse.body.data.processPayment).toMatchObject({
        amount: 2500,
        type: 'RENT',
        status: 'COMPLETED'
      });

      // 12. Property Manager views analytics dashboard
      const analyticsResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${propertyManagerToken}`)
        .send({
          query: `
            query GetPropertyAnalytics($propertyId: ID!, $dateRange: String!) {
              propertyAnalytics(propertyId: $propertyId, dateRange: $dateRange) {
                occupancyRate
                monthlyRevenue
                maintenanceRequests {
                  total
                  pending
                  inProgress
                  completed
                }
                financialSummary {
                  totalIncome
                  totalExpenses
                  netIncome
                }
              }
            }
          `,
          variables: {
            propertyId,
            dateRange: '30d'
          }
        })
        .expect(200);

      expect(analyticsResponse.body.data.propertyAnalytics).toMatchObject({
        occupancyRate: 50, // 1 out of 2 units occupied
        monthlyRevenue: 2500,
        maintenanceRequests: {
          total: 1,
          pending: 0,
          inProgress: 1,
          completed: 0
        },
        financialSummary: expect.objectContaining({
          totalIncome: 5000, // Security deposit + rent
          netIncome: expect.any(Number)
        })
      });
    });
  });

  describe('Multi-tenant Property Management', () => {
    it('should handle multiple tenants and properties', async () => {
      // Create multiple properties
      const property1 = await createProperty(app, propertyManagerToken, {
        name: 'Downtown Lofts',
        type: 'APARTMENT',
        units: 3
      });

      const property2 = await createProperty(app, propertyManagerToken, {
        name: 'Suburban Homes',
        type: 'HOUSE',
        units: 2
      });

      // Create multiple tenants
      const tenant1Token = (await createTenant(app, 'tenant1@example.com')).authToken;
      const tenant2Token = (await createTenant(app, 'tenant2@example.com')).authToken;
      const tenant3Token = (await createTenant(app, 'tenant3@example.com')).authToken;

      // Each tenant applies to different properties
      const applications = await Promise.all([
        createApplication(app, tenant1Token, property1.id, property1.units[0].id),
        createApplication(app, tenant2Token, property1.id, property1.units[1].id),
        createApplication(app, tenant3Token, property2.id, property2.units[0].id)
      ]);

      // Property manager reviews all applications
      const approvals = await Promise.all(
        applications.map(app => 
          approveApplication(app, propertyManagerToken, app.id)
        )
      );

      // Verify all leases created successfully
      expect(approvals).toHaveLength(3);
      approvals.forEach(approval => {
        expect(approval.status).toBe('APPROVED');
        expect(approval.lease).toBeTruthy();
      });

      // Check portfolio-wide analytics
      const portfolioResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${propertyManagerToken}`)
        .send({
          query: `
            query GetPortfolioAnalytics($dateRange: String!) {
              portfolioAnalytics(dateRange: $dateRange) {
                totalProperties
                totalUnits
                occupiedUnits
                occupancyRate
                totalMonthlyRevenue
                properties {
                  id
                  name
                  occupancyRate
                  monthlyRevenue
                }
              }
            }
          `,
          variables: { dateRange: '30d' }
        })
        .expect(200);

      expect(portfolioResponse.body.data.portfolioAnalytics).toMatchObject({
        totalProperties: 2,
        totalUnits: 5,
        occupiedUnits: 3,
        occupancyRate: 60
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent booking attempts', async () => {
      const property = await createProperty(app, propertyManagerToken, {
        name: 'Popular Apartment',
        units: 1
      });

      const unitId = property.units[0].id;
      const viewingTime = new Date(Date.now() + 86400000).toISOString();

      // Two tenants try to book the same time slot
      const bookingPromises = [
        request(app)
          .post('/graphql')
          .set('Authorization', `Bearer ${tenantToken}`)
          .send({
            query: `
              mutation CreateBooking($input: CreateBookingInput!) {
                createBooking(input: $input) {
                  id
                  status
                }
              }
            `,
            variables: {
              input: {
                propertyId: property.id,
                unitId,
                type: 'VIEWING',
                title: 'Property Viewing',
                startTime: viewingTime,
                endTime: new Date(Date.parse(viewingTime) + 3600000).toISOString()
              }
            }
          }),
        
        request(app)
          .post('/graphql')
          .set('Authorization', `Bearer ${(await createTenant(app, 'tenant2@example.com')).authToken}`)
          .send({
            query: `
              mutation CreateBooking($input: CreateBookingInput!) {
                createBooking(input: $input) {
                  id
                  status
                }
              }
            `,
            variables: {
              input: {
                propertyId: property.id,
                unitId,
                type: 'VIEWING',
                title: 'Property Viewing',
                startTime: viewingTime,
                endTime: new Date(Date.parse(viewingTime) + 3600000).toISOString()
              }
            }
          })
      ];

      const results = await Promise.allSettled(bookingPromises);

      // One should succeed, one should fail due to conflict
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status !== 200));

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(1);
    });

    it('should validate payment processing', async () => {
      // Try to process payment without lease
      const invalidPaymentResponse = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          query: `
            mutation ProcessPayment($input: PaymentInput!) {
              processPayment(input: $input) {
                id
                status
              }
            }
          `,
          variables: {
            input: {
              amount: 2500,
              type: 'RENT',
              paymentMethod: 'CREDIT_CARD',
              leaseId: 'non-existent-lease'
            }
          }
        })
        .expect(400);

      expect(invalidPaymentResponse.body.errors).toBeTruthy();
    });
  });
});

// Helper functions
async function createPropertyManager(app: Application) {
  const registerResponse = await request(app)
    .post('/graphql')
    .send({
      query: `
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            token
            user {
              id
              email
              role
            }
          }
        }
      `,
      variables: {
        input: {
          email: 'manager@propflow.com',
          password: 'password123',
          firstName: 'Property',
          lastName: 'Manager',
          role: 'PROPERTY_MANAGER'
        }
      }
    });

  return {
    authToken: registerResponse.body.data.register.token,
    user: registerResponse.body.data.register.user
  };
}

async function createTenant(app: Application, email = 'tenant@propflow.com') {
  const registerResponse = await request(app)
    .post('/graphql')
    .send({
      query: `
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            token
            user {
              id
              email
              role
            }
          }
        }
      `,
      variables: {
        input: {
          email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'Tenant',
          role: 'TENANT'
        }
      }
    });

  return {
    authToken: registerResponse.body.data.register.token,
    user: registerResponse.body.data.register.user
  };
}

async function createProperty(app: Application, token: string, options: any) {
  const response = await request(app)
    .post('/graphql')
    .set('Authorization', `Bearer ${token}`)
    .send({
      query: `
        mutation CreateProperty($input: CreatePropertyInput!) {
          createProperty(input: $input) {
            id
            name
            units {
              id
              number
            }
          }
        }
      `,
      variables: {
        input: {
          name: options.name,
          type: options.type,
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            postalCode: '12345'
          },
          units: Array.from({ length: options.units }, (_, i) => ({
            number: `${i + 1}01`,
            rentAmount: 2500,
            bedrooms: 2,
            bathrooms: 2
          }))
        }
      }
    });

  return response.body.data.createProperty;
}

async function createApplication(app: Application, token: string, propertyId: string, unitId: string) {
  const response = await request(app)
    .post('/graphql')
    .set('Authorization', `Bearer ${token}`)
    .send({
      query: `
        mutation CreateApplication($input: CreateApplicationInput!) {
          createApplication(input: $input) {
            id
            status
            propertyId
            unitId
          }
        }
      `,
      variables: {
        input: {
          propertyId,
          unitId,
          monthlyIncome: 7500,
          employmentStatus: 'EMPLOYED',
          moveInDate: new Date(Date.now() + 2592000000).toISOString()
        }
      }
    });

  return response.body.data.createApplication;
}

async function approveApplication(app: Application, token: string, applicationId: string) {
  const response = await request(app)
    .post('/graphql')
    .set('Authorization', `Bearer ${token}`)
    .send({
      query: `
        mutation ApproveApplication($id: ID!) {
          approveApplication(id: $id) {
            id
            status
            lease {
              id
              status
            }
          }
        }
      `,
      variables: { id: applicationId }
    });

  return response.body.data.approveApplication;
}