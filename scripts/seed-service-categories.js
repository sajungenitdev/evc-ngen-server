// scripts/seed-service-categories.js
require('dotenv').config();
const mongoose = require('mongoose');
const ServiceCategory = require('../src/models/ServiceCategory');

const categoriesData = [
    {
        id: 'assessment',
        name: 'Assessment',
        slug: 'assessment',
        description: 'Site surveys, assessments, and consultations',
        icon: '📋',
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        order: 1,
        isActive: true,
    },
    {
        id: 'installation',
        name: 'Installation',
        slug: 'installation',
        description: 'Professional installation and commissioning services',
        icon: '🚧',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        order: 2,
        isActive: true,
    },
    {
        id: 'maintenance',
        name: 'Maintenance',
        slug: 'maintenance',
        description: 'Ongoing maintenance and operations services',
        icon: '🔧',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        order: 3,
        isActive: true,
    },
    {
        id: 'support',
        name: 'Support',
        slug: 'support',
        description: 'Remote support and software services',
        icon: '🎧',
        color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        order: 4,
        isActive: true,
    },
    {
        id: 'training',
        name: 'Training',
        slug: 'training',
        description: 'Certification and training programs',
        icon: '🎓',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        order: 5,
        isActive: true,
    },
    {
        id: 'custom',
        name: 'Custom',
        slug: 'custom',
        description: 'Custom solutions and special projects',
        icon: '⚡',
        color: 'bg-rose-100 text-rose-700 border-rose-200',
        order: 6,
        isActive: true,
    },
];

async function seedServiceCategories() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dev3ngenit_db_user:p6YKLnqrvR1ACAS9@cluster0.ehgp8m0.mongodb.net/evngen?appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        await ServiceCategory.deleteMany({});
        console.log('🗑️ Cleared existing service categories');

        const inserted = await ServiceCategory.insertMany(categoriesData);
        console.log(`✅ Inserted ${inserted.length} service categories`);

        console.log('\n📋 Service Categories seeded:');
        inserted.forEach(cat => {
            console.log(`  - ${cat.name} (${cat.id})`);
        });

        console.log('\n🎉 Service categories seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedServiceCategories();