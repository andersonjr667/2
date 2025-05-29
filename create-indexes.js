require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const Member = require('./models/Member');
const Contact = require('./models/Contact');
const User = require('./models/User');
const Log = require('./models/Log');
const MessageStatus = require('./models/MessageStatus');
const AbsentMember = require('./models/AbsentMember');

async function createIndexes() {
    try {
        console.log('Creating indexes...');

        // Member indexes
        await Member.collection.createIndex({ name: 1 });
        await Member.collection.createIndex({ phone: 1 }, { unique: true });
        await Member.collection.createIndex({ 'attendance.lastAttendance': 1 });
        await Member.collection.createIndex({ birthday: 1 });
        await Member.collection.createIndex({ status: 1 });
        console.log('Member indexes created');

        // Contact indexes
        await Contact.collection.createIndex({ name: 1 });
        await Contact.collection.createIndex({ phone: 1 });
        await Contact.collection.createIndex({ owner: 1 });
        await Contact.collection.createIndex({ status: 1 });
        console.log('Contact indexes created');

        // User indexes
        await User.collection.createIndex({ username: 1 }, { unique: true });
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ role: 1 });
        console.log('User indexes created');

        // Log indexes
        await Log.collection.createIndex({ createdAt: -1 });
        await Log.collection.createIndex({ type: 1, createdAt: -1 });
        await Log.collection.createIndex({ username: 1, createdAt: -1 });
        console.log('Log indexes created');

        // MessageStatus indexes
        await MessageStatus.collection.createIndex({ messageId: 1 });
        await MessageStatus.collection.createIndex({ recipientId: 1, recipientType: 1 });
        await MessageStatus.collection.createIndex({ status: 1, createdAt: -1 });
        await MessageStatus.collection.createIndex({ phone: 1 });
        console.log('MessageStatus indexes created');

        // AbsentMember indexes
        await AbsentMember.collection.createIndex({ memberId: 1, date: -1 });
        await AbsentMember.collection.createIndex({ date: -1 });
        console.log('AbsentMember indexes created');

        console.log('All indexes created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating indexes:', error);
        process.exit(1);
    }
}

// Connect to MongoDB and create indexes
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB connected');
    return createIndexes();
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
