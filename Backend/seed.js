const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Faculty = require('./models/Faculty');
const Department = require('./models/Department');
const Course = require('./models/Course');
const Unit = require('./models/Unit');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data (safe to run multiple times)
    await Faculty.deleteMany();
    await Department.deleteMany();
    await Course.deleteMany();
    await Unit.deleteMany();

    // Create Faculties
    const sci = await Faculty.create({ name: 'School of Computing and Informatics', code: 'SCI' });
    const sedu = await Faculty.create({ name: 'School of Education', code: 'SEDU' });

    // Create Departments under each Faculty
    const computerScience = await Department.create({ name: 'Computer Science', faculty: sci._id });
    const informationTechnology = await Department.create({ name: 'Information Technology', faculty: sci._id });
    const science = await Department.create({ name: 'Science', faculty: sedu._id });
    const arts = await Department.create({ name: 'Arts', faculty: sedu._id });

    // Create Courses under each Department
    await Course.create([
      { name: 'Degree in Computer Science', code: 'COM', department: computerScience._id },
      { name: 'Information Technology', code: 'ITC', department: informationTechnology._id },
      { name: 'Bachelor of Technology Education - Computer Studies', code: 'ETS', department: science._id },
      { name: 'Bachelor of Education Arts', code: 'BEA', department: arts._id },
    ]);

    // Create Units under each Department
    await Unit.create([
      // Computer Science
      { name: 'Web Development', code: 'WEB 101', department: computerScience._id },
      { name: 'System Analysis and Design', code: 'SAD 101', department: computerScience._id },
      { name: 'Database Management Systems', code: 'DBM 101', department: computerScience._id },
      { name: 'Operating Systems', code: 'OS 101', department: computerScience._id },
      { name: 'Human Computer Interaction', code: 'HCI 101', department: computerScience._id },

      // Information Technology
      { name: 'Networking Fundamentals', code: 'NET 101', department: informationTechnology._id },
      { name: 'System Administration', code: 'SYA 101', department: informationTechnology._id },
      { name: 'Cybersecurity', code: 'CYB 101', department: informationTechnology._id },

      // Science
      { name: 'Analytical Chemistry', code: 'CHE 101', department: science._id },
      { name: 'Statistics', code: 'STA 101', department: science._id },
      { name: 'Physics Fundamentals', code: 'PHY 101', department: science._id },

      // Arts
      { name: 'Psychology', code: 'PSY 101', department: arts._id },
      { name: 'Sociology', code: 'SOC 101', department: arts._id },
      { name: 'Physical Education', code: 'PED 101', department: arts._id },
    ]);

    console.log('Faculties, Departments, Courses, and Units seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedData();