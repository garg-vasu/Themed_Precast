/**
 * Converts a number to words in Indian numbering system (Lakh, Crore).
 * Used for displaying currency amounts in words.
 */
const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];
const teens = [
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

function convertLessThanThousand(n: number): string {
  if (n === 0) return "";
  let result = "";
  if (n >= 100) {
    result += ones[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    result += tens[Math.floor(n / 10)] + " ";
    n %= 10;
  } else if (n >= 10) {
    result += teens[n - 10] + " ";
    return result.trim();
  }
  if (n > 0) {
    result += ones[n] + " ";
  }
  return result.trim();
}

export function numberToWordsInr(num: number): string {
  if (isNaN(num) || num < 0) return "Invalid amount";
  if (num === 0) return "Zero Rupees";

  const wholePart = Math.floor(num);
  let result = "";

  if (wholePart >= 10000000) {
    // Crore
    const crores = Math.floor(wholePart / 10000000);
    result += convertLessThanThousand(crores) + " Crore ";
  }
  if (wholePart % 10000000 >= 100000) {
    // Lakh
    const lakhs = Math.floor((wholePart % 10000000) / 100000);
    result += convertLessThanThousand(lakhs) + " Lakh ";
  }
  if (wholePart % 100000 >= 1000) {
    // Thousand
    const thousands = Math.floor((wholePart % 100000) / 1000);
    result += convertLessThanThousand(thousands) + " Thousand ";
  }
  if (wholePart % 1000 > 0) {
    result += convertLessThanThousand(wholePart % 1000) + " ";
  }

  result = result.trim() + " Rupees";
  return result.trim();
}
