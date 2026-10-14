/**
 * Generates deterministic demo data: matchmakers, 14 clients and a pool of
 * 240 verified candidates (120 women, 120 men). Run with `npm run seed`.
 * Seeded RNG => identical output on every machine, so diffs stay reviewable.
 */
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const OUT = path.resolve('src/data');
const TODAY = new Date('2026-10-13T00:00:00Z');

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261013);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const chance = (p) => rand() < p;
const gauss = (mean, sd) => {
  const u = 1 - rand(), v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
function weighted(entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of entries) { if ((r -= w) <= 0) return v; }
  return entries[entries.length - 1][0];
}
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// ---------------------------------------------------------------- names
const NAMES = {
  north: { M: ['Aarav','Vivaan','Arjun','Rohan','Karan','Siddharth','Aditya','Kunal','Nikhil','Rahul','Varun','Harsh','Mayank','Gaurav','Akshay','Abhishek','Ishaan','Tushar'], F: ['Ananya','Diya','Isha','Kavya','Meera','Neha','Pooja','Riya','Shreya','Tanvi','Aditi','Nisha','Kriti','Prerna','Sakshi','Shruti','Divya','Aanya'] },
  tamil: { M: ['Karthik','Arvind','Vignesh','Harish','Ganesh','Sriram','Ashwin','Naveen','Prakash','Venkat'], F: ['Lakshmi','Priya','Deepika','Nandini','Swathi','Aishwarya','Harini','Meenakshi','Kavitha','Janani'] },
  telugu: { M: ['Sai','Rakesh','Pranav','Teja','Srikanth','Charan','Vamsi','Sandeep'], F: ['Sravya','Harika','Keerthi','Anusha','Sindhu','Lavanya','Pooja','Divya'] },
  malayali: { M: ['Anoop','Vishnu','Arun','Jithin','Akhil','Rahul','Nikhil','Midhun'], F: ['Anjali','Athira','Neethu','Remya','Gayathri','Meera','Sneha','Aparna'] },
  kannada: { M: ['Vinay','Mahesh','Sharath','Darshan','Chetan','Pradeep','Suhas'], F: ['Spoorthi','Pallavi','Shwetha','Chaitra','Bhavana','Namrata','Deepa'] },
  bengali: { M: ['Arnab','Sourav','Debashish','Rajarshi','Anirban','Abhijit','Soumya','Ritwik'], F: ['Ritika','Sreetama','Moumita','Oindrila','Tanushree','Debolina','Ishita','Madhuri'] },
  marathi: { M: ['Omkar','Aniket','Siddhesh','Chinmay','Rohit','Sameer','Pratik','Tejas'], F: ['Gauri','Rutuja','Madhura','Sayali','Apoorva','Mrunal','Neha','Dhanashree'] },
  gujarati: { M: ['Jay','Dhruv','Parth','Meet','Hardik','Chirag','Yash','Krunal'], F: ['Khushi','Dhara','Hetal','Jinal','Krupa','Mansi','Nidhi','Foram'] },
  sikh: { M: ['Harpreet','Amandeep','Jaspreet','Gurvinder','Manpreet','Arshdeep','Simranjeet','Ravneet'], F: ['Simran','Harleen','Jasleen','Gurleen','Navneet','Ishmeet','Tanvir','Mehak'] },
  muslim: { M: ['Zaid','Imran','Faisal','Arman','Danish','Rehan','Kabir','Sameer'], F: ['Zara','Ayesha','Sana','Mehreen','Nida','Alina','Rukhsar','Farah'] },
  christian: { M: ['Joel','Joshua','Alan','Ryan','Aaron','Nathan','Jerome','Clive'], F: ['Sharon','Reshma','Anita','Jessica','Tina','Maria','Rebecca','Neha'] },
  parsi: { M: ['Cyrus','Darius','Rustom','Zubin','Farhad','Kaizad'], F: ['Dinaz','Zenobia','Roshan','Shernaz','Perin','Freny'] },
};

// diet: 'veg' | 'jain' | 'mixed' | 'nonveg' ; trad: tendency toward traditional family values
const COMMUNITIES = [
  { religion: 'Hindu', caste: 'Brahmin', set: 'north', surnames: ['Sharma','Mishra','Tiwari','Pandey','Dubey','Joshi'], langs: ['Hindi'], diet: 'veg', w: 8 },
  { religion: 'Hindu', caste: 'Agarwal', set: 'north', surnames: ['Agarwal','Gupta','Goel','Mittal','Bansal','Singhal'], langs: ['Hindi'], diet: 'veg', w: 8 },
  { religion: 'Hindu', caste: 'Khatri', set: 'north', surnames: ['Khanna','Kapoor','Malhotra','Chopra','Mehra','Bhasin'], langs: ['Hindi','Punjabi'], diet: 'mixed', w: 6 },
  { religion: 'Hindu', caste: 'Kayastha', set: 'north', surnames: ['Srivastava','Saxena','Verma','Sinha','Mathur'], langs: ['Hindi'], diet: 'mixed', w: 4 },
  { religion: 'Hindu', caste: 'Rajput', set: 'north', surnames: ['Chauhan','Rathore','Shekhawat','Bhadauria'], langs: ['Hindi'], diet: 'nonveg', w: 3 },
  { religion: 'Hindu', caste: 'Marwari', set: 'north', surnames: ['Maheshwari','Bajaj','Poddar','Khemka','Bhartia'], langs: ['Hindi','Marwari'], diet: 'veg', w: 3 },
  { religion: 'Hindu', caste: 'Brahmin (Iyer)', set: 'tamil', surnames: ['Iyer','Subramanian','Ramachandran','Krishnan','Narayanan'], langs: ['Tamil'], diet: 'veg', w: 4 },
  { religion: 'Hindu', caste: 'Nair', set: 'malayali', surnames: ['Nair','Menon','Pillai','Kurup'], langs: ['Malayalam'], diet: 'nonveg', w: 3 },
  { religion: 'Hindu', caste: 'Reddy', set: 'telugu', surnames: ['Reddy','Gaddam','Bommireddy'], langs: ['Telugu'], diet: 'nonveg', w: 3 },
  { religion: 'Hindu', caste: 'Kamma', set: 'telugu', surnames: ['Chowdary','Naidu','Yarlagadda'], langs: ['Telugu'], diet: 'nonveg', w: 2 },
  { religion: 'Hindu', caste: 'Brahmin (Kannada)', set: 'kannada', surnames: ['Hegde','Bhat','Rao','Kamath','Shastry'], langs: ['Kannada'], diet: 'veg', w: 3 },
  { religion: 'Hindu', caste: 'Bengali Brahmin', set: 'bengali', surnames: ['Banerjee','Chatterjee','Mukherjee','Bhattacharya'], langs: ['Bengali'], diet: 'nonveg', w: 3 },
  { religion: 'Hindu', caste: 'Bengali Kayastha', set: 'bengali', surnames: ['Ghosh','Bose','Sen','Dasgupta','Mitra'], langs: ['Bengali'], diet: 'nonveg', w: 2 },
  { religion: 'Hindu', caste: 'Maratha', set: 'marathi', surnames: ['Deshmukh','Patil','Jadhav','Shinde','Pawar'], langs: ['Marathi'], diet: 'mixed', w: 3 },
  { religion: 'Hindu', caste: 'Brahmin (Deshastha)', set: 'marathi', surnames: ['Kulkarni','Deshpande','Apte','Gokhale'], langs: ['Marathi'], diet: 'mixed', w: 2 },
  { religion: 'Hindu', caste: 'Patidar', set: 'gujarati', surnames: ['Patel','Amin','Thakkar'], langs: ['Gujarati'], diet: 'veg', w: 3 },
  { religion: 'Jain', caste: 'Shwetambar Jain', set: 'gujarati', surnames: ['Shah','Mehta','Doshi','Gandhi','Sanghvi'], langs: ['Gujarati'], diet: 'jain', w: 3 },
  { religion: 'Jain', caste: 'Agarwal Jain', set: 'north', surnames: ['Jain','Bhandari','Kasliwal'], langs: ['Hindi'], diet: 'jain', w: 2 },
  { religion: 'Sikh', caste: 'Jat Sikh', set: 'sikh', surnames: ['Gill','Sandhu','Dhillon','Grewal','Sidhu','Brar','Bajwa'], langs: ['Punjabi','Hindi'], diet: 'nonveg', w: 4 },
  { religion: 'Muslim', caste: 'Sunni', set: 'muslim', surnames: ['Khan','Ansari','Siddiqui','Qureshi','Mirza','Sheikh'], langs: ['Urdu','Hindi'], diet: 'nonveg', w: 4 },
  { religion: 'Christian', caste: 'Syrian Christian', set: 'christian', surnames: ['Thomas','Mathew','George','Joseph','Varghese'], langs: ['Malayalam'], diet: 'nonveg', w: 2 },
  { religion: 'Christian', caste: 'Roman Catholic', set: 'christian', surnames: ["D'Souza",'Fernandes','Pereira','Rodrigues','Mascarenhas'], langs: ['Konkani'], diet: 'nonveg', w: 2 },
  { religion: 'Parsi', caste: 'Zoroastrian', set: 'parsi', surnames: ['Wadia','Contractor','Daruwalla','Bharucha','Dastur','Mistry'], langs: ['Gujarati'], diet: 'nonveg', w: 1 },
];

const DIET_WEIGHTS = {
  veg: [['Vegetarian', 80], ['Eggetarian', 10], ['Non-vegetarian', 5], ['Vegan', 5]],
  jain: [['Jain', 70], ['Vegetarian', 30]],
  mixed: [['Vegetarian', 38], ['Eggetarian', 14], ['Non-vegetarian', 48]],
  nonveg: [['Non-vegetarian', 80], ['Eggetarian', 12], ['Vegetarian', 8]],
};

// ---------------------------------------------------------------- places
const INDIA = [['Mumbai',14],['Bengaluru',16],['Delhi',8],['Gurugram',7],['Noida',3],['Hyderabad',8],['Pune',8],['Chennai',6],['Kolkata',3],['Ahmedabad',3],['Chandigarh',2],['Jaipur',1]];
const ABROAD = [['London','United Kingdom',4],['Dubai','United Arab Emirates',4],['Singapore','Singapore',4],['New York','United States',2],['San Francisco','United States',2],['Toronto','Canada',2],['Sydney','Australia',1]];
function pickPlace() {
  const abroad = chance(0.17);
  if (abroad) {
    const [city, country] = weighted(ABROAD.map(([c, k, w]) => [[c, k], w]));
    return { city, country };
  }
  return { city: weighted(INDIA), country: 'India' };
}

