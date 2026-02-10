require("dotenv").config();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const QUESTIONS = {
  1: [
    { id: 'q1', text: "Pick the option you think the fewest people will choose:", options: ["A", "B", "C", "D"], timeLimit: 20 },
    { id: 'q2', text: "Who is the best driver?", options: ["Salman Khan", "Salman Khan ka driver", "Deer", "Driver ka Salman Khan"], timeLimit: 20 },
    { id: 'q3', text: "Most overrated vegetable?", options: ["Tinda", "Bhindi", "Lauki", "Karela"], timeLimit: 20 },
    { id: 'q4', text: "Puppy ko dekh kar aap kya karte ho?", options: ["Puppy ko khana dete ho?", "Puppy ka khana le lete ho?", "Puppy ko kha lete ho?", "Puppy aapko kha leta hai"], timeLimit: 20 },
    { id: 'q5', text: "Who is the most loyal?", options: ["RCB fans", "Kattappa", "Jethalal", "Palash Muchhal"], timeLimit: 20 }
  ],
  2: [
    { id: 'q6', text: "Jungle mein more nacha, kisne dekha?", options: ["More ne", "Chor ne", "Nani ne", "Nana ne"], timeLimit: 20 },
    { id: 'q7', text: "Agar aapko ek din ka Raja bana diya jaye, toh aap kya karoge?", options: ["Rani ban jaunga", "AQI kam kar dunga", "Tax 200 percent kar dunga", "Dusre din bhi ban jaunga"], timeLimit: 20 },
    { id: 'q8', text: "Which sound is most likely to cause a physical \"Alt+F4\" in your brain?", options: ["A spoon scraping a non-stick pan", "\"We need to talk\" (sent at 11:30 PM)", "Someone chewing chips in a silent library", "The default iPhone alarm clock (Radar)"], timeLimit: 20 },
    { id: 'q9', text: "Which object has the highest \"betrayal\" energy?", options: ["A chair that catches your belt loop", "A USB plug that takes 3 tries to get right", "An ice cube that slides down your shirt", "The corner of the bed frame (Toe Crusher 3000)"], timeLimit: 20 },
    { id: 'q10', text: "If you could delete one \"necessary\" evil from existence, what would it be?", options: ["Small talk with neighbors in the elevator", "Wet socks", "15-second unskippable ads for things you already bought", "Group projects where you do 110% of the work"], timeLimit: 20 }
  ],
  3: [
    { id: 'q11', text: "Most suspicious food behavior?", options: ["Eating a KitKat without breaking the bars", "Putting the milk in before the cereal", "Peeling a banana from the bottom", "Drinking orange juice right after brushing your teeth"], timeLimit: 20 },
    { id: 'q12', text: "Best football team:", options: ["FCB Barcelohna", "Riyal Meowdrid", "NITH 3rd year", "Patna Pirates"], timeLimit: 20 },
    { id: 'q13', text: "If you were to be given a nickname, what would it be?", options: ["Kitty", "Sona", "Kaliya", "Cutu"], timeLimit: 20 },
    { id: 'q14', text: "Worst states to be born in?", options: ["Solid state", "Liquid state", "Bose-Einstein Condensate", "Plasma"], timeLimit: 20 },
    { id: 'q15', text: "If you could give \"Mr. Universe\" to someone, who would it be?", options: ["Hrithik Roshan", "Verka wale bhaiya", "Zehri Baba", "The person anchoring right now"], timeLimit: 20 }
  ],
  4: [
    { id: 'q16', text: "If you wanted to reincarnate into something, what would it be?", options: ["Slime", "Jon Snow", "Manmohan Chachu", "Ash Ketchum"], timeLimit: 20 },
    { id: 'q17', text: "Next Prime Minister of India?", options: ["Sergey Mikhalkov", "Vladimir Putin", "Ryan Reynolds", "Sabrina Carpenter"], timeLimit: 20 },
    { id: 'q18', text: "Sabse zyada speed kiski hai?", options: ["College ke WiFi ki", "WiFi ke college ki", "WiFi ke WiFi ki", "College ke college ki"], timeLimit: 20 },
    { id: 'q19', text: "Biggest scam in your life?", options: ["Education system", "Hustle culture", "\"Follow your passion\"", "Tumhari expectations"], timeLimit: 20 },
    { id: 'q20', text: "Mass Bunk fail hone ka main karan?", options: ["CR hi kharab hai", "That one nerd", "Receding hairline", "Class kaun jaata hai?"], timeLimit: 20 }
  ],
  5: [
    { id: 'q21', text: "Lunch ke baad wali class attend na karne ka scientific reason?", options: ["Kyunki pehle wali bhi nahi lagayi thi", "Rajma Chawal", "My life, my rules", "Proxy lag jaati hai"], timeLimit: 20 },
    { id: 'q22', text: "Thand mein aapko dhoondna ho toh kahan miloge?", options: ["Ground ki stairs par", "Dost ki rajai mein", "Archi ke peeche", "Central Block ki parking mein"], timeLimit: 20 },
    { id: 'q23', text: "Exam ke ek din pehle ka syllabus?", options: ["Jitna roommate ka hota hai", "Mera toh 6th revision hota hai", "Exam ke 5 min pehle tak jitna ho jaye", "Jo hoga dekha jayega"], timeLimit: 20 },
    { id: 'q24', text: "DSA mein kahan tak pahunch gaye?", options: ["ARRAY", "array", "ARREY", "arrey"], timeLimit: 20 },
    { id: 'q25', text: "Never Have I Ever...", options: ["Stolen money from a teacher's purse", "Bathed regularly", "Catfished someone", "Friend-zoned someone"], timeLimit: 20 }
  ],
  6: [
    { id: 'q26', text: "Significance of a college club?", options: ["Tech sikha dete hain", "Placement lagwa dete hain", "Referrals mil jaate hain", "Extension mein senior ma'am aati hain"], timeLimit: 20 },
    { id: 'q27', text: "Sabse zyada pani kidhar aata hai?", options: ["Nal mein", "KBH mein", "Rajasthan mein", "Baadal mein"], timeLimit: 20 },
    { id: 'q28', text: "Most overrated drink?", options: ["Verka ki chai", "Lahori Jeera", "Mess ki chaach", "Sting"], timeLimit: 20 },
    { id: 'q29', text: "Most overrated food?", options: ["Chole Bhature", "Biryani", "GDG food coupons ka khana", "Night canteen ki Maggi"], timeLimit: 20 },
    { id: 'q30', text: "Old LH kyun jaana hai?", options: ["Department mein room nahi hai", "ABYSS attend karne ke liye", "Gulab ka phool dekhne ke liye", "Aai-Babu ke sapne poore karne ke liye"], timeLimit: 20 }
  ],
  7: [
    { id: 'q31', text: "Best NITH Instagram page?", options: ["NITH Creeps", "Spillspot", "TirriPaglu", "Confession_nith"], timeLimit: 20 },
    { id: 'q32', text: "Best TV show?", options: ["Bhabhi Ji Ghar Par Hai", "Yeh Rishta Kya Kehlata Hai", "Naagin", "Balika Vadhu"], timeLimit: 20 },
    { id: 'q33', text: "What matters most in an interview?", options: ["Looks", "LeetCode", "Backend", "Frontend"], timeLimit: 20 },
    { id: 'q34', text: "Library jaane ka main maqsad?", options: ["Exams aa gaye hain", "Movie download karne", "Kisi ko dekhne ke liye", "Guard bhaiya ki yaad aati hai"], timeLimit: 20 },
    { id: 'q35', text: "Most dangerous animal found in Hamirpur?", options: ["Leopard", "Monkey", "Vlog banane wale", "Vlog dekhne wale"], timeLimit: 20 }
  ],
  8: [
    { id: 'q36', text: "What is the most common language spoken on campus?", options: ["C", "C++", "Python", "Java"], timeLimit: 20 },
    { id: 'q37', text: "Iss baar NIMBUS kaun jeetega?", options: ["In4mals", "App Team", "Dravida", "Creahaven"], timeLimit: 20 },
    { id: 'q38', text: "Who will retire first?", options: ["M.S. Dhoni", "Me (in a situationship)", "Rahul Gandhi", "Amitabh Bachchan"], timeLimit: 20 },
    { id: 'q39', text: "Why did Thanos snap his fingers?", options: ["His fingers were itching", "Because Chhota Bheem couldn't", "+$;+#!", "Mitochondria is the powerhouse of the cell"], timeLimit: 20 },
    { id: 'q40', text: "Sabse bada dhokha?", options: ["Attendance ke naam par event mein bula lena", "Dinesh Karthik ke saath jo hua", "Dost bina bataye mess chala gaya", "LDR (Long Distance Relationship)"], timeLimit: 20 }
  ],
  9: [
    { id: 'q41', text: "Where was the Penguin heading?", options: ["Shimla", "Manali", "Kullu", "Mandi"], timeLimit: 20 },
    { id: 'q42', text: "Best Chachu?", options: ["MNIT Jaipur Guards", "Papa ke bhai", "Chandu ke chachu", "Chacha Chaudhary"], timeLimit: 20 },
    { id: 'q43', text: "What is the best thing you've felt over your head?", options: ["Her hands", "Minoxidil", "Set Wet hair gel", "Navratan Oil (Thanda thanda cool cool)"], timeLimit: 20 },
    { id: 'q44', text: "Most used thing in 2025?", options: ["ChatGPT", "You", "Vaibhav Suryavanshi", "Hiteshi"], timeLimit: 20 },
    { id: 'q45', text: "Best dialogue?", options: ["Winter is coming", "Summer is coming", "Spring is coming", "Autumn is coming"], timeLimit: 20 }
  ],
  10: [
    { id: 'q46', text: "Musibat mein kaun kaam aata hai?", options: ["Paisa", "Maa", "Tikle's Academy", "Doraemon"], timeLimit: 20 },
    { id: 'q47', text: "Sabse zyada tedha kya hai?", options: ["Tedhe Medhe", "Pipe", "Himachal ke raaste", "Snake"], timeLimit: 20 },
    { id: 'q48', text: "Raat ko kya karte ho?", options: ["Call par baate karta hoon", "Psycho pool ke questions banata hoon", "Overthinking karta hoon", "Kambal mein lipat ke rota hoon"], timeLimit: 20 },
    { id: 'q49', text: "Best superhero?", options: ["Power Rangers", "Shaktiman", "Tun Tun Mausi", "Modi G"], timeLimit: 20 },
    { id: 'q50', text: "Kaun se color ka dupatta jaldi udd jata hai?", options: ["Lal color", "Peela color", "Neela color", "Hara color"], timeLimit: 20 }
  ]
};

module.exports = { ADMIN_PASSWORD, QUESTIONS };