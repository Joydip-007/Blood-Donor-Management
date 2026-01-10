import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Database tables based on ERD (database.sql):
// - LOCATION (location_id, city, area, latitude, longitude)
// - BLOOD_GROUP (bg_id, bg_name, rh_factor)
// - DONOR (donor_id, full_name, age, gender, email, blood_group, availability, last_donate, is_active, location_id)
// - CONTACT_NUMBER (contact_id, donor_id, phone_number)
// - BLOOD_COMPATIBILITY (comp_id, donor_bg, receiver_bg)
// - EMERGENCY_REQUEST (request_id, blood_group, hospital_name, request_date, location_id, contact_number)
// - OTP (otp_id, donor_id, otp_code, expiry_time, is_verified)
// Note: For initial setup, the system uses kv_store as fallback while proper tables are being migrated

// Helper function to get blood group ID from name
async function getBloodGroupId(bloodGroupName: string): Promise<number | null> {
  // Parse blood group name (e.g., "A+" -> bg_name: "A", rh_factor: "+")
  const match = bloodGroupName.match(/^(A|B|AB|O)([+-])$/);
  if (!match) return null;
  
  const [, bgName, rhFactor] = match;
  
  const { data } = await supabase
    .from('blood_group')
    .select('bg_id')
    .eq('bg_name', bgName)
    .eq('rh_factor', rhFactor)
    .single();
  
  return data?.bg_id || null;
}

// Helper function to get blood group name from ID
async function getBloodGroupName(bgId: number): Promise<string | null> {
  const { data } = await supabase
    .from('blood_group')
    .select('bg_name, rh_factor')
    .eq('bg_id', bgId)
    .single();
  
  return data ? `${data.bg_name}${data.rh_factor}` : null;
}

// Helper function to get or create location
async function getOrCreateLocation(city: string, area: string, latitude?: number, longitude?: number): Promise<number> {
  // Check if location exists
  let query = supabase
    .from('location')
    .select('location_id')
    .eq('city', city)
    .eq('area', area);
  
  const { data: existingLocation } = await query.single();
  
  if (existingLocation) {
    return existingLocation.location_id;
  }
  
  // Create new location
  const { data: newLocation, error } = await supabase
    .from('location')
    .insert({
      city,
      area,
      latitude: latitude || null,
      longitude: longitude || null,
    })
    .select('location_id')
    .single();
  
  if (error) {
    throw new Error('Failed to create location: ' + error.message);
  }
  
  return newLocation.location_id;
}

