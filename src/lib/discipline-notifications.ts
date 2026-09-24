export const DISCIPLINE_MESSAGES = {
  PUSH: [
    "El mundo no se detiene porque tengas pereza. Vuelve al trabajo.",
    "¿Vas a dejar que tu versión de mañana te odie por lo que no hiciste hoy?",
    "La disciplina es el puente entre tus metas y tus logros. Cruza el puente ahora.",
    "El dolor de la disciplina es preferible al dolor del arrepentimiento.",
    "Mientras otros descansan, tú construyes un imperio. No pares.",
    "Tu mente te miente diciendo que estás cansado. Ignórala y ejecuta.",
  ],
  VICTORY: [
    "Victoria sellada. Has vencido a la persona que eras ayer.",
    "Dominio absoluto. Tu voluntad no es negociable.",
    "Otro paso hacia la cima. No te conformes con esto.",
    "Has demostrado que eres el dueño de tu tiempo. Mantén el ritmo.",
    " la mediocridad ha perdido hoy. Tú has ganado.",
  ],
  FAILURE: [
    "Has fallado. La disciplina no acepta excusas.",
    "Racha rota. El camino al éxito comienza de nuevo desde cero.",
    "Tu voluntad flaqueó. No permitas que suceda dos veces.",
  ],
};

export function getRandomMessage(category: keyof typeof DISCIPLINE_MESSAGES) {
  const messages = DISCIPLINE_MESSAGES[category];
  return messages[Math.floor(Math.random() * messages.length)];
}
