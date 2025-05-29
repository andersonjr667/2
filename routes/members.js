const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { auth, adminOnly } = require('../utils/auth');
const Log = require('../models/Log');
const fs = require('fs');
const path = require('path');

// Get all members
router.get('/', auth, async (req, res) => {
  try {
    const members = await Member.find()
      .populate('createdBy', 'name email')
      .sort({ name: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar membros' });
  }
});

// Get absent members
router.get('/absent', auth, async (req, res) => {
  try {
    const daysAbsent = parseInt(req.query.days) || 14;
    const absentMembers = await Member.findAbsentMembers(daysAbsent);
    res.json(absentMembers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar membros ausentes' });
  }
});

// Create new member
router.post('/', auth, async (req, res) => {
  try {
    const member = new Member({
      ...req.body,
      createdBy: req.userData.userId
    });
    await member.save();

    // Log the action
    await Log.logAction({
      type: 'create',
      action: 'create_member',
      username: req.userData.email,
      description: `Novo membro criado: ${member.name}`,
      details: {
        memberId: member._id,
        name: member.name
      }
    });
    
    const populatedMember = await Member.findById(member._id)
      .populate('createdBy', 'name email');

    res.status(201).json(populatedMember);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar membro' });
  }
});

// Update member
router.put('/:id', auth, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('createdBy', 'name email');

    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }

    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar membro' });
  }
});

// Record attendance for a member
router.post('/:id/attendance', auth, async (req, res) => {
  try {
    const { date, present } = req.body;
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }

    await member.recordAttendance(date ? new Date(date) : new Date(), present, req.userData.userId);
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar presença' });
  }
});

// Get attendance statistics for a member
router.get('/:id/attendance', auth, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }

    const { startDate, endDate } = req.query;
    const stats = member.getAttendanceStats(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

// Record absence
router.post('/:id/absence', auth, async (req, res) => {
  try {
    const { date, justified, justification } = req.body;
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }

    member.absences.push({ date, justified, justification });
    await member.save();

    res.json({ message: 'Ausência registrada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar ausência' });
  }
});

// Update member notification preferences
router.patch('/:id/notifications', auth, async (req, res) => {
  try {
    const { whatsapp, email } = req.body;
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }

    member.notificationPreferences = {
      whatsapp: whatsapp !== undefined ? whatsapp : member.notificationPreferences.whatsapp,
      email: email !== undefined ? email : member.notificationPreferences.email
    };

    await member.save();
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar preferências' });
  }
});

// Delete member
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.userData.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }

    res.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover membro' });
  }
});

// Get members by status
router.get('/status', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const statusValue = status === 'todos' ? null : status;

    const members = await Member.find()
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    const filteredMembers = members.filter(member => {
      const matchesStatus = !statusValue || 
        (statusValue === 'ativo' && member.isDisciple) ||
        (statusValue === 'visitante' && !member.isDisciple);

      return matchesStatus;
    });

    res.json(filteredMembers);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar membros' });
  }
});

// Salvar lista de ausentes do dia
router.post('/absent-list', auth, async (req, res) => {
    try {
        const { date, absents } = req.body;
        if (!date || !Array.isArray(absents)) {
            return res.status(400).json({ message: 'Dados inválidos' });
        }
        const absentPath = path.join(__dirname, '../db/absentmembers.json');
        let data = [];
        if (fs.existsSync(absentPath)) {
            data = JSON.parse(fs.readFileSync(absentPath, 'utf8'));
        }
        // Remove registros duplicados para a mesma data
        data = data.filter(item => item.date !== date);
        data.push({ date, absents });
        fs.writeFileSync(absentPath, JSON.stringify(data, null, 2));
        res.json({ message: 'Chamada salva com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar chamada' });
    }
});

// Rota para buscar ausentes do arquivo absentmembers.json
router.get('/absent-list', auth, async (req, res) => {
    try {
        const { date } = req.query;
        const absentPath = path.join(__dirname, '../db/absentmembers.json');
        let data = [];
        if (fs.existsSync(absentPath)) {
            data = JSON.parse(fs.readFileSync(absentPath, 'utf8'));
        }
        let found = data.find(item => item.date === date);
        if (!found) found = { date, absents: [] };
        res.json(found);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar chamada' });
    }
});

// Rota para buscar ausentes agrupados por membro e datas de falta
router.get('/absent-list/history', auth, async (req, res) => {
    try {
        const absentPath = path.join(__dirname, '../db/absentmembers.json');
        let data = [];
        if (fs.existsSync(absentPath)) {
            data = JSON.parse(fs.readFileSync(absentPath, 'utf8'));
        }
        // Agrupa por membro
        const memberAbsences = {};
        data.forEach(entry => {
            const date = entry.date;
            (entry.absents || []).forEach(absent => {
                const key = absent.name + (absent.phone ? '|' + absent.phone : '');
                if (!memberAbsences[key]) {
                    memberAbsences[key] = { name: absent.name, phone: absent.phone || '', absences: [] };
                }
                memberAbsences[key].absences.push(date);
            });
        });
        // Ordena datas decrescente
        Object.values(memberAbsences).forEach(m => m.absences.sort((a,b) => b.localeCompare(a)));
        res.json(Object.values(memberAbsences));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar histórico de ausências' });
    }
});

module.exports = router;
