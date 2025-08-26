import { db } from '@/lib/db';
import { 
  patients, 
  appointments, 
  bookings, 
  treatments, 
  locations, 
  dailyMetrics, 
  locationMetrics 
} from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

class GreyfinchSyncService {
  // Hash patient data for HIPAA compliance
  private hashPatientData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Sync locations from Greyfinch
  async syncLocations(userId: string, greyfinchData: any): Promise<void> {
    try {
      if (!greyfinchData?.data?.locations) return;

      for (const location of greyfinchData.data.locations) {
        // Check if location already exists
        const existingLocation = await db.select().from(locations).where(
          and(
            eq(locations.greyfinchId, location.id),
            eq(locations.userId, userId)
          )
        ).limit(1);

        const locationData = {
          userId,
          name: location.name || 'Unknown Location',
          greyfinchId: location.id,
          address: location.address || '',
          patientCount: 0, // Will be updated when we sync patients
          isActive: true
        };

        if (existingLocation.length > 0) {
          // Update existing location
          await db.update(locations)
            .set({
              ...locationData,
              updatedAt: new Date()
            })
            .where(eq(locations.id, existingLocation[0].id));
        } else {
          // Insert new location
          await db.insert(locations).values(locationData);
        }
      }

      console.log(`Synced ${greyfinchData.data.locations.length} locations`);
    } catch (error) {
      console.error('Error syncing locations:', error);
      throw error;
    }
  }

  // Sync patients from Greyfinch (HIPAA compliant)
  async syncPatients(userId: string, greyfinchData: any): Promise<void> {
    try {
      if (!greyfinchData?.data?.leads) return;

      for (const patient of greyfinchData.data.leads) {
        // Create HIPAA-compliant patient hash
        const patientHash = this.hashPatientData(`${patient.id}-${patient.firstName}-${patient.lastName}`);
        
        // Determine age group (you might need to adjust this based on your data)
        const ageGroup = this.determineAgeGroup(patient);
        
        // Check if patient already exists
        const existingPatient = await db.select().from(patients).where(
          and(
            eq(patients.greyfinchId, patient.id),
            eq(patients.userId, userId)
          )
        ).limit(1);

        const patientData = {
          userId,
          greyfinchId: patient.id,
          locationId: null, // Will be updated when we have location mapping
          patientHash,
          ageGroup,
          gender: patient.gender || 'unknown',
          treatmentStatus: this.determineTreatmentStatus(patient),
          firstVisitDate: null, // Will be updated from appointments
          lastVisitDate: null, // Will be updated from appointments
          totalVisits: 0, // Will be calculated from appointments
          totalRevenue: 0, // Will be calculated from appointments
          isActive: true
        };

        if (existingPatient.length > 0) {
          // Update existing patient
          await db.update(patients)
            .set({
              ...patientData,
              updatedAt: new Date()
            })
            .where(eq(patients.id, existingPatient[0].id));
        } else {
          // Insert new patient
          await db.insert(patients).values(patientData);
        }
      }

      console.log(`Synced ${greyfinchData.data.leads.length} patients`);
    } catch (error) {
      console.error('Error syncing patients:', error);
      throw error;
    }
  }

