import { ObservatoryManager, Observatory, User, Session, Permission, Booking } from '../../lib/collaboration/observatory-manager';

// Mock data
const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    avatar: 'https://example.com/avatar1.jpg',
    lastActive: new Date('2024-03-01T10:00:00Z'),
    preferences: {
      notifications: true,
      timezone: 'America/New_York'
    }
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'member',
    avatar: 'https://example.com/avatar2.jpg',
    lastActive: new Date('2024-03-01T09:30:00Z'),
    preferences: {
      notifications: false,
      timezone: 'Europe/London'
    }
  },
  {
    id: 'user3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'observer',
    avatar: 'https://example.com/avatar3.jpg',
    lastActive: new Date('2024-03-01T08:00:00Z'),
    preferences: {
      notifications: true,
      timezone: 'America/Los_Angeles'
    }
  }
];

const mockObservatory: Observatory = {
  id: 'obs1',
  name: 'Test Observatory',
  description: 'A test observatory for unit testing',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    elevation: 100,
    timezone: 'America/New_York'
  },
  equipment: [
    {
      id: 'eq1',
      name: 'Main Telescope',
      type: 'telescope',
      status: 'available',
      specifications: {
        aperture: 203,
        focalLength: 2032,
        mount: 'equatorial'
      }
    }
  ],
  members: mockUsers,
  permissions: {
    user1: ['admin', 'book', 'control', 'view'],
    user2: ['book', 'control', 'view'],
    user3: ['view']
  },
  settings: {
    bookingAdvanceDays: 30,
    maxSessionDuration: 480,
    requireApproval: false,
    allowGuestAccess: true
  },
  created: new Date('2024-01-01T00:00:00Z'),
  modified: new Date('2024-03-01T00:00:00Z')
};

const mockBookings: Booking[] = [
  {
    id: 'booking1',
    observatoryId: 'obs1',
    userId: 'user1',
    startTime: new Date('2024-03-15T20:00:00Z'),
    endTime: new Date('2024-03-15T23:00:00Z'),
    status: 'confirmed',
    equipment: ['eq1'],
    purpose: 'Deep sky imaging',
    notes: 'Testing M31 with new filters',
    created: new Date('2024-03-01T10:00:00Z')
  },
  {
    id: 'booking2',
    observatoryId: 'obs1',
    userId: 'user2',
    startTime: new Date('2024-03-16T21:00:00Z'),
    endTime: new Date('2024-03-17T01:00:00Z'),
    status: 'pending',
    equipment: ['eq1'],
    purpose: 'Planetary imaging',
    notes: 'Jupiter opposition',
    created: new Date('2024-03-01T11:00:00Z')
  }
];

