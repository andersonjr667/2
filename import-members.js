require('dotenv').config();
const mongoose = require('mongoose');
const Member = require('./models/Member');
const fs = require('fs');
const path = require('path');

async function importMembers() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Conectado ao MongoDB');

        const membersPath = path.join(__dirname, 'db', 'members.json');
        const membersData = JSON.parse(fs.readFileSync(membersPath, 'utf8'));

        // Remove todos os membros existentes (opcional)
        await Member.deleteMany({});

        // Insere os membros do JSON
        await Member.insertMany(membersData);
        console.log('Membros importados com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao importar membros:', error);
        process.exit(1);
    }
}

importMembers();
