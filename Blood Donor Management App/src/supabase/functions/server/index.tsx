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

// Initialize database tables
async function initializeDatabase() {
  console.log('Database tables should be created through Supabase dashboard');
  // Tables needed:
  // - donors (with unique constraints on email and phone)
  // - blood_requests
  // - donor_contacts
  // - donation_history
  // - cities
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==================== AUTH ROUTES ====================

// Request OTP for signup/login
app.post('/make-server-6e4ea9c3/auth/request-otp', async (c) => {
  try {
    const { email, phone, type } = await c.req.json();
    
    if (!email && !phone) {
      return c.json({ error: 'Email or phone required' }, 400);
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in key-value store
    const key = `otp:${email || phone}`;
    await supabase.from('kv_store_6e4ea9c3').upsert({
      key,
      value: JSON.stringify({ otp, expiresAt, type, email, phone }),
    });

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

    // Check if user exists
    const identifier = email || phone;
    const { data: existingUser } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('value')
      .eq('key', `user:${identifier}`)
      .single();

    let userData;
    if (existingUser) {
      userData = JSON.parse(existingUser.value);
    } else {
      // Create new user
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

    // Create session token
    const sessionToken = crypto.randomUUID();
    await supabase.from('kv_store_6e4ea9c3').insert({
      key: `session:${sessionToken}`,
      value: JSON.stringify({ userId: userData.id, createdAt: new Date().toISOString() }),
    });

    // Clean up OTP
    await supabase.from('kv_store_6e4ea9c3').delete().eq('key', key);

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

    // Validate age
    if (donorData.age < 18) {
      return c.json({ error: 'Donor must be 18 or above' }, 400);
    }

    // Validate blood group
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(donorData.bloodGroup)) {
      return c.json({ error: 'Invalid blood group' }, 400);
    }

    // Check for duplicate phone/email
    const { data: existingDonors } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('key, value')
      .like('key', 'donor:%');

    if (existingDonors) {
      for (const d of existingDonors) {
        const donor = JSON.parse(d.value);
        if (!donor.isDeleted && (donor.phone === donorData.phone || donor.email === donorData.email)) {
          return c.json({ error: 'Phone or email already registered' }, 400);
        }
      }
    }

    const donor = {
      id: crypto.randomUUID(),
      userId,
      ...donorData,
      isAvailable: true,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastDonationDate: null,
    };

    await supabase.from('kv_store_6e4ea9c3').insert({
      key: `donor:${donor.id}`,
      value: JSON.stringify(donor),
    });

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

    const { userId } = JSON.parse(session.value);

    const { data: donors } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('value')
      .like('key', 'donor:%');

    if (!donors) {
      return c.json({ error: 'Donor not found' }, 404);
    }

    const donor = donors
      .map(d => JSON.parse(d.value))
      .find(d => d.userId === userId && !d.isDeleted);

    if (!donor) {
      return c.json({ error: 'Donor not found' }, 404);
    }

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

    const { userId } = JSON.parse(session.value);
    const updates = await c.req.json();

    const { data: donors } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('key, value')
      .like('key', 'donor:%');

    if (!donors) {
      return c.json({ error: 'Donor not found' }, 404);
    }

    const donorRecord = donors.find(d => {
      const donor = JSON.parse(d.value);
      return donor.userId === userId && !donor.isDeleted;
    });

    if (!donorRecord) {
      return c.json({ error: 'Donor not found' }, 404);
    }

    const donor = JSON.parse(donorRecord.value);
    const updatedDonor = {
      ...donor,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Update availability based on last donation
    if (updatedDonor.lastDonationDate) {
      const daysSinceLastDonation = Math.floor(
        (new Date().getTime() - new Date(updatedDonor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      updatedDonor.isAvailable = daysSinceLastDonation >= 90;
    }

    await supabase
      .from('kv_store_6e4ea9c3')
      .update({ value: JSON.stringify(updatedDonor) })
      .eq('key', donorRecord.key);

    return c.json({ success: true, donor: updatedDonor });
  } catch (error) {
    console.error('Error updating donor profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Soft delete donor
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

    const { userId } = JSON.parse(session.value);

    const { data: donors } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('key, value')
      .like('key', 'donor:%');

    if (!donors) {
      return c.json({ error: 'Donor not found' }, 404);
    }

    const donorRecord = donors.find(d => {
      const donor = JSON.parse(d.value);
      return donor.userId === userId && !donor.isDeleted;
    });

    if (!donorRecord) {
      return c.json({ error: 'Donor not found' }, 404);
    }

    const donor = JSON.parse(donorRecord.value);
    donor.isDeleted = true;
    donor.deletedAt = new Date().toISOString();

    await supabase
      .from('kv_store_6e4ea9c3')
      .update({ value: JSON.stringify(donor) })
      .eq('key', donorRecord.key);

    return c.json({ success: true, message: 'Donor marked as inactive' });
  } catch (error) {
    console.error('Error deleting donor:', error);
    return c.json({ error: 'Failed to delete donor' }, 500);
  }
});

// Search donors with filters
app.post('/make-server-6e4ea9c3/donors/search', async (c) => {
  try {
    const filters = await c.req.json();
    const { bloodGroup, city, area, isAvailable } = filters;

    const { data: donorsData } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('value')
      .like('key', 'donor:%');

    if (!donorsData) {
      return c.json({ donors: [] });
    }

    let donors = donorsData
      .map(d => JSON.parse(d.value))
      .filter(d => !d.isDeleted);

    if (bloodGroup) {
      donors = donors.filter(d => d.bloodGroup === bloodGroup);
    }

    if (city) {
      donors = donors.filter(d => d.city?.toLowerCase().includes(city.toLowerCase()));
    }

    if (area) {
      donors = donors.filter(d => d.area?.toLowerCase().includes(area.toLowerCase()));
    }

    if (isAvailable !== undefined) {
      donors = donors.filter(d => d.isAvailable === isAvailable);
    }

    // Update availability dynamically
    donors = donors.map(donor => {
      if (donor.lastDonationDate) {
        const daysSinceLastDonation = Math.floor(
          (new Date().getTime() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        donor.isAvailable = daysSinceLastDonation >= 90;
      }
      return donor;
    });

    return c.json({ donors });
  } catch (error) {
    console.error('Error searching donors:', error);
    return c.json({ error: 'Failed to search donors' }, 500);
  }
});

// ==================== BLOOD REQUEST ROUTES ====================

// Blood compatibility matrix
const compatibilityMatrix: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

// Create blood request and match donors
app.post('/make-server-6e4ea9c3/requests/create', async (c) => {
  try {
    const requestData = await c.req.json();
    const { bloodGroup, city, urgency } = requestData;

    const request = {
      id: crypto.randomUUID(),
      ...requestData,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    await supabase.from('kv_store_6e4ea9c3').insert({
      key: `request:${request.id}`,
      value: JSON.stringify(request),
    });

    // Find compatible donors
    const compatibleBloodGroups = compatibilityMatrix[bloodGroup] || [];

    const { data: donorsData } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('value')
      .like('key', 'donor:%');

    if (!donorsData) {
      return c.json({ request, matchedDonors: [] });
    }

    let matchedDonors = donorsData
      .map(d => JSON.parse(d.value))
      .filter(d => 
        !d.isDeleted &&
        d.isAvailable &&
        compatibleBloodGroups.includes(d.bloodGroup) &&
        d.city?.toLowerCase() === city?.toLowerCase()
      );

    // Update availability dynamically
    matchedDonors = matchedDonors.filter(donor => {
      if (donor.lastDonationDate) {
        const daysSinceLastDonation = Math.floor(
          (new Date().getTime() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceLastDonation >= 90;
      }
      return true;
    });

    return c.json({ 
      success: true, 
      request, 
      matchedDonors: matchedDonors.map(d => ({
        id: d.id,
        name: d.name,
        bloodGroup: d.bloodGroup,
        city: d.city,
        area: d.area,
        phone: d.phone,
        latitude: d.latitude,
        longitude: d.longitude,
      }))
    });
  } catch (error) {
    console.error('Error creating blood request:', error);
    return c.json({ error: 'Failed to create request' }, 500);
  }
});

// Get all active requests
app.get('/make-server-6e4ea9c3/requests/active', async (c) => {
  try {
    const { data: requestsData } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('value')
      .like('key', 'request:%');

    if (!requestsData) {
      return c.json({ requests: [] });
    }

    const requests = requestsData
      .map(r => JSON.parse(r.value))
      .filter(r => r.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return c.json({ error: 'Failed to fetch requests' }, 500);
  }
});

// ==================== STATISTICS ROUTES ====================

app.get('/make-server-6e4ea9c3/statistics', async (c) => {
  try {
    const { data: donorsData } = await supabase
      .from('kv_store_6e4ea9c3')
      .select('value')
      .like('key', 'donor:%');

    if (!donorsData) {
      return c.json({ 
        totalDonors: 0,
        activeDonors: 0,
        inactiveDonors: 0,
        byBloodGroup: {},
        byCity: {},
      });
    }

    const donors = donorsData.map(d => JSON.parse(d.value));
    const activeDonors = donors.filter(d => !d.isDeleted);
    const inactiveDonors = donors.filter(d => d.isDeleted);

    // Blood group statistics
    const byBloodGroup: Record<string, number> = {};
    activeDonors.forEach(d => {
      byBloodGroup[d.bloodGroup] = (byBloodGroup[d.bloodGroup] || 0) + 1;
    });

    // City statistics
    const byCity: Record<string, number> = {};
    activeDonors.forEach(d => {
      if (d.city) {
        byCity[d.city] = (byCity[d.city] || 0) + 1;
      }
    });

    // Availability statistics
    const availableDonors = activeDonors.filter(d => d.isAvailable).length;
    const unavailableDonors = activeDonors.filter(d => !d.isAvailable).length;

    return c.json({
      totalDonors: activeDonors.length,
      activeDonors: activeDonors.length,
      inactiveDonors: inactiveDonors.length,
      availableDonors,
      unavailableDonors,
      byBloodGroup,
      byCity,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return c.json({ error: 'Failed to fetch statistics' }, 500);
  }
});

console.log('Blood Donor Management Server starting...');

Deno.serve(app.fetch);