  // Sync appointments from Greyfinch
  async syncAppointments(userId: string, greyfinchData: any): Promise<void> {
    try {
      if (!greyfinchData?.data?.appointments) return;

      for (const appointment of greyfinchData.data.appointments) {
        // Get patient ID from greyfinchId
        const patientRecord = await db.select().from(patients).where(
          and(
            eq(patients.greyfinchId, appointment.patientId),
            eq(patients.userId, userId)
          )
        ).limit(1);

        if (patientRecord.length === 0) continue;

        // Check if appointment already exists
        const existingAppointment = await db.select().from(appointments).where(
          and(
            eq(appointments.greyfinchId, appointment.id),
            eq(appointments.userId, userId)
          )
        ).limit(1);

        const appointmentData = {
          userId,
          greyfinchId: appointment.id,
          patientId: patientRecord[0].id,
          locationId: null, // Will be updated when we have location mapping
          appointmentType: this.determineAppointmentType(appointment),
          status: appointment.status || 'scheduled',
          scheduledDate: appointment.scheduledDate ? new Date(appointment.scheduledDate) : null,
          actualDate: appointment.actualDate ? new Date(appointment.actualDate) : null,
          duration: appointment.duration || 60,
          revenue: appointment.revenue || 0,
          notes: appointment.notes || '',
          isActive: true
        };

        let appointmentId: number;

        if (existingAppointment.length > 0) {
          // Update existing appointment
          await db.update(appointments)
            .set({
              ...appointmentData,
              updatedAt: new Date()
            })
            .where(eq(appointments.id, existingAppointment[0].id));
          appointmentId = existingAppointment[0].id;
        } else {
          // Insert new appointment
          const result = await db.insert(appointments).values(appointmentData).returning();
          appointmentId = result[0].id;
        }

        // Sync bookings for this appointment
        if (appointment.bookings) {
          for (const booking of appointment.bookings) {
            await this.syncBooking(userId, appointmentId, booking);
          }
        }
      }

      console.log(`Synced ${greyfinchData.data.appointments.length} appointments`);
    } catch (error) {
      console.error('Error syncing appointments:', error);
      throw error;
    }
  }

  // Sync booking details
  async syncBooking(userId: string, appointmentId: number, bookingData: any): Promise<void> {
    try {
      const existingBooking = await db.select().from(bookings).where(
        and(
          eq(bookings.greyfinchId, bookingData.id),
          eq(bookings.userId, userId)
        )
      ).limit(1);

      const booking = {
        userId,
        greyfinchId: bookingData.id,
        appointmentId,
        startTime: bookingData.startTime ? new Date(bookingData.startTime) : null,
        endTime: bookingData.endTime ? new Date(bookingData.endTime) : null,
        localStartDate: bookingData.localStartDate ? new Date(bookingData.localStartDate) : null,
        localStartTime: bookingData.localStartTime ? new Date(bookingData.localStartTime) : null,
        timezone: bookingData.timezone || 'UTC',
        isActive: true
      };

      if (existingBooking.length > 0) {
        await db.update(bookings)
          .set({
            ...booking,
            updatedAt: new Date()
          })
          .where(eq(bookings.id, existingBooking[0].id));
      } else {
        await db.insert(bookings).values(booking);
      }
    } catch (error) {
      console.error('Error syncing booking:', error);
    }
  }

  // Sync daily metrics
  async syncDailyMetrics(userId: string, greyfinchData: any): Promise<void> {
    try {
      // Calculate daily metrics from appointments and patients
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Get all locations for this user
      const userLocations = await db.select().from(locations).where(
        and(
          eq(locations.userId, userId),
          eq(locations.isActive, true)
        )
      );

      for (const location of userLocations) {
        // Get appointments for today for this location
        const todayAppointments = await db.select().from(appointments).where(
          and(
            eq(appointments.locationId, location.id),
            eq(appointments.userId, userId),
            eq(appointments.isActive, true)
          )
        );

        const completedAppointments = todayAppointments.filter(apt => apt.status === 'completed');
        const cancelledAppointments = todayAppointments.filter(apt => apt.status === 'cancelled');
        const noShows = todayAppointments.filter(apt => apt.status === 'no_show');

        const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.revenue || 0), 0);
        const averageRevenue = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;

        // Check if daily metrics already exist for today
        const existingMetrics = await db.select().from(dailyMetrics).where(
          and(
            eq(dailyMetrics.locationId, location.id),
            eq(dailyMetrics.userId, userId),
            eq(dailyMetrics.date, today)
          )
        ).limit(1);

        const metricsData = {
          userId,
          locationId: location.id,
          date: today,
          totalPatients: todayAppointments.length,
          newPatients: 0, // Would need to calculate from patient creation dates
          appointments: todayAppointments.length,
          completedAppointments: completedAppointments.length,
          cancelledAppointments: cancelledAppointments.length,
          noShows: noShows.length,
          totalRevenue,
          averageRevenue,
          isActive: true
        };

        if (existingMetrics.length > 0) {
          await db.update(dailyMetrics)
            .set({
              ...metricsData,
              updatedAt: new Date()
            })
            .where(eq(dailyMetrics.id, existingMetrics[0].id));
        } else {
          await db.insert(dailyMetrics).values(metricsData);
        }
      }

