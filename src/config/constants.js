require("dotenv").config();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const QUESTIONS = {
  1: [
    { id: 'q1', text: "VOTE for least interesting senior", options: ["Ujjwal Sir", "Soham Sir", "Manavi Mam", "Raman SIR"], timeLimit: 20 },
    { id: 'q2', text: "Sbse bekar event name?", options: ["Genesis", "Inteham-E-GDG", "Nexus", "Genocide"], timeLimit: 20 },
  ],
  2: [
    { id: 'q3', text: "Who is the Impostor?", options: ["Player A", "Player B", "Player C", "Player D"], timeLimit: 20 },
    { id: 'q4', text: "Pick the minority food:", options: ["Pizza", "Burger", "Sushi", "Salad"], timeLimit: 20 },
  ],
  3: [
    { id: 'q5', text: "Which season is the least liked?", options: ["Spring", "Summer", "Autumn", "Winter"], timeLimit: 15 },
    { id: 'q6', text: "Least popular pet?", options: ["Cat", "Dog", "Bird", "Fish"], timeLimit: 15 },
  ],
  4: [
    { id: 'q7', text: "Minority Strategy: Go High or Low?", options: ["High", "Low", "Middle", "None"], timeLimit: 15 },
    { id: 'q8', text: "Pick a direction:", options: ["North", "South", "East", "West"], timeLimit: 15 },
  ],
  5: [
    { id: 'q9', text: "Final Round: Pick the Minority Suit", options: ["Hearts", "Diamonds", "Clubs", "Spades"], timeLimit: 20 },
    { id: 'q10', text: "The Ultimate Choice", options: ["A", "B", "C", "D"], timeLimit: 20 },
  ]
};

module.exports = { ADMIN_PASSWORD, QUESTIONS };