// ---------------------------------------------------------------- careers
const TRACKS = {
  tech: {
    industry: 'Technology', mult: 1.05,
    companies: ['Google','Microsoft','Amazon','Flipkart','Razorpay','Atlassian','Adobe','Swiggy','Zomato','CRED','PhonePe','Uber','Meesho','Freshworks','Zoho','Salesforce'],
    levels: [['Software Engineer II','Product Analyst'],['Senior Software Engineer','Product Manager','Data Scientist'],['Staff Engineer','Senior Product Manager','Engineering Manager'],['Director of Engineering','Head of Product','Principal Engineer']],
    colleges: ['IIT Bombay','IIT Delhi','IIT Madras','IIT Kanpur','BITS Pilani','NIT Trichy','Delhi Technological University','VIT Vellore','PES University','RV College of Engineering'],
    degrees: ['B.Tech (Computer Science)','B.Tech (Electronics)','B.E. (Information Technology)'], pg: ['MBA, IIM Ahmedabad','MBA, ISB Hyderabad','MS, Carnegie Mellon University','M.Tech, IISc Bangalore'], pgP: 0.4,
  },
  consulting: {
    industry: 'Consulting', mult: 1.12,
    companies: ['McKinsey & Company','Boston Consulting Group','Bain & Company','Deloitte','EY-Parthenon','Kearney','Oliver Wyman'],
    levels: [['Associate','Business Analyst'],['Consultant','Senior Consultant'],['Engagement Manager','Manager'],['Associate Partner','Principal']],
    colleges: ['IIT Bombay','IIT Delhi','St. Stephen\'s College','SRCC, Delhi University','St. Xavier\'s College, Mumbai','BITS Pilani','Christ University'],
    degrees: ['B.Tech (Mechanical)','B.A. (Hons) Economics','B.Com (Hons)','B.Tech (Computer Science)'], pg: ['MBA, IIM Ahmedabad','MBA, IIM Bangalore','MBA, INSEAD','MBA, ISB Hyderabad'], pgP: 0.8,
  },
  finance: {
    industry: 'Finance', mult: 1.15,
    companies: ['Goldman Sachs','JP Morgan','Morgan Stanley','Kotak Investment Banking','HDFC Bank','Axis Capital','Avendus Capital','Peak XV Partners','ICICI Securities'],
    levels: [['Analyst'],['Associate','Manager, Corporate Banking'],['Vice President','Senior Portfolio Manager'],['Director','Managing Director']],
    colleges: ['SRCC, Delhi University','St. Xavier\'s College, Mumbai','Christ University','NMIMS Mumbai','Shaheed Sukhdev College of Business Studies','IIT Bombay'],
    degrees: ['B.Com (Hons)','BBA (Finance)','B.A. (Hons) Economics','B.Tech (Chemical)'], pg: ['MBA, IIM Calcutta','MBA, IIM Ahmedabad','CFA Charterholder','Chartered Accountant (ICAI)'], pgP: 0.7,
  },
  health: {
    industry: 'Healthcare', mult: 0.92,
    companies: ['Apollo Hospitals','Fortis Healthcare','Max Healthcare','Manipal Hospitals','Narayana Health','AIIMS','Kokilaben Hospital','Private practice'],
    levels: [['Resident Doctor','Junior Consultant'],['Consultant','Dentist (Own clinic)'],['Senior Consultant','Consultant Surgeon'],['Head of Department','Senior Consultant & Director']],
    colleges: ['AIIMS Delhi','Maulana Azad Medical College','KMC Manipal','CMC Vellore','Grant Medical College','JIPMER','St. John\'s Medical College'],
    degrees: ['MBBS','BDS'], pg: ['MD (Medicine)','MS (Orthopaedics)','MD (Dermatology)','MD (Paediatrics)','MDS (Orthodontics)'], pgP: 0.9, prof: true,
  },
  law: {
    industry: 'Law', mult: 1.0,
    companies: ['Cyril Amarchand Mangaldas','AZB & Partners','Khaitan & Co','Trilegal','Shardul Amarchand Mangaldas','Own chambers'],
    levels: [['Associate'],['Senior Associate'],['Principal Associate','Counsel'],['Partner']],
    colleges: ['NLSIU Bangalore','NLU Delhi','NALSAR Hyderabad','Jindal Global Law School','Symbiosis Law School'],
    degrees: ['B.A. LL.B (Hons)','B.B.A. LL.B (Hons)'], pg: ['LL.M, Harvard Law School','LL.M, University of Cambridge','LL.M, NYU'], pgP: 0.35, prof: true,
  },
  business: {
    industry: 'Business & Management', mult: 1.0,
    companies: ['Tata Group','Reliance Industries','Aditya Birla Group','Mahindra Group','ITC','Hindustan Unilever','Procter & Gamble','Nestlé','Family business','Own startup'],
    levels: [['Management Trainee','Assistant Brand Manager'],['Manager','Brand Manager'],['Senior Manager','Associate Director'],['General Manager','Vice President','Founder & CEO']],
    colleges: ['SRCC, Delhi University','St. Xavier\'s College, Mumbai','Symbiosis Pune','NMIMS Mumbai','Ashoka University','Christ University','Mount Carmel College'],
    degrees: ['B.Com (Hons)','BBA','B.A. (Hons) Economics','B.Tech (Mechanical)'], pg: ['MBA, IIM Lucknow','MBA, XLRI Jamshedpur','MBA, MDI Gurgaon','MBA, ISB Hyderabad'], pgP: 0.65,
  },
  media: {
    industry: 'Media & Design', mult: 0.85,
    companies: ['Ogilvy India','Netflix India','Dentsu','Google Design','Studio Mumbai (Architecture)','Condé Nast India','Independent'],
    levels: [['Associate Designer','Copywriter'],['Senior Designer','Brand Strategist'],['Creative Director','Design Lead'],['Head of Design','Executive Creative Director']],
    colleges: ['NID Ahmedabad','NIFT Delhi','Symbiosis Centre for Media','SPA Delhi','CEPT University','Jai Hind College'],
    degrees: ['B.Des','B.A. Journalism & Mass Communication','B.Arch'], pg: ['M.Des, IIT Bombay (IDC)','MA, Royal College of Art'], pgP: 0.3,
  },
};
const TRACK_WEIGHTS = [['tech', 30], ['consulting', 12], ['finance', 14], ['health', 14], ['law', 6], ['business', 18], ['media', 6]];
const LEVEL_INCOME = [[12, 28], [28, 55], [55, 100], [100, 210]];

function pickLevel(age) {
  if (age <= 27) return weighted([[0, 70], [1, 28], [2, 2]]);
  if (age <= 30) return weighted([[0, 25], [1, 55], [2, 18], [3, 2]]);
  if (age <= 34) return weighted([[0, 6], [1, 40], [2, 42], [3, 12]]);
  return weighted([[1, 18], [2, 48], [3, 34]]);
}

// ---------------------------------------------------------------- narrative
const INTERESTS = {
  Trekking: 'on a trail somewhere outside the city',
  'Marathon running': 'training for the next half-marathon',
  'Carnatic music': 'at a sabha concert or practising at home',
  'Indie films': 'catching a new indie release',
  Cooking: 'trying out a new recipe for friends',
  Photography: 'out with a camera, chasing good light',
  Yoga: 'on the mat before the city wakes up',
  Padel: 'on the padel court with colleagues',
  Badminton: 'in a badminton league that takes itself far too seriously',
  Travel: 'planning the next trip, usually off the beaten path',
  Reading: 'with a book and a very strong filter coffee',
  'Stand-up comedy': 'at an open-mic night, laughing loudest',
  'Board games': 'hosting a board-game evening',
  Gardening: 'tending a balcony garden',
  Cycling: 'on a long Sunday ride',
  Cricket: 'at a weekend cricket match',
  Podcasts: 'deep in a podcast rabbit hole',
  Volunteering: 'volunteering with an education NGO',
  'Scuba diving': 'planning the next dive trip',
  Quizzing: 'at a pub quiz, defending the title',
  Theatre: 'at a play or a rehearsal',
  Pottery: 'at the pottery wheel',
};
const VALUES_LINES = {
  Traditional: ['Close to family and keen on a partner who enjoys festivals and Sunday lunches at home.', 'Rooted in family traditions; wants a partner who values them without making it a rulebook.', 'Family is the centre of life, and a partner who feels the same will find a warm home here.'],
  Moderate: ['Respects family but wants a relationship built on equal footing.', 'Looking for someone who can hold both family warmth and independent ambitions.', 'Balanced between tradition and a modern outlook; looking for a partner who is the same.'],
  Liberal: ['Looking for an equal partnership with real room for each other\'s careers and friendships.', 'Independent-minded; wants a partner who is a friend first.', 'Prefers to build the relationship on honest conversation rather than expectations handed down.'],
};
const INTENT_LINES = {
  'Marriage within 12 months': 'Clear about wanting to settle down in the next year.',
  'Marriage in 1–2 years': 'Ready to meet seriously, with no rush to set a date.',
  'Open to the right person': 'Not working to a timeline; the right person matters more than the date.',
};

