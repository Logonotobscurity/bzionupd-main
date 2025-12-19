import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Use a fixed secure password for admin
    const password = 'BzionAdmin@2024!Secure';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update admin user
    const admin = await prisma.user.upsert({
      where: { email: 'bola@bzion.shop' },
      update: {
        hashedPassword: hashedPassword,
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
        hashedPassword: hashedPassword,
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
    console.log(`🔐 Temporary Password: ${password}`);
    console.log(`⚠️  Please save this password securely and change it after first login`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
