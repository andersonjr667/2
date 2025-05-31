// messages.js - Central de mensagens do sistema

// Função para obter data/hora no Brasil
export function getBrazilDateTime() {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function getBrazilHour() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: 'numeric',
    hour12: false
  });
}

// Programações da semana atualizadas
export const programacoesSemana = `\n📌 *Programações da igreja:*\n• *Terças-feiras:* Culto de Oração às 20h\n• *Quintas-feiras:* Culto do Clamor às 20h\n• *Sábados:* Culto de Jovens e Adolescentes às 19h\n• *Domingos:* \n  - 09h: Escola Bíblica Dominical\n  - 10h: Culto da Manhã \n  - 19h: Culto da Noite\n`;

// Mensagem inicial de boas-vindas
export function welcomeMessage(name) {
  return `Paz do Senhor ${name}! 🙏\n\nSeja bem-vindo(a) à Igreja Batista Boa Parte! 🏠\n\nNossos cultos acontecem aos domingos às 18h e nas quartas às 19:30h.\n\nEndereço: Rua Tocantins, N° 91, Bairro Santa Rita\nSão José dos Campos - SP\n\nEsperamos você!`;
}

// Mensagens de acompanhamento atualizadas
export const followUpMessages = [
  // Mensagem 1 (Segunda-feira)
  (name) => `Bom dia, ${name}! ☀️\n\nQue esta segunda-feira seja repleta das bênçãos de Deus! 🌟\nIniciamos mais uma semana com fé e esperança no Senhor.\n\n${programacoesSemana}\nQue Deus abençoe sua semana! 🙏\n\n_\"As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade.\"_ \n*Lamentações 3:22-23*`,
  // Mensagem 2 (Terça-feira)
  (name) => `Paz do Senhor, ${name}! 🌟\n\nHoje é dia de Corrente de Oração! 🙏\nVenha buscar a presença de Deus conosco às 20h.\n\n${programacoesSemana}\nDeus te abençoe! 💖\n\n_\"O Senhor está perto de todos os que o invocam, de todos os que o invocam em verdade.\"_ \n*Salmos 145:18*`,
  // Mensagem 3 (Quarta-feira)
  (name) => `Olá, ${name}! ✝️\n\nQue a paz de Deus esteja em seu coração nesta quarta-feira! 🌟\nContinue firme na caminhada com Cristo.\n\n${programacoesSemana}\nConte conosco em oração! 🙌\n\n_\"Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.\"_ \n*Jeremias 29:11*`,
  // Mensagem 4 (Quinta-feira)
  (name) => `Graça e Paz, ${name}! ☀️\n\nHoje é dia de Culto da Família às 20h! 🕊️\nVenha adorar ao Senhor conosco e receber uma palavra de edificação.\n\n${programacoesSemana}\nDeus te abençoe abundantemente! 🙏\n\n_\"Como é bom e agradável viverem unidos os irmãos!\"_ \n*Salmos 133:1*`,
  // Mensagem 5 (Sexta-feira)
  (name) => `Olá, ${name}! 💝\n\nSexta-feira chegou, e estamos aqui para lembrar que você é muito especial para nossa igreja! 🌟\nPrepare-se para o culto dos jovens amanhã às 19h!\n\n${programacoesSemana}\nQue Deus renove suas forças e te abençoe! 🙌\n\n_\"Tudo posso naquele que me fortalece.\"_ \n*Filipenses 4:13*`,
  // Mensagem 6 (Sábado - 2 horas antes do culto)
  (name) => `Olá, ${name}! 🌟\n\nFaltam apenas 2 horas para o Culto dos Jovens, que começa às 19h! 🕊️\nPrepare seu coração para um momento de adoração, comunhão e renovação espiritual.\n\n${programacoesSemana}\nEsperamos você lá! Que Deus prepare seu coração para receber as bênçãos que Ele tem para você hoje. 🙏\n\n_\"Cheguemos perto de Deus com um coração sincero e com plena convicção de fé.\"_ \n*Hebreus 10:22*`,
  // Mensagem 7 (Sábado - Durante o culto, até 21h)
  (name) => `Olá, ${name}! 🌙\n\nEstamos neste momento no Culto dos Jovens, e você está em nossos pensamentos e orações! 🙏\nSe ainda não chegou, venha participar conosco deste momento especial na presença de Deus.\n\n${programacoesSemana}\nQue o Senhor fale ao seu coração e renove suas forças! 💖\n\n_\"Porque onde estiverem dois ou três reunidos em meu nome, ali eu estou no meio deles.\"_ \n*Mateus 18:20*`,
  // Mensagem 8 (Domingo - 2 horas antes do culto da manhã)
  (name) => `Bom dia, ${name}! ☀️\n\nFaltam apenas 2 horas para o Culto das 10h! 🕊️\nPrepare seu coração para adorar ao Senhor e receber a Palavra que Ele tem para você hoje.\n\n${programacoesSemana}\nEsperamos você lá! Que este culto seja uma bênção para sua vida. 🙏\n\n_\"Entrem por suas portas com ações de graças e em seus átrios com louvor; deem-lhe graças e bendigam o seu nome.\"_ \n*Salmos 100:4*`,
  // Mensagem 9 (Domingo - Durante o culto da manhã, até 12h)
  (name) => `Bom dia, ${name}! 🌟\n\nEstamos neste momento no Culto das 10h, e você está em nossos pensamentos e orações! 🙏\nSe ainda não chegou, venha participar conosco deste momento de adoração e comunhão com Deus.\n\n${programacoesSemana}\nQue o Senhor fale ao seu coração e renove suas forças! 💖\n\n_\"Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração.\"_ \n*Romanos 12:12*`,
  // Mensagem 10 (Domingo - 2 horas antes do culto da noite)
  (name) => `Boa tarde, ${name}! 🌤️\n\nFaltam apenas 2 horas para o Culto das 19h! 🕊️\nPrepare seu coração para encerrar o dia na presença do Senhor e renovar suas forças para a semana que vem.\n\n${programacoesSemana}\nEsperamos você lá! Que este culto seja uma bênção para sua vida. 🙏\n\n_\"Vinde, adoremos e prostremo-nos; ajoelhemos diante do Senhor, que nos criou.\"_ \n*Salmos 95:6*`,
  // Mensagem 11 (Domingo - Durante o culto da noite, até 21h)
  (name) => `Boa noite, ${name}! 🌙\n\nEstamos neste momento no Culto das 19h, e você está em nossos pensamentos e orações! 🙏\nSe ainda não chegou, venha participar conosco deste momento de adoração e comunhão com Deus.\n\n${programacoesSemana}\nQue o Senhor fale ao seu coração e renove suas forças! 💖\n\n_\"Porque onde estiverem dois ou três reunidos em meu nome, ali eu estou no meio deles.\"_ \n*Mateus 18:20*`
];

