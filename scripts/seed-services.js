// scripts/seed-services.js
require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('../src/models/Service');

const servicesData = [
    // Assessment Category
    {
        id: 'site-survey-design',
        title: 'Site Survey & Design',
        badge: 'SITE ASSESSMENT',
        description: 'Electrical capacity & layout assessment',
        details: 'Our expert team conducts comprehensive on-site surveys...',
        icon: '📋',
        imageUrl: '/images/services/site-survey.jpg',
        color: 'bg-[#0c1f38]',
        features: ['Comprehensive electrical capacity analysis', 'Optimal charger placement planning'],
        process: ['Initial consultation', 'On-site assessment'],
        price: 'Free Consultation',
        duration: '2-3 Days',
        actionText: 'Book Consultation',
        category: 'assessment',
        isActive: true,
    },
    
    // Installation Category
    {
        id: 'installation-commissioning',
        title: 'Installation & Commissioning',
        badge: 'INSTALLATION',
        description: 'Mounting, hookup & network go-live',
        details: 'Our certified installation team handles everything...',
        icon: '🚧',
        imageUrl: '/images/services/installation.jpg',
        color: 'bg-[#1f7a3d]',
        features: ['Professional mounting', 'Electrical hookup'],
        process: ['Site preparation', 'Mounting and installation'],
        duration: '1-3 Days',
        actionText: 'Schedule Installation',
        category: 'installation',
        isActive: true,
    },
    
    // Maintenance Category
    {
        id: 'maintenance-om',
        title: 'Maintenance & O&M',
        badge: 'MAINTENANCE',
        description: 'Inspections, firmware & repair contracts',
        details: 'Keep your charging infrastructure running...',
        icon: '🔧',
        imageUrl: '/images/services/maintenance.jpg',
        color: 'bg-[#12946b]',
        features: ['Preventive maintenance', '24/7 emergency support'],
        process: ['Scheduled maintenance visits', 'Performance monitoring'],
        price: 'Custom Pricing',
        duration: 'Ongoing',
        actionText: 'Request Maintenance',
        category: 'maintenance',
        isActive: true,
    },
    
    // Support Category
    {
        id: 'software-remote-support',
        title: 'Software & Remote Support',
        badge: 'REMOTE SUPPORT',
        description: 'Remote diagnostics, 24/7 monitoring',
        details: 'Our cloud-based software platform provides...',
        icon: '🎧',
        imageUrl: '/images/services/software.jpg',
        color: 'bg-[#2a3f66]',
        features: ['Real-time monitoring', '24/7 technical support'],
        process: ['Platform setup', 'Network integration'],
        price: 'Subscription-based',
        duration: 'Ongoing',
        actionText: 'Learn More',
        category: 'support',
        isActive: true,
    },
    
    // Training Category
    {
        id: 'training-certification',
        title: 'Training & Certification',
        badge: 'TRAINING',
        description: 'Operator & technician certification programs',
        details: 'Our comprehensive training programs certify operators...',
        icon: '🎓',
        imageUrl: '/images/services/training.jpg',
        color: 'bg-[#16493f]',
        features: ['Hands-on training', 'Certification programs'],
        process: ['Needs assessment', 'Training delivery'],
        price: 'Varies by Program',
        duration: '1-3 Days',
        actionText: 'View Programs',
        category: 'training',
        isActive: true,
    },
    
    // Custom Category
    {
        id: 'custom-solutions',
        title: 'Custom Solutions',
        badge: 'CUSTOM',
        description: 'Tailored solutions for unique requirements',
        details: 'Every project is unique. Our team works closely...',
        icon: '⚡',
        imageUrl: '/images/services/custom.jpg',
        color: 'bg-[#0c2138]',
        features: ['Custom hardware', 'Software integration'],
        process: ['Requirements analysis', 'Design and engineering'],
        price: 'Custom Pricing',
        duration: 'Project-based',
        actionText: 'Get Quote',
        category: 'custom',
        isActive: true,
    },
];

async function seedServices() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dev3ngenit_db_user:p6YKLnqrvR1ACAS9@cluster0.ehgp8m0.mongodb.net/evngen?appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        await Service.deleteMany({});
        console.log('🗑️ Cleared existing services');

        const inserted = await Service.insertMany(servicesData);
        console.log(`✅ Inserted ${inserted.length} services`);

        console.log('\n📋 Services seeded by category:');
        const categories = ['assessment', 'installation', 'maintenance', 'support', 'training', 'custom'];
        categories.forEach(cat => {
            const count = inserted.filter(s => s.category === cat).length;
            console.log(`  - ${cat}: ${count} services`);
        });

        console.log('\n🎉 Services seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedServices();