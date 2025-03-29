
const firstNames = [
  "Kafka", "Darcy", "Austen", "Poe", "Woolf", "Tolstoy", "Bronte", 
  "Shelley", "Dickens", "Fitzgerald", "Hemingway", "Orwell", "Plath"
];

const getRandomNumber = () => {
  return Math.floor(Math.random() * 900) + 100; // Random 3-digit number
};

export const generateLiteraryUsername = (): string => {
  const randomIndex = Math.floor(Math.random() * firstNames.length);
  const randomName = firstNames[randomIndex];
  const randomNumber = getRandomNumber();
  
  return `${randomName}${randomNumber}`;
};

export const validateUsername = (username: string): boolean => {
  // Check length requirement
  if (username.length < 3) {
    return false;
  }
  
  // Simple check for potentially harmful inputs
  const invalidPatterns = [
    '<script>', 'script>', '\'', '"', ';', '--', '/*', '*/', '<iframe>', 
    'onload=', 'onerror=', 'onclick=', 'alert('
  ];
  
  return !invalidPatterns.some(pattern => username.toLowerCase().includes(pattern.toLowerCase()));
};