const INTAKE_NOTES = [
  'Parents are closely involved; prefers the first introduction to go through the family WhatsApp group.',
  'Wants a first video call before any in-person meet. Weekday evenings work best.',
  'Burnt out by apps. Values being listened to; call before sending anything over email.',
  'Is travelling for work through the month. Slow replies are expected, not a lack of interest.',
  'Open on community but family is more particular, so flag same-community options first.',
  'Previously met three matches through a relative. Wants fewer, better-considered introductions.',
  'Very clear on the kids question. Would rather know early than discover it later.',
  'Prefers a quiet first meeting (coffee or a walk), not a restaurant dinner.',
];

// ---------------------------------------------------------------- generator
const usedNames = new Set();
const usedEmails = new Set();

function dobFor(age) {
  const d = new Date(TODAY);
  d.setUTCFullYear(d.getUTCFullYear() - age);
  d.setUTCDate(d.getUTCDate() - int(1, 360));
  return d.toISOString().slice(0, 10);
}
const ageOf = (dob) => Math.floor((TODAY - new Date(dob)) / (365.25 * 24 * 3600 * 1000));

function makePerson(id, gender, opts = {}) {
  const g = gender === 'Male' ? 'M' : 'F';
  const community = opts.community ?? weighted(COMMUNITIES.map((c) => [c, c.w]));
  let first, last, key, tries = 0;
  do {
    first = pick(NAMES[community.set][g]);
    last = pick(community.surnames);
    key = `${first} ${last}`;
  } while (usedNames.has(key) && ++tries < 40);
  usedNames.add(key);

  const age = opts.age ?? (gender === 'Male' ? clamp(Math.round(gauss(32, 3.2)), 26, 41) : clamp(Math.round(gauss(29.5, 3)), 24, 37));
  const trackKey = opts.track ?? weighted(TRACK_WEIGHTS);
  const track = TRACKS[trackKey];
  let level = opts.level ?? pickLevel(age);
  if (gender === 'Female' && !opts.level && chance(0.2)) level = Math.max(0, level - 1);

  const place = opts.place ?? pickPlace();
  const [lo, hi] = LEVEL_INCOME[level];
  let income = (lo + rand() * (hi - lo)) * track.mult * (place.country === 'India' ? 1 : 1.25);
  income = Math.round(clamp(income, 10, 260));
  const level0 = level;

  const college = pick(track.colleges);
  const degree = pick(track.degrees);
  const hasPg = chance(track.pgP) && (level0 >= 1 || track.prof);
  const pg = hasPg ? pick(track.pg) : undefined;
  let educationLevel = "Bachelor's";
  if (track.prof) educationLevel = pg && /^(MD|MS|MDS)/.test(pg) ? 'Doctorate' : 'Professional (MD / CA / LLB)';
  else if (pg) educationLevel = /MBA/.test(pg) ? 'MBA' : "Master's";
  if (trackKey === 'finance' && pg && /Chartered/.test(pg)) educationLevel = 'Professional (MD / CA / LLB)';
  if (trackKey === 'health' && !pg) educationLevel = 'Professional (MD / CA / LLB)';

  const height = gender === 'Male' ? clamp(Math.round(gauss(174, 6)), 160, 192) : clamp(Math.round(gauss(161, 5.3)), 148, 177);
  const maritalStatus = age >= 29 ? weighted([['Never married', 86], ['Divorced', 12], ['Widowed', 2]]) : 'Never married';

  const religionTrad = ['Muslim', 'Jain'].includes(community.religion) ? 1.5 : 1;
  const familyValues = weighted([['Traditional', 28 * religionTrad], ['Moderate', 50], ['Liberal', 22 / religionTrad]]);
  const diet = weighted(DIET_WEIGHTS[community.diet]);
  const manglik = ['Hindu', 'Jain'].includes(community.religion) ? weighted([['No', 72], ['Yes', 18], ['Anshik', 10]]) : 'Not applicable';
  const strictDrink = ['Muslim', 'Jain'].includes(community.religion);
  const drinking = strictDrink ? weighted([['Never', 88], ['Socially', 12]]) : weighted([['Never', 38], ['Socially', 54], ['Regularly', 8]]);
  const smoking = weighted([['Never', 82], ['Occasionally', 14], ['Regularly', 4]]);
  const intent = weighted([['Marriage within 12 months', 45], ['Marriage in 1–2 years', 35], ['Open to the right person', 20]]);
  const openComm = ['Muslim', 'Parsi', 'Jain'].includes(community.religion) ? 0.4 : 0.62;
  const abroad = place.country !== 'India';

  const interests = [];
  while (interests.length < 3) { const i = pick(Object.keys(INTERESTS)); if (!interests.includes(i)) interests.push(i); }

  const company = opts.company ?? pick(track.companies);
  const designation = pick(track.levels[level]);
  const email = (() => {
    let base = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '');
    let e = `${base}@example.com`, n = 1;
    while (usedEmails.has(e)) e = `${base}${++n}@example.com`;
    usedEmails.add(e); return e;
  })();
  const homeCity = pick(['Lucknow','Jaipur','Indore','Nagpur','Coimbatore','Kochi','Bhopal','Patna','Vadodara','Mysuru','Ludhiana','Dehradun']);
  const about =
    `${designation} at ${company}${place.city ? `, based in ${place.city}` : ''}. ` +
    `${chance(0.5) ? `Grew up in ${homeCity}. ` : ''}Weekends are usually spent ${INTERESTS[interests[0]]}` +
    `${chance(0.6) ? ` or ${INTERESTS[interests[1]]}` : ''}. ` +
    `${pick(VALUES_LINES[familyValues])} ${INTENT_LINES[intent]}`;

  const ageNow = age;
  const partnerAgeMin = gender === 'Male' ? Math.max(21, ageNow - int(5, 9)) : Math.max(24, ageNow - int(0, 3));
  const partnerAgeMax = gender === 'Male' ? ageNow + int(0, 2) : ageNow + int(4, 8);

  const dob = dobFor(age);
  const langs = [...new Set([...community.langs, 'English', ...(chance(0.25) ? ['Hindi'] : [])])];
  const verifiedOn = new Date(TODAY.getTime() - int(5, 150) * 86400000).toISOString().slice(0, 10);

  return {
    id,
    firstName: first, lastName: last, gender,
    dateOfBirth: dob,
    country: place.country, city: place.city, heightCm: height,
    email, phone: `+${abroad ? '44' : '91'} 9${int(1000, 9999)} ${int(10000, 99999)}`,
    college, degree, ...(pg ? { postGraduation: pg } : {}), educationLevel,
    incomeLpa: income, company, designation, industry: track.industry,
    maritalStatus, languages: langs,
    siblings: { brothers: weighted([[0, 45], [1, 45], [2, 10]]), sisters: weighted([[0, 45], [1, 45], [2, 10]]) },
    caste: community.caste, religion: community.religion,
    wantKids: weighted([['Yes', 62], ['Maybe', 28], ['No', 10]]),
    openToRelocate: abroad ? weighted([['Yes', 55], ['Maybe', 30], ['No', 15]]) : weighted([['Yes', 38], ['Maybe', 40], ['No', 22]]),
    openToPets: weighted([['Yes', 45], ['Maybe', 25], ['No', 30]]),
    familyType: weighted([['Nuclear', 58], ['Joint', 42]]),
    familyValues, diet, manglik, drinking, smoking,
    communityPreference: chance(openComm) ? 'Open to all' : 'Same community preferred',
    relationshipIntent: intent,
    partnerAgeMin, partnerAgeMax,
    interests, about, verified: true, verifiedOn,
  };
}