// Função para obter a mensagem do dia
export function getMessageByDay(name) {
  const brazilDate = new Date(getBrazilDateTime());
  const diaSemana = brazilDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const hora = brazilDate.getHours();

  // Mensagens específicas para sábado e domingo
  if (diaSemana === 6) { // Sábado
    if (hora >= 17 && hora < 19) {
      return followUpMessages[5](name);
    } else if (hora >= 19 && hora < 21) {
      return followUpMessages[6](name);
    }
  } else if (diaSemana === 0) { // Domingo
    if (hora >= 8 && hora < 10) {
      return followUpMessages[7](name);
    } else if (hora >= 10 && hora < 12) {
      return followUpMessages[8](name);
    } else if (hora >= 17 && hora < 19) {
      return followUpMessages[9](name);
    } else if (hora >= 19 && hora < 21) {
      return followUpMessages[10](name);
    }
  } else if (diaSemana >= 1 && diaSemana <= 4) { // Segunda a quinta
    return followUpMessages[diaSemana - 1](name);
  }

  // Mensagem genérica para outros horários
  return `Olá, ${name}! 😊\n\nHoje não há uma mensagem específica, mas lembre-se das nossas programações da semana:\n\n${programacoesSemana}\nDeus te abençoe! 🙏`;
}

export function serviceReminderMessage(name) {
  return `Paz do Senhor ${name}! 🙏\n\nLembramos que hoje é dia de culto!\nVocê é nosso convidado especial.\n\nDeus abençoe!`;
}

export function bulkReminderMessage(name) {
  return `Paz do Senhor ${name}! 🙏\n\nGostaríamos de convidá-lo para nossos cultos.\nDomingo às 18h e Quarta às 19:30h.\n\nSua presença é muito importante para nós!`;
}

// Mensagem de ausência
export function absent(name) {
  return `Olá, ${name}! Sentimos sua falta em nossos encontros.\n\nLembramos que nossos cultos acontecem:\n• Domingo às 18h\n• Quarta-feira às 19:30h\n\nSe precisar de algo, estamos à disposição. Que Deus te abençoe! 🙏`;
}

// Exporta tudo agrupado para compatibilidade
export const messages = {
  welcomeMessage,
  absent,
  getMessageByDay,
  getBrazilDateTime,
  getBrazilHour,
  serviceReminderMessage,
  bulkReminderMessage,
  followUpMessages,
  programacoesSemana
};