// Helper function to get compatible blood groups for a receiver
async function getCompatibleDonorBloodGroups(receiverBgId: number): Promise<number[]> {
  const { data } = await supabase
    .from('blood_compatibility')
    .select('donor_bg')
    .eq('receiver_bg', receiverBgId);
  
  return data?.map(d => d.donor_bg) || [];
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==================== AUTH ROUTES ====================
// OTP table in ERD: OTP (otp_id, donor_id, otp_code, expiry_time, is_verified)
// For auth, we need a temporary storage before donor registration, using kv_store as fallback

// Request OTP for signup/login
app.post('/make-server-6e4ea9c3/auth/request-otp', async (c) => {
  try {
    const { email, phone, type } = await c.req.json();
    
    if (!email && !phone) {
      return c.json({ error: 'Email or phone required' }, 400);
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if user is already a registered donor (using email)
    if (email) {
      const { data: existingDonor } = await supabase
        .from('donor')
        .select('donor_id')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (existingDonor) {
        // Store OTP in the OTP table for existing donor (per ERD)
        await supabase.from('otp').insert({
          donor_id: existingDonor.donor_id,
          otp_code: otp,
          expiry_time: expiresAt.toISOString(),
          is_verified: false,
        });
      } else {
        // New user - store OTP temporarily in kv_store
        await supabase.from('kv_store_6e4ea9c3').upsert({
          key: `otp:${email}`,
          value: JSON.stringify({ otp, expiresAt, type, email, phone }),
        });
      }
    } else if (phone) {
      // For phone-based auth, check contact_number table
      const { data: contactRecord } = await supabase
        .from('contact_number')
        .select('donor_id')
        .eq('phone_number', phone)
        .single();

      if (contactRecord) {
        await supabase.from('otp').insert({
          donor_id: contactRecord.donor_id,
          otp_code: otp,
          expiry_time: expiresAt.toISOString(),
          is_verified: false,
        });
      } else {
        // New user - store OTP temporarily
        await supabase.from('kv_store_6e4ea9c3').upsert({
          key: `otp:${phone}`,
          value: JSON.stringify({ otp, expiresAt, type, email, phone }),
        });
      }
    }

    // In production, send OTP via email/SMS service
    console.log(`OTP for ${email || phone}: ${otp}`);

    return c.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // FOR DEMO ONLY - Remove in production
      otp: otp 
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    return c.json({ error: 'Failed to send OTP' }, 500);
  }
});

// Verify OTP and create/login user
app.post('/make-server-6e4ea9c3/auth/verify-otp', async (c) => {
  try {
    const { email, phone, otp } = await c.req.json();
    
    let userData = null;
    let isExistingDonor = false;

    // First, check if user is an existing donor
    if (email) {
      const { data: existingDonor } = await supabase
        .from('donor')
        .select('donor_id, full_name, email')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (existingDonor) {
        // Verify OTP from OTP table (per ERD)
        const { data: otpRecord } = await supabase
          .from('otp')
          .select('*')
          .eq('donor_id', existingDonor.donor_id)
          .eq('otp_code', otp)
          .eq('is_verified', false)
          .gte('expiry_time', new Date().toISOString())
          .order('expiry_time', { ascending: false })
          .limit(1)
          .single();

        if (!otpRecord) {
          return c.json({ error: 'Invalid or expired OTP' }, 400);
        }

        // Mark OTP as verified
        await supabase
          .from('otp')
          .update({ is_verified: true })
          .eq('otp_id', otpRecord.otp_id);

        isExistingDonor = true;
        userData = {
          id: existingDonor.donor_id.toString(),
          email: existingDonor.email,
          phone,
          createdAt: new Date().toISOString(),
          isActive: true,
          donorId: existingDonor.donor_id,
        };
      }
    }

    if (phone && !isExistingDonor) {
      const { data: contactRecord } = await supabase
        .from('contact_number')
        .select('donor_id, donor!inner(donor_id, full_name, email, is_active)')
        .eq('phone_number', phone)
        .single();

      if (contactRecord && contactRecord.donor?.is_active) {
        // Verify OTP from OTP table
        const { data: otpRecord } = await supabase
          .from('otp')
          .select('*')
          .eq('donor_id', contactRecord.donor_id)
          .eq('otp_code', otp)
          .eq('is_verified', false)
          .gte('expiry_time', new Date().toISOString())
          .order('expiry_time', { ascending: false })
          .limit(1)
          .single();

        if (!otpRecord) {
          return c.json({ error: 'Invalid or expired OTP' }, 400);
        }

        // Mark OTP as verified
        await supabase
          .from('otp')
          .update({ is_verified: true })
          .eq('otp_id', otpRecord.otp_id);

        isExistingDonor = true;
        userData = {
          id: contactRecord.donor_id.toString(),
          email: contactRecord.donor.email,
          phone,
          createdAt: new Date().toISOString(),
          isActive: true,
          donorId: contactRecord.donor_id,
        };
      }
    }

    // If not an existing donor, check kv_store for new user OTP
    if (!isExistingDonor) {
      const key = `otp:${email || phone}`;
      const { data: kvData } = await supabase
        .from('kv_store_6e4ea9c3')
        .select('value')
        .eq('key', key)
        .single();

      if (!kvData) {
        return c.json({ error: 'Invalid or expired OTP' }, 400);
      }

      const otpData = JSON.parse(kvData.value);
      
      if (otpData.otp !== otp) {
        return c.json({ error: 'Invalid OTP' }, 400);
      }

      if (new Date(otpData.expiresAt) < new Date()) {
        return c.json({ error: 'OTP expired' }, 400);
      }

      // Clean up OTP from kv_store
      await supabase.from('kv_store_6e4ea9c3').delete().eq('key', key);

      // Create temporary user data (full donor registration happens later)
      const identifier = email || phone;
      const { data: existingUser } = await supabase
        .from('kv_store_6e4ea9c3')
        .select('value')
        .eq('key', `user:${identifier}`)
        .single();

      if (existingUser) {
        userData = JSON.parse(existingUser.value);
      } else {
        userData = {
          id: crypto.randomUUID(),
          email,
          phone,
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        
        await supabase.from('kv_store_6e4ea9c3').insert({
          key: `user:${identifier}`,
          value: JSON.stringify(userData),
        });
      }
    }

    // Create session token
    const sessionToken = crypto.randomUUID();
    await supabase.from('kv_store_6e4ea9c3').insert({
      key: `session:${sessionToken}`,
      value: JSON.stringify({ 
        userId: userData.id, 
        donorId: userData.donorId || null,
        createdAt: new Date().toISOString() 
      }),
    });

    return c.json({ 
      success: true,
      token: sessionToken,
      user: userData,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return c.json({ error: 'Failed to verify OTP' }, 500);
  }
});

// ==================== DONOR ROUTES ====================
// Based on ERD: DONOR table with relationships to LOCATION, BLOOD_GROUP, and CONTACT_NUMBER

// Register new donor
app.post('/make-server-6e4ea9c3/donors/register', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: session } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('value')
      .eq('key', `session:${token}`)
      .single();

    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const { userId } = JSON.parse(session.value);
    const donorData = await c.req.json();

    // Validate age (per ERD: CHECK (age >= 18))
    if (donorData.age < 18) {
      return c.json({ error: 'Donor must be 18 or above' }, 400);
    }

    // Validate blood group
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(donorData.bloodGroup)) {
      return c.json({ error: 'Invalid blood group' }, 400);
    }

    // Check for duplicate email (per ERD: email is UNIQUE)
    const { data: existingByEmail } = await supabase
      .from('donor')
      .select('donor_id')
      .eq('email', donorData.email)
      .eq('is_active', true)
      .single();

    if (existingByEmail) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Check for duplicate phone in contact_number table
    const { data: existingByPhone } = await supabase
      .from('contact_number')
      .select('donor_id, donor!inner(is_active)')
      .eq('phone_number', donorData.phone)
      .single();

    if (existingByPhone && existingByPhone.donor?.is_active) {
      return c.json({ error: 'Phone number already registered' }, 400);
    }

    // Get blood group ID from BLOOD_GROUP table (per ERD relationship)
    const bloodGroupId = await getBloodGroupId(donorData.bloodGroup);
    if (!bloodGroupId) {
      return c.json({ error: 'Invalid blood group' }, 400);
    }

    // Get or create location (per ERD: DONOR -> LOCATION relationship)
    const locationId = await getOrCreateLocation(
      donorData.city,
      donorData.area,
      donorData.latitude,
      donorData.longitude
    );

    // Map gender to database format
    const genderMap: Record<string, string> = {
      'Male': 'M',
      'Female': 'F',
      'Other': 'O'
    };

    // Insert donor into DONOR table (per ERD schema)
    const { data: newDonor, error: donorError } = await supabase
      .from('donor')
      .insert({
        full_name: donorData.name,
        age: donorData.age,
        gender: genderMap[donorData.gender] || donorData.gender,
        email: donorData.email,
        blood_group: bloodGroupId,
        availability: true,
        last_donate: null,
        is_active: true,
        location_id: locationId,
      })
      .select('donor_id')
      .single();

    if (donorError) {
      console.error('Donor insert error:', donorError);
      return c.json({ error: 'Failed to register donor: ' + donorError.message }, 500);
    }

    // Insert primary phone into CONTACT_NUMBER table (per ERD: 1:N relationship)
    await supabase.from('contact_number').insert({
      donor_id: newDonor.donor_id,
      phone_number: donorData.phone,
    });

    // Insert alternate phone if provided
    if (donorData.alternatePhone) {
      await supabase.from('contact_number').insert({
        donor_id: newDonor.donor_id,
        phone_number: donorData.alternatePhone,
      });
    }

    // Update session with donor ID
    const sessionData = JSON.parse(session.value);
    sessionData.donorId = newDonor.donor_id;
    await supabase
      .from('kv_store_6e4ea9c3')
      .update({ value: JSON.stringify(sessionData) })
      .eq('key', `session:${token}`);

    // Return donor data in frontend-expected format
    const donor = {
      id: newDonor.donor_id.toString(),
      name: donorData.name,
      email: donorData.email,
      phone: donorData.phone,
      alternatePhone: donorData.alternatePhone,
      age: donorData.age,
      gender: donorData.gender,
      bloodGroup: donorData.bloodGroup,
      city: donorData.city,
      area: donorData.area,
      address: donorData.address || '',
      latitude: donorData.latitude,
      longitude: donorData.longitude,
      isAvailable: true,
      isDeleted: false,
      lastDonationDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return c.json({ success: true, donor });
  } catch (error) {
    console.error('Error registering donor:', error);
    return c.json({ error: 'Failed to register donor' }, 500);
  }
});

// Get donor profile
app.get('/make-server-6e4ea9c3/donors/profile', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: session } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('value')
      .eq('key', `session:${token}`)
      .single();

    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const sessionData = JSON.parse(session.value);
    const donorId = sessionData.donorId;

    if (!donorId) {
      return c.json({ error: 'Donor not found' }, 404);
    }

    // Query donor from DONOR table with location join (per ERD relationships)
    const { data: donorRecord, error: donorError } = await supabase
      .from('donor')
      .select(`
        donor_id,
        full_name,
        age,
        gender,
        email,
        blood_group,
        availability,
        last_donate,
        is_active,
        location:location_id (
          location_id,
          city,
          area,
          latitude,
          longitude
        )
      `)
      .eq('donor_id', donorId)
      .eq('is_active', true)
      .single();

    if (donorError || !donorRecord) {
      return c.json({ error: 'Donor not found' }, 404);
    }

    // Get blood group name
    const bloodGroupName = await getBloodGroupName(donorRecord.blood_group);

    // Get contact numbers from CONTACT_NUMBER table (per ERD: 1:N relationship)
    const { data: contacts } = await supabase
      .from('contact_number')
      .select('phone_number')
      .eq('donor_id', donorId);

    const phones = contacts?.map(c => c.phone_number) || [];

    // Map gender from database format
    const genderMap: Record<string, string> = {
      'M': 'Male',
      'F': 'Female',
      'O': 'Other'
    };

    // Calculate availability based on 90-day rule
    let isAvailable = donorRecord.availability;
    if (donorRecord.last_donate) {
      const daysSinceLastDonation = Math.floor(
        (new Date().getTime() - new Date(donorRecord.last_donate).getTime()) / (1000 * 60 * 60 * 24)
      );
      isAvailable = daysSinceLastDonation >= 90;
    }

    // Return donor data in frontend-expected format
    const donor = {
      id: donorRecord.donor_id.toString(),
      name: donorRecord.full_name,
      email: donorRecord.email,
      phone: phones[0] || '',
      alternatePhone: phones[1] || '',
      age: donorRecord.age,
      gender: genderMap[donorRecord.gender] || donorRecord.gender,
      bloodGroup: bloodGroupName,
      city: donorRecord.location?.city || '',
      area: donorRecord.location?.area || '',
      address: '', // Address stored separately if needed
      latitude: donorRecord.location?.latitude,
      longitude: donorRecord.location?.longitude,
      isAvailable,
      isDeleted: !donorRecord.is_active,
      lastDonationDate: donorRecord.last_donate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return c.json({ donor });
  } catch (error) {
    console.error('Error fetching donor profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update donor profile
app.put('/make-server-6e4ea9c3/donors/profile', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: session } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('value')
      .eq('key', `session:${token}`)
      .single();

    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const sessionData = JSON.parse(session.value);
    const donorId = sessionData.donorId;

    if (!donorId) {
      return c.json({ error: 'Donor not found' }, 404);
    }

    const updates = await c.req.json();

    // Update location if city/area changed
    if (updates.city || updates.area) {
      const { data: currentDonor } = await supabase
        .from('donor')
        .select('location:location_id(city, area)')
        .eq('donor_id', donorId)
        .single();

      const newCity = updates.city || currentDonor?.location?.city;
      const newArea = updates.area || currentDonor?.location?.area;

      if (newCity && newArea) {
        const locationId = await getOrCreateLocation(
          newCity,
          newArea,
          updates.latitude,
          updates.longitude
        );

        await supabase
          .from('donor')
          .update({ location_id: locationId })
          .eq('donor_id', donorId);
      }
    }

    // Update phone numbers if changed
    if (updates.phone) {
      // Get existing contacts
      const { data: existingContacts } = await supabase
        .from('contact_number')
        .select('contact_id, phone_number')
        .eq('donor_id', donorId)
        .order('contact_id');

      // Update primary phone
      if (existingContacts && existingContacts.length > 0) {
        await supabase
          .from('contact_number')
          .update({ phone_number: updates.phone })
          .eq('contact_id', existingContacts[0].contact_id);
      } else {
        await supabase.from('contact_number').insert({
          donor_id: donorId,
          phone_number: updates.phone,
        });
      }

      // Update alternate phone
      if (updates.alternatePhone) {
        if (existingContacts && existingContacts.length > 1) {
          await supabase
            .from('contact_number')
            .update({ phone_number: updates.alternatePhone })
            .eq('contact_id', existingContacts[1].contact_id);
        } else {
          await supabase.from('contact_number').insert({
            donor_id: donorId,
            phone_number: updates.alternatePhone,
          });
        }
      }
    }

    // Update last donation date and availability
    if (updates.lastDonationDate) {
      const daysSinceLastDonation = Math.floor(
        (new Date().getTime() - new Date(updates.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const isAvailable = daysSinceLastDonation >= 90;

      await supabase
        .from('donor')
        .update({
          last_donate: updates.lastDonationDate,
          availability: isAvailable,
        })
        .eq('donor_id', donorId);
    }

    // Fetch updated donor profile
    const { data: updatedDonor } = await supabase
      .from('donor')
      .select(`
        donor_id,
        full_name,
        age,
        gender,
        email,
        blood_group,
        availability,
        last_donate,
        is_active,
        location:location_id (
          location_id,
          city,
          area,
          latitude,
          longitude
        )
      `)
      .eq('donor_id', donorId)
      .single();

    if (!updatedDonor) {
      return c.json({ error: 'Failed to fetch updated profile' }, 500);
    }

    const bloodGroupName = await getBloodGroupName(updatedDonor.blood_group);

    const { data: contacts } = await supabase
      .from('contact_number')
      .select('phone_number')
      .eq('donor_id', donorId);

    const phones = contacts?.map(c => c.phone_number) || [];

    const genderMap: Record<string, string> = {
      'M': 'Male',
      'F': 'Female',
      'O': 'Other'
    };

    const donor = {
      id: updatedDonor.donor_id.toString(),
      name: updatedDonor.full_name,
      email: updatedDonor.email,
      phone: phones[0] || '',
      alternatePhone: phones[1] || '',
      age: updatedDonor.age,
      gender: genderMap[updatedDonor.gender] || updatedDonor.gender,
      bloodGroup: bloodGroupName,
      city: updatedDonor.location?.city || '',
      area: updatedDonor.location?.area || '',
      address: updates.address || '',
      latitude: updatedDonor.location?.latitude,
      longitude: updatedDonor.location?.longitude,
      isAvailable: updatedDonor.availability,
      isDeleted: !updatedDonor.is_active,
      lastDonationDate: updatedDonor.last_donate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return c.json({ success: true, donor });
  } catch (error) {
    console.error('Error updating donor profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Soft delete donor (per ERD: is_active flag for soft delete)
app.delete('/make-server-6e4ea9c3/donors/profile', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: session } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('value')
      .eq('key', `session:${token}`)
      .single();

    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const sessionData = JSON.parse(session.value);
    const donorId = sessionData.donorId;

    if (!donorId) {
      return c.json({ error: 'Donor not found' }, 404);
    }

    // Soft delete: set is_active to false (per ERD)
    const { error: updateError } = await supabase
      .from('donor')
      .update({ is_active: false })
      .eq('donor_id', donorId);

    if (updateError) {
      return c.json({ error: 'Failed to deactivate donor' }, 500);
    }

    return c.json({ success: true, message: 'Donor marked as inactive' });
  } catch (error) {
    console.error('Error deleting donor:', error);
    return c.json({ error: 'Failed to delete donor' }, 500);
  }
});

// Search donors with filters (using normalized database structure per ERD)
app.post('/make-server-6e4ea9c3/donors/search', async (c) => {
  try {
    const filters = await c.req.json();
    const { bloodGroup, city, area, isAvailable } = filters;

    // Build query using proper table relationships per ERD
    let query = supabase
      .from('donor')
      .select(`
        donor_id,
        full_name,
        age,
        gender,
        email,
        blood_group,
        availability,
        last_donate,
        is_active,
        location:location_id (
          location_id,
          city,
          area,
          latitude,
          longitude
        )
      `)
      .eq('is_active', true);

    // Filter by blood group if specified
    if (bloodGroup) {
      const bgId = await getBloodGroupId(bloodGroup);
      if (bgId) {
        query = query.eq('blood_group', bgId);
      }
    }

    const { data: donorsData, error } = await query;

    if (error) {
      console.error('Search error:', error);
      return c.json({ donors: [] });
    }

    // Get all contact numbers for the donors
    const donorIds = donorsData?.map(d => d.donor_id) || [];
    const { data: contactsData } = await supabase
      .from('contact_number')
      .select('donor_id, phone_number')
      .in('donor_id', donorIds);

    // Group contacts by donor_id
    const contactsByDonor: Record<number, string[]> = {};
    contactsData?.forEach(c => {
      if (!contactsByDonor[c.donor_id]) {
        contactsByDonor[c.donor_id] = [];
      }
      contactsByDonor[c.donor_id].push(c.phone_number);
    });

    // Get all blood group names
    const { data: bloodGroups } = await supabase
      .from('blood_group')
      .select('bg_id, bg_name, rh_factor');

    const bgMap: Record<number, string> = {};
    bloodGroups?.forEach(bg => {
      bgMap[bg.bg_id] = `${bg.bg_name}${bg.rh_factor}`;
    });

    const genderMap: Record<string, string> = {
      'M': 'Male',
      'F': 'Female',
      'O': 'Other'
    };

    // Transform and filter donors
    let donors = (donorsData || []).map(d => {
      // Calculate availability based on 90-day rule
      let availability = d.availability;
      if (d.last_donate) {
        const daysSinceLastDonation = Math.floor(
          (new Date().getTime() - new Date(d.last_donate).getTime()) / (1000 * 60 * 60 * 24)
        );
        availability = daysSinceLastDonation >= 90;
      }

      return {
        id: d.donor_id.toString(),
        name: d.full_name,
        email: d.email,
        phone: contactsByDonor[d.donor_id]?.[0] || '',
        alternatePhone: contactsByDonor[d.donor_id]?.[1] || '',
        age: d.age,
        gender: genderMap[d.gender] || d.gender,
        bloodGroup: bgMap[d.blood_group] || '',
        city: d.location?.city || '',
        area: d.location?.area || '',
        address: '',
        latitude: d.location?.latitude,
        longitude: d.location?.longitude,
        isAvailable: availability,
        isDeleted: !d.is_active,
        lastDonationDate: d.last_donate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // Apply location filters
    if (city) {
      donors = donors.filter(d => d.city?.toLowerCase().includes(city.toLowerCase()));
    }

    if (area) {
      donors = donors.filter(d => d.area?.toLowerCase().includes(area.toLowerCase()));
    }

    // Apply availability filter
    if (isAvailable !== undefined) {
      donors = donors.filter(d => d.isAvailable === isAvailable);
    }

    return c.json({ donors });
  } catch (error) {
    console.error('Error searching donors:', error);
    return c.json({ error: 'Failed to search donors' }, 500);
  }
});

// ==================== BLOOD REQUEST ROUTES ====================
// Based on ERD: EMERGENCY_REQUEST table with relationships to BLOOD_GROUP and LOCATION
// BLOOD_COMPATIBILITY table defines which blood types can donate to which receivers

// Create blood request and match donors (using normalized database per ERD)
app.post('/make-server-6e4ea9c3/requests/create', async (c) => {
  try {
    const requestData = await c.req.json();
    const { bloodGroup, city, area, hospitalName, contactPhone } = requestData;

    // Get blood group ID
    const bloodGroupId = await getBloodGroupId(bloodGroup);
    if (!bloodGroupId) {
      return c.json({ error: 'Invalid blood group' }, 400);
    }

    // Get or create location
    const locationId = await getOrCreateLocation(city, area || '');

    // Create emergency request in EMERGENCY_REQUEST table (per ERD)
    const { data: newRequest, error: requestError } = await supabase
      .from('emergency_request')
      .insert({
        blood_group: bloodGroupId,
        hospital_name: hospitalName,
        request_date: new Date().toISOString(),
        location_id: locationId,
        contact_number: contactPhone,
      })
      .select('request_id')
      .single();

    if (requestError) {
      console.error('Request insert error:', requestError);
      return c.json({ error: 'Failed to create request: ' + requestError.message }, 500);
    }

    // Get compatible donor blood groups from BLOOD_COMPATIBILITY table (per ERD)
    const compatibleDonorBgIds = await getCompatibleDonorBloodGroups(bloodGroupId);

    // Find compatible, available donors in the same city
    const { data: donorsData } = await supabase
      .from('donor')
      .select(`
        donor_id,
        full_name,
        blood_group,
        availability,
        last_donate,
        is_active,
        location:location_id (
          city,
          area,
          latitude,
          longitude
        )
      `)
      .eq('is_active', true)
      .in('blood_group', compatibleDonorBgIds);

    // Get contact numbers for compatible donors
    const donorIds = donorsData?.map(d => d.donor_id) || [];
    const { data: contactsData } = await supabase
      .from('contact_number')
      .select('donor_id, phone_number')
      .in('donor_id', donorIds);

    const contactsByDonor: Record<number, string> = {};
    contactsData?.forEach(c => {
      if (!contactsByDonor[c.donor_id]) {
        contactsByDonor[c.donor_id] = c.phone_number;
      }
    });

    // Get blood group names
    const { data: bloodGroups } = await supabase
      .from('blood_group')
      .select('bg_id, bg_name, rh_factor');

    const bgMap: Record<number, string> = {};
    bloodGroups?.forEach(bg => {
      bgMap[bg.bg_id] = `${bg.bg_name}${bg.rh_factor}`;
    });

    // Filter and transform matched donors
    const matchedDonors = (donorsData || [])
      .filter(d => {
        // Check location matches
        if (!d.location?.city?.toLowerCase().includes(city.toLowerCase())) {
          return false;
        }
        
        // Check availability (90-day rule)
        let isAvailable = d.availability;
        if (d.last_donate) {
          const daysSinceLastDonation = Math.floor(
            (new Date().getTime() - new Date(d.last_donate).getTime()) / (1000 * 60 * 60 * 24)
          );
          isAvailable = daysSinceLastDonation >= 90;
        }
        return isAvailable;
      })
      .map(d => ({
        id: d.donor_id.toString(),
        name: d.full_name,
        bloodGroup: bgMap[d.blood_group] || '',
        city: d.location?.city || '',
        area: d.location?.area || '',
        phone: contactsByDonor[d.donor_id] || '',
        latitude: d.location?.latitude,
        longitude: d.location?.longitude,
      }));

    // Return request data in frontend-expected format
    const request = {
      id: newRequest.request_id.toString(),
      ...requestData,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    return c.json({ 
      success: true, 
      request, 
      matchedDonors
    });
  } catch (error) {
    console.error('Error creating blood request:', error);
    return c.json({ error: 'Failed to create request' }, 500);
  }
});

// Get all active requests
app.get('/make-server-6e4ea9c3/requests/active', async (c) => {
  try {
    const { data: requestsData, error } = await supabase
      .from('emergency_request')
      .select(`
        request_id,
        blood_group,
        hospital_name,
        request_date,
        contact_number,
        location:location_id (
          city,
          area
        )
      `)
      .order('request_date', { ascending: false });

    if (error) {
      console.error('Fetch requests error:', error);
      return c.json({ requests: [] });
    }

    // Get blood group names
    const { data: bloodGroups } = await supabase
      .from('blood_group')
      .select('bg_id, bg_name, rh_factor');

    const bgMap: Record<number, string> = {};
    bloodGroups?.forEach(bg => {
      bgMap[bg.bg_id] = `${bg.bg_name}${bg.rh_factor}`;
    });

    const requests = (requestsData || []).map(r => ({
      id: r.request_id.toString(),
      bloodGroup: bgMap[r.blood_group] || '',
      hospitalName: r.hospital_name,
      city: r.location?.city || '',
      area: r.location?.area || '',
      contactPhone: r.contact_number,
      createdAt: r.request_date,
      status: 'active',
    }));

    return c.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return c.json({ error: 'Failed to fetch requests' }, 500);
  }
});

// ==================== STATISTICS ROUTES ====================
// Query statistics from normalized database tables per ERD

app.get('/make-server-6e4ea9c3/statistics', async (c) => {
  try {
    // Get all donors with their blood groups and locations
    const { data: donorsData, error } = await supabase
      .from('donor')
      .select(`
        donor_id,
        blood_group,
        availability,
        last_donate,
        is_active,
        location:location_id (
          city
        )
      `);

    if (error) {
      console.error('Statistics error:', error);
      return c.json({ 
        totalDonors: 0,
        activeDonors: 0,
        inactiveDonors: 0,
        availableDonors: 0,
        unavailableDonors: 0,
        byBloodGroup: {},
        byCity: {},
      });
    }

    // Get blood group names
    const { data: bloodGroups } = await supabase
      .from('blood_group')
      .select('bg_id, bg_name, rh_factor');

    const bgMap: Record<number, string> = {};
    bloodGroups?.forEach(bg => {
      bgMap[bg.bg_id] = `${bg.bg_name}${bg.rh_factor}`;
    });

    const donors = donorsData || [];
    const activeDonors = donors.filter(d => d.is_active);
    const inactiveDonors = donors.filter(d => !d.is_active);

    // Calculate availability with 90-day rule
    const availableDonors = activeDonors.filter(d => {
      if (d.last_donate) {
        const daysSinceLastDonation = Math.floor(
          (new Date().getTime() - new Date(d.last_donate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceLastDonation >= 90;
      }
      return d.availability;
    });

    const unavailableDonors = activeDonors.filter(d => {
      if (d.last_donate) {
        const daysSinceLastDonation = Math.floor(
          (new Date().getTime() - new Date(d.last_donate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceLastDonation < 90;
      }
      return !d.availability;
    });

    // Blood group statistics
    const byBloodGroup: Record<string, number> = {};
    activeDonors.forEach(d => {
      const bgName = bgMap[d.blood_group] || 'Unknown';
      byBloodGroup[bgName] = (byBloodGroup[bgName] || 0) + 1;
    });

    // City statistics
    const byCity: Record<string, number> = {};
    activeDonors.forEach(d => {
      const city = d.location?.city || 'Unknown';
      byCity[city] = (byCity[city] || 0) + 1;
    });

    return c.json({
      totalDonors: activeDonors.length,
      activeDonors: activeDonors.length,
      inactiveDonors: inactiveDonors.length,
      availableDonors: availableDonors.length,
      unavailableDonors: unavailableDonors.length,
      byBloodGroup,
      byCity,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return c.json({ error: 'Failed to fetch statistics' }, 500);
  }
});

console.log('Blood Donor Management Server starting...');
console.log('Using normalized database tables per ERD schema');

Deno.serve(app.fetch);