// ---------------------------------------------------------------- build
const pool = [];
for (let i = 1; i <= 120; i++) pool.push(makePerson(`p_${String(i).padStart(3, '0')}`, 'Female'));
for (let i = 121; i <= 240; i++) pool.push(makePerson(`p_${String(i).padStart(3, '0')}`, 'Male'));

// Hand-shaped client briefs so the demo covers distinct matching situations.
const STATUSES = ['Actively matching','Actively matching','Match shared','Profile verified','Meeting planned','New intake','On pause','Actively matching','Match shared','Actively matching','Profile verified','Actively matching','Meeting planned','Actively matching'];
const BRIEFS = [
  { g: 'Male', age: 34, track: 'tech', level: 2, place: { city: 'Bengaluru', country: 'India' }, mm: 'mm_priya' },
  { g: 'Female', age: 31, track: 'consulting', level: 2, place: { city: 'Mumbai', country: 'India' }, mm: 'mm_priya' },
  { g: 'Male', age: 36, track: 'finance', level: 3, place: { city: 'Singapore', country: 'Singapore' }, mm: 'mm_priya' },
  { g: 'Female', age: 29, track: 'health', level: 1, place: { city: 'Delhi', country: 'India' }, mm: 'mm_priya' },
  { g: 'Male', age: 32, track: 'business', level: 2, place: { city: 'Pune', country: 'India' }, mm: 'mm_priya' },
  { g: 'Female', age: 33, track: 'tech', level: 2, place: { city: 'Hyderabad', country: 'India' }, mm: 'mm_priya' },
  { g: 'Male', age: 30, track: 'law', level: 1, place: { city: 'Gurugram', country: 'India' }, mm: 'mm_priya' },
  { g: 'Female', age: 35, track: 'finance', level: 3, place: { city: 'London', country: 'United Kingdom' }, mm: 'mm_arjun' },
  { g: 'Male', age: 33, track: 'health', level: 2, place: { city: 'Chennai', country: 'India' }, mm: 'mm_arjun' },
  { g: 'Female', age: 28, track: 'tech', level: 1, place: { city: 'Bengaluru', country: 'India' }, mm: 'mm_arjun' },
  { g: 'Male', age: 35, track: 'consulting', level: 2, place: { city: 'Mumbai', country: 'India' }, mm: 'mm_arjun' },
  { g: 'Female', age: 30, track: 'business', level: 2, place: { city: 'Delhi', country: 'India' }, mm: 'mm_arjun' },
  { g: 'Male', age: 29, track: 'tech', level: 1, place: { city: 'Dubai', country: 'United Arab Emirates' }, mm: 'mm_arjun' },
  { g: 'Female', age: 32, track: 'media', level: 2, place: { city: 'Pune', country: 'India' }, mm: 'mm_arjun' },
];
const customers = BRIEFS.map((b, i) => {
  const p = makePerson(`c_${String(i + 1).padStart(3, '0')}`, b.g, { age: b.age, track: b.track, level: b.level, place: b.place });
  const joined = new Date(TODAY.getTime() - int(14, 190) * 86400000).toISOString().slice(0, 10);
  return { ...p, matchmakerId: b.mm, status: STATUSES[i], joinedOn: joined, intakeNote: INTAKE_NOTES[i % INTAKE_NOTES.length] };
});

// Sample credentials (documented in README). Hashed with bcrypt, cost 12.
const SAMPLE_PASSWORD = 'Welcome@TDC26';
const hash = bcrypt.hashSync(SAMPLE_PASSWORD, 12);
const matchmakers = [
  { id: 'mm_priya', username: 'priya', name: 'Priya Raghavan', passwordHash: hash },
  { id: 'mm_arjun', username: 'arjun', name: 'Arjun Malhotra', passwordHash: hash },
];

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'candidates.json'), JSON.stringify(pool, null, 1));
fs.writeFileSync(path.join(OUT, 'customers.json'), JSON.stringify(customers, null, 1));
fs.writeFileSync(path.join(OUT, 'matchmakers.json'), JSON.stringify(matchmakers, null, 2));
console.log(`Wrote ${pool.length} candidates, ${customers.length} customers, ${matchmakers.length} matchmakers to ${OUT}`);
console.log(`Sample ages (customers): ${customers.map((c) => ageOf(c.dateOfBirth)).join(', ')}`);