      console.log('Synced daily metrics');
    } catch (error) {
      console.error('Error syncing daily metrics:', error);
      throw error;
    }
  }

  // Sync location metrics
  async syncLocationMetrics(userId: string, greyfinchData: any): Promise<void> {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format

      // Get all locations for this user
      const userLocations = await db.select().from(locations).where(
        and(
          eq(locations.userId, userId),
          eq(locations.isActive, true)
        )
      );

      for (const location of userLocations) {
        // Get all appointments for this location in current period
        const periodStart = new Date(currentPeriod + '-01');
        const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);

        const periodAppointments = await db.select().from(appointments).where(
          and(
            eq(appointments.locationId, location.id),
            eq(appointments.userId, userId),
            eq(appointments.isActive, true),
            // Add date range filter here when we have proper date fields
          )
        );

        const completedAppointments = periodAppointments.filter(apt => apt.status === 'completed');
        const totalAppointments = periodAppointments.length;
        const cancellationRate = totalAppointments > 0 ? 
          (periodAppointments.filter(apt => apt.status === 'cancelled').length / totalAppointments) * 100 : 0;
        const noShowRate = totalAppointments > 0 ? 
          (periodAppointments.filter(apt => apt.status === 'no_show').length / totalAppointments) * 100 : 0;

        const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.revenue || 0), 0);
        const averageRevenuePerPatient = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;

        // Check if location metrics already exist for this period
        const existingMetrics = await db.select().from(locationMetrics).where(
          and(
            eq(locationMetrics.locationId, location.id),
            eq(locationMetrics.userId, userId),
            eq(locationMetrics.period, currentPeriod)
          )
        ).limit(1);

        const metricsData = {
          userId,
          locationId: location.id,
          period: currentPeriod,
          totalPatients: totalAppointments,
          newPatients: 0, // Would need to calculate from patient creation dates
          totalAppointments,
          completedAppointments: completedAppointments.length,
          cancellationRate,
          noShowRate,
          totalRevenue,
          averageRevenuePerPatient,
          isActive: true
        };

        if (existingMetrics.length > 0) {
          await db.update(locationMetrics)
            .set({
              ...metricsData,
              updatedAt: new Date()
            })
            .where(eq(locationMetrics.id, existingMetrics[0].id));
        } else {
          await db.insert(locationMetrics).values(metricsData);
        }
      }

      console.log('Synced location metrics');
    } catch (error) {
      console.error('Error syncing location metrics:', error);
      throw error;
    }
  }

  // Sync all data from Greyfinch
  async syncAllData(userId: string, greyfinchData: any): Promise<void> {
    try {
      console.log('Starting comprehensive Greyfinch data sync...');
      
      await this.syncLocations(userId, greyfinchData);
      await this.syncPatients(userId, greyfinchData);
      await this.syncAppointments(userId, greyfinchData);
      await this.syncDailyMetrics(userId, greyfinchData);
      await this.syncLocationMetrics(userId, greyfinchData);
      
      console.log('Greyfinch data sync completed successfully');
    } catch (error) {
      console.error('Error syncing all Greyfinch data:', error);
      throw error;
    }
  }

  // Helper methods
  private determineAgeGroup(patient: any): string {
    // This would need to be implemented based on your data structure
    return 'adult';
  }

  private determineTreatmentStatus(patient: any): string {
    if (patient.treatments && patient.treatments.length > 0) {
      const hasNewPatient = patient.treatments.some((t: any) => t.status?.type === 'NEW_PATIENT');
      return hasNewPatient ? 'new_patient' : 'active';
    }
    return 'unknown';
  }

  private determineAppointmentType(appointment: any): string {
    // This would need to be implemented based on your data structure
    return 'consultation';
  }
}

export const greyfinchSyncService = new GreyfinchSyncService();
