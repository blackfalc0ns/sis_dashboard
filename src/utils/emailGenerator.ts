// FILE: src/utils/emailGenerator.ts

/**
 * Generate random email addresses for students and guardians
 */

const emailDomains = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "email.com",
  "mail.com",
  "icloud.com",
];

/**
 * Transliterate Arabic name to English for email
 */
function transliterateArabicName(arabicName: string): string {
  const transliterationMap: { [key: string]: string } = {
    أ: "a",
    ا: "a",
    إ: "i",
    آ: "aa",
    ب: "b",
    ت: "t",
    ث: "th",
    ج: "j",
    ح: "h",
    خ: "kh",
    د: "d",
    ذ: "dh",
    ر: "r",
    ز: "z",
    س: "s",
    ش: "sh",
    ص: "s",
    ض: "d",
    ط: "t",
    ظ: "z",
    ع: "a",
    غ: "gh",
    ف: "f",
    ق: "q",
    ك: "k",
    ل: "l",
    م: "m",
    ن: "n",
    ه: "h",
    و: "w",
    ي: "y",
    ى: "a",
    ة: "a",
    ء: "a",
  };

  let result = "";
  for (const char of arabicName) {
    if (transliterationMap[char]) {
      result += transliterationMap[char];
    } else if (char === " ") {
      result += ".";
    } else {
      result += char.toLowerCase();
    }
  }

  return result;
}

/**
 * Generate email from English name
 */
function generateEmailFromEnglishName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
}

/**
 * Generate random email for a person
 */
export function generateRandomEmail(
  englishName?: string,
  arabicName?: string,
  id?: string,
): string {
  const domain = emailDomains[Math.floor(Math.random() * emailDomains.length)];

  let username = "";

  if (englishName) {
    username = generateEmailFromEnglishName(englishName);
  } else if (arabicName) {
    username = transliterateArabicName(arabicName);
  } else if (id) {
    username = `user${id}`;
  } else {
    username = `user${Math.floor(Math.random() * 10000)}`;
  }

  // Add random number for uniqueness
  const randomNum = Math.floor(Math.random() * 999);
  if (randomNum > 0) {
    username += randomNum;
  }

  return `${username}@${domain}`;
}

/**
 * Generate student email
 */
export function generateStudentEmail(
  studentId: string,
  englishName?: string,
  arabicName?: string,
): string {
  return generateRandomEmail(englishName, arabicName, studentId);
}

/**
 * Generate guardian email
 */
export function generateGuardianEmail(
  guardianId: string,
  englishName?: string,
  arabicName?: string,
): string {
  return generateRandomEmail(englishName, arabicName, guardianId);
}

/**
 * Batch generate emails for multiple people
 */
export function generateBatchEmails(
  people: Array<{
    id: string;
    englishName?: string;
    arabicName?: string;
  }>,
): Map<string, string> {
  const emailMap = new Map<string, string>();

  people.forEach((person) => {
    const email = generateRandomEmail(
      person.englishName,
      person.arabicName,
      person.id,
    );
    emailMap.set(person.id, email);
  });

  return emailMap;
}