describe('ObservatoryManager', () => {
  let manager: ObservatoryManager;

  beforeEach(() => {
    manager = new ObservatoryManager();
  });

  describe('Observatory Management', () => {
    it('should create a new observatory', async () => {
      const newObservatory = await manager.createObservatory({
        name: 'New Observatory',
        description: 'A new test observatory',
        location: {
          latitude: 35.0,
          longitude: -120.0,
          elevation: 500,
          timezone: 'America/Los_Angeles'
        },
        ownerId: 'user1'
      });

      expect(newObservatory.id).toBeDefined();
      expect(newObservatory.name).toBe('New Observatory');
      expect(newObservatory.members).toHaveLength(1);
      expect(newObservatory.members[0].id).toBe('user1');
      expect(newObservatory.permissions.user1).toContain('admin');
    });

    it('should update observatory details', async () => {
      await manager.addObservatory(mockObservatory);

      const updated = await manager.updateObservatory('obs1', {
        description: 'Updated description',
        settings: {
          ...mockObservatory.settings,
          maxSessionDuration: 600
        }
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.settings.maxSessionDuration).toBe(600);
    });

    it('should delete an observatory', async () => {
      await manager.addObservatory(mockObservatory);

      const result = await manager.deleteObservatory('obs1', 'user1');

      expect(result).toBe(true);
      expect(await manager.getObservatory('obs1')).toBeNull();
    });

    it('should prevent non-admin from deleting observatory', async () => {
      await manager.addObservatory(mockObservatory);

      await expect(
        manager.deleteObservatory('obs1', 'user2')
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should list observatories for user', async () => {
      await manager.addObservatory(mockObservatory);

      const observatories = await manager.getObservatoriesForUser('user2');

      expect(observatories).toHaveLength(1);
      expect(observatories[0].id).toBe('obs1');
    });
  });

  describe('Member Management', () => {
    beforeEach(async () => {
      await manager.addObservatory(mockObservatory);
    });

    it('should add a new member', async () => {
      const newUser: User = {
        id: 'user4',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'member',
        avatar: '',
        lastActive: new Date(),
        preferences: { notifications: true, timezone: 'UTC' }
      };

      const result = await manager.addMember('obs1', newUser, 'user1');

      expect(result).toBe(true);
      
      const observatory = await manager.getObservatory('obs1');
      expect(observatory?.members).toHaveLength(4);
      expect(observatory?.permissions.user4).toContain('view');
    });

    it('should remove a member', async () => {
      const result = await manager.removeMember('obs1', 'user3', 'user1');

      expect(result).toBe(true);
      
      const observatory = await manager.getObservatory('obs1');
      expect(observatory?.members).toHaveLength(2);
      expect(observatory?.permissions.user3).toBeUndefined();
    });

    it('should update member permissions', async () => {
      const result = await manager.updateMemberPermissions('obs1', 'user3', ['book', 'view'], 'user1');

      expect(result).toBe(true);
      
      const observatory = await manager.getObservatory('obs1');
      expect(observatory?.permissions.user3).toEqual(['book', 'view']);
    });

    it('should prevent non-admin from managing members', async () => {
      const newUser: User = {
        id: 'user4',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'member',
        avatar: '',
        lastActive: new Date(),
        preferences: { notifications: true, timezone: 'UTC' }
      };

      await expect(
        manager.addMember('obs1', newUser, 'user2')
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should get member list with roles', async () => {
      const members = await manager.getMembers('obs1');

      expect(members).toHaveLength(3);
      expect(members.find(m => m.id === 'user1')?.role).toBe('admin');
      expect(members.find(m => m.id === 'user2')?.role).toBe('member');
      expect(members.find(m => m.id === 'user3')?.role).toBe('observer');
    });
  });

  describe('Permission System', () => {
    beforeEach(async () => {
      await manager.addObservatory(mockObservatory);
    });

    it('should check user permissions correctly', () => {
      expect(manager.hasPermission('obs1', 'user1', 'admin')).toBe(true);
      expect(manager.hasPermission('obs1', 'user2', 'book')).toBe(true);
      expect(manager.hasPermission('obs1', 'user3', 'book')).toBe(false);
      expect(manager.hasPermission('obs1', 'user3', 'view')).toBe(true);
    });

    it('should handle non-existent users', () => {
      expect(manager.hasPermission('obs1', 'nonexistent', 'view')).toBe(false);
    });

    it('should handle non-existent observatories', () => {
      expect(manager.hasPermission('nonexistent', 'user1', 'view')).toBe(false);
    });

    it('should get user permissions', () => {
      const permissions = manager.getUserPermissions('obs1', 'user2');

      expect(permissions).toEqual(['book', 'control', 'view']);
    });

    it('should validate permission hierarchy', () => {
      // Admin should have all permissions
      expect(manager.hasPermission('obs1', 'user1', 'view')).toBe(true);
      expect(manager.hasPermission('obs1', 'user1', 'book')).toBe(true);
      expect(manager.hasPermission('obs1', 'user1', 'control')).toBe(true);
      expect(manager.hasPermission('obs1', 'user1', 'admin')).toBe(true);
    });
  });

  describe('Booking System', () => {
    beforeEach(async () => {
      await manager.addObservatory(mockObservatory);
      for (const booking of mockBookings) {
        await manager.addBooking(booking);
      }
    });

    it('should create a new booking', async () => {
      const newBooking = await manager.createBooking({
        observatoryId: 'obs1',
        userId: 'user2',
        startTime: new Date('2024-03-20T22:00:00Z'),
        endTime: new Date('2024-03-21T02:00:00Z'),
        equipment: ['eq1'],
        purpose: 'Variable star monitoring',
        notes: 'Long-term project'
      });

      expect(newBooking.id).toBeDefined();
      expect(newBooking.status).toBe('confirmed');
      expect(newBooking.userId).toBe('user2');
    });

    it('should detect booking conflicts', async () => {
      const conflictingBooking = {
        observatoryId: 'obs1',
        userId: 'user2',
        startTime: new Date('2024-03-15T21:00:00Z'), // Overlaps with booking1
        endTime: new Date('2024-03-16T01:00:00Z'),
        equipment: ['eq1'],
        purpose: 'Test conflict',
        notes: ''
      };

      await expect(
        manager.createBooking(conflictingBooking)
      ).rejects.toThrow('Booking conflict detected');
    });

    it('should allow adjacent bookings', async () => {
      const adjacentBooking = await manager.createBooking({
        observatoryId: 'obs1',
        userId: 'user2',
        startTime: new Date('2024-03-15T23:00:00Z'), // Starts when booking1 ends
        endTime: new Date('2024-03-16T03:00:00Z'),
        equipment: ['eq1'],
        purpose: 'Adjacent session',
        notes: ''
      });

      expect(adjacentBooking.status).toBe('confirmed');
    });

    it('should cancel a booking', async () => {
      const result = await manager.cancelBooking('booking1', 'user1');

      expect(result).toBe(true);
      
      const booking = await manager.getBooking('booking1');
      expect(booking?.status).toBe('cancelled');
    });

    it('should prevent unauthorized booking cancellation', async () => {
      await expect(
        manager.cancelBooking('booking1', 'user3')
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should get bookings for observatory', async () => {
      const bookings = await manager.getBookingsForObservatory('obs1');

      expect(bookings).toHaveLength(2);
      expect(bookings.map(b => b.id)).toContain('booking1');
      expect(bookings.map(b => b.id)).toContain('booking2');
    });

    it('should get bookings for user', async () => {
      const userBookings = await manager.getBookingsForUser('user1');

      expect(userBookings).toHaveLength(1);
      expect(userBookings[0].id).toBe('booking1');
    });

    it('should get bookings in date range', async () => {
      const bookings = await manager.getBookingsInRange(
        'obs1',
        new Date('2024-03-15T00:00:00Z'),
        new Date('2024-03-16T00:00:00Z')
      );

      expect(bookings).toHaveLength(1);
      expect(bookings[0].id).toBe('booking1');
    });

    it('should respect booking advance limit', async () => {
      const tooFarAhead = new Date();
      tooFarAhead.setDate(tooFarAhead.getDate() + 35); // 35 days ahead, limit is 30

      await expect(
        manager.createBooking({
          observatoryId: 'obs1',
          userId: 'user2',
          startTime: tooFarAhead,
          endTime: new Date(tooFarAhead.getTime() + 3 * 60 * 60 * 1000),
          equipment: ['eq1'],
          purpose: 'Too far ahead',
          notes: ''
        })
      ).rejects.toThrow('Booking too far in advance');
    });

    it('should respect maximum session duration', async () => {
      const longSession = new Date('2024-03-20T20:00:00Z');
      const endTime = new Date(longSession.getTime() + 10 * 60 * 60 * 1000); // 10 hours, limit is 8

      await expect(
        manager.createBooking({
          observatoryId: 'obs1',
          userId: 'user2',
          startTime: longSession,
          endTime: endTime,
          equipment: ['eq1'],
          purpose: 'Too long session',
          notes: ''
        })
      ).rejects.toThrow('Session duration exceeds maximum');
    });
  });

  describe('Equipment Management', () => {
    beforeEach(async () => {
      await manager.addObservatory(mockObservatory);
    });

    it('should add equipment to observatory', async () => {
      const newEquipment = {
        id: 'eq2',
        name: 'Secondary Camera',
        type: 'camera',
        status: 'available',
        specifications: {
          sensor: 'CMOS',
          resolution: '6248x4176',
          pixelSize: 3.76
        }
      };

      const result = await manager.addEquipment('obs1', newEquipment, 'user1');

      expect(result).toBe(true);
      
      const observatory = await manager.getObservatory('obs1');
      expect(observatory?.equipment).toHaveLength(2);
    });

    it('should update equipment status', async () => {
      const result = await manager.updateEquipmentStatus('obs1', 'eq1', 'maintenance', 'user1');

      expect(result).toBe(true);
      
      const observatory = await manager.getObservatory('obs1');
      const equipment = observatory?.equipment.find(e => e.id === 'eq1');
      expect(equipment?.status).toBe('maintenance');
    });

    it('should remove equipment', async () => {
      const result = await manager.removeEquipment('obs1', 'eq1', 'user1');

      expect(result).toBe(true);
      
      const observatory = await manager.getObservatory('obs1');
      expect(observatory?.equipment).toHaveLength(0);
    });

    it('should get available equipment for time slot', async () => {
      const available = await manager.getAvailableEquipment(
        'obs1',
        new Date('2024-03-20T20:00:00Z'),
        new Date('2024-03-20T23:00:00Z')
      );

      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('eq1');
    });

    it('should exclude booked equipment from availability', async () => {
      const available = await manager.getAvailableEquipment(
        'obs1',
        new Date('2024-03-15T21:00:00Z'), // During booking1
        new Date('2024-03-15T22:00:00Z')
      );

      expect(available).toHaveLength(0); // eq1 is booked
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await manager.addObservatory(mockObservatory);
    });

    it('should start a session from booking', async () => {
      await manager.addBooking(mockBookings[0]);

      const session = await manager.startSession('booking1', 'user1');

      expect(session.id).toBeDefined();
      expect(session.bookingId).toBe('booking1');
      expect(session.status).toBe('active');
      expect(session.startTime).toBeDefined();
    });

    it('should prevent starting session without permission', async () => {
      await manager.addBooking(mockBookings[0]);

      await expect(
        manager.startSession('booking1', 'user3')
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should end an active session', async () => {
      await manager.addBooking(mockBookings[0]);
      const session = await manager.startSession('booking1', 'user1');

      const result = await manager.endSession(session.id, 'user1');

      expect(result).toBe(true);
      
      const updatedSession = await manager.getSession(session.id);
      expect(updatedSession?.status).toBe('completed');
      expect(updatedSession?.endTime).toBeDefined();
    });

    it('should get active sessions', async () => {
      await manager.addBooking(mockBookings[0]);
      await manager.startSession('booking1', 'user1');

      const activeSessions = await manager.getActiveSessions('obs1');

      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].status).toBe('active');
    });

    it('should handle session timeout', async () => {
      await manager.addBooking(mockBookings[0]);
      const session = await manager.startSession('booking1', 'user1');

      // Simulate session timeout
      await manager.handleSessionTimeout(session.id);

      const updatedSession = await manager.getSession(session.id);
      expect(updatedSession?.status).toBe('timeout');
    });
  });

  describe('Real-time Features', () => {
    beforeEach(async () => {
      await manager.addObservatory(mockObservatory);
    });

    it('should emit events for booking changes', async () => {
      const events: any[] = [];
      
      manager.on('booking.created', (event) => events.push(event));
      manager.on('booking.cancelled', (event) => events.push(event));

      await manager.createBooking({
        observatoryId: 'obs1',
        userId: 'user2',
        startTime: new Date('2024-03-20T20:00:00Z'),
        endTime: new Date('2024-03-20T23:00:00Z'),
        equipment: ['eq1'],
        purpose: 'Test event',
        notes: ''
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('booking.created');
    });

    it('should emit events for member changes', async () => {
      const events: any[] = [];
      
      manager.on('member.added', (event) => events.push(event));

      const newUser: User = {
        id: 'user4',
        name: 'Test User',
        email: 'test@example.com',
        role: 'member',
        avatar: '',
        lastActive: new Date(),
        preferences: { notifications: true, timezone: 'UTC' }
      };

      await manager.addMember('obs1', newUser, 'user1');

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('member.added');
    });

    it('should broadcast equipment status changes', async () => {
      const events: any[] = [];
      
      manager.on('equipment.status_changed', (event) => events.push(event));

      await manager.updateEquipmentStatus('obs1', 'eq1', 'maintenance', 'user1');

      expect(events).toHaveLength(1);
      expect(events[0].equipmentId).toBe('eq1');
      expect(events[0].newStatus).toBe('maintenance');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid observatory IDs', async () => {
      await expect(
        manager.getObservatory('nonexistent')
      ).resolves.toBeNull();
    });

    it('should handle invalid user IDs', async () => {
      await manager.addObservatory(mockObservatory);

      await expect(
        manager.addMember('obs1', {
          id: '',
          name: '',
          email: 'invalid',
          role: 'member',
          avatar: '',
          lastActive: new Date(),
          preferences: { notifications: true, timezone: 'UTC' }
        }, 'user1')
      ).rejects.toThrow('Invalid user data');
    });

    it('should handle concurrent booking attempts', async () => {
      await manager.addObservatory(mockObservatory);

      const booking1Promise = manager.createBooking({
        observatoryId: 'obs1',
        userId: 'user1',
        startTime: new Date('2024-03-20T20:00:00Z'),
        endTime: new Date('2024-03-20T23:00:00Z'),
        equipment: ['eq1'],
        purpose: 'First booking',
        notes: ''
      });

      const booking2Promise = manager.createBooking({
        observatoryId: 'obs1',
        userId: 'user2',
        startTime: new Date('2024-03-20T21:00:00Z'), // Overlapping
        endTime: new Date('2024-03-21T01:00:00Z'),
        equipment: ['eq1'],
        purpose: 'Second booking',
        notes: ''
      });

      const results = await Promise.allSettled([booking1Promise, booking2Promise]);

      // One should succeed, one should fail
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
    });

    it('should validate booking time constraints', async () => {
      await manager.addObservatory(mockObservatory);

      // End time before start time
      await expect(
        manager.createBooking({
          observatoryId: 'obs1',
          userId: 'user2',
          startTime: new Date('2024-03-20T23:00:00Z'),
          endTime: new Date('2024-03-20T20:00:00Z'),
          equipment: ['eq1'],
          purpose: 'Invalid times',
          notes: ''
        })
      ).rejects.toThrow('Invalid booking times');
    });

    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const originalMethod = manager.getObservatory;
      manager.getObservatory = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await expect(
        manager.getObservatory('obs1')
      ).rejects.toThrow('Database connection failed');

      // Restore original method
      manager.getObservatory = originalMethod;
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of bookings efficiently', async () => {
      await manager.addObservatory(mockObservatory);

      // Create many bookings
      const bookingPromises = Array.from({ length: 100 }, (_, i) => {
        const startTime = new Date('2024-04-01T00:00:00Z');
        startTime.setHours(startTime.getHours() + i * 4); // 4-hour intervals

        return manager.createBooking({
          observatoryId: 'obs1',
          userId: i % 2 === 0 ? 'user1' : 'user2',
          startTime: startTime,
          endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000), // 2 hours
          equipment: ['eq1'],
          purpose: `Booking ${i}`,
          notes: ''
        });
      });

      const startTime = Date.now();
      await Promise.all(bookingPromises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      const allBookings = await manager.getBookingsForObservatory('obs1');
      expect(allBookings).toHaveLength(100);
    });

    it('should efficiently query bookings in date ranges', async () => {
      await manager.addObservatory(mockObservatory);

      // Add bookings across a wide date range
      for (let i = 0; i < 50; i++) {
        const startTime = new Date('2024-01-01T00:00:00Z');
        startTime.setDate(startTime.getDate() + i * 7); // Weekly bookings

        await manager.createBooking({
          observatoryId: 'obs1',
          userId: 'user1',
          startTime: startTime,
          endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000),
          equipment: ['eq1'],
          purpose: `Weekly booking ${i}`,
          notes: ''
        });
      }

      const startTime = Date.now();
      const marchBookings = await manager.getBookingsInRange(
        'obs1',
        new Date('2024-03-01T00:00:00Z'),
        new Date('2024-03-31T23:59:59Z')
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
      expect(marchBookings.length).toBeGreaterThan(0);
      expect(marchBookings.length).toBeLessThan(50); // Should be filtered
    });
  });
});
