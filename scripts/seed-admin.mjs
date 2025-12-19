import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Use a specific password for the admin user
    const password = 'BzionAdmin@2024!Secure';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update admin user
    const admin = await prisma.user.upsert({
      where: { email: 'bola@bzion.shop' },
      update: {
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isNewUser: true,
        lastLogin: null,
        hasCompletedOnboarding: false,
        emailVerified: new Date(),
      },
      create: {
        email: 'bola@bzion.shop',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isNewUser: true,
        lastLogin: null,
        hasCompletedOnboarding: false,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Admin user created/updated successfully');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔐 Password: ${password}`);
    console.log(`⚠️  Please save this password securely`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
