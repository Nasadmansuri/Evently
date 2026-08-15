const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com' , 'bic.edu.np'];

const TYPO_MAP = {
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com',
  'mgail.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmailc.om': 'gmail.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com',
  'outlok.com': 'outlook.com', 'outllok.com': 'outlook.com',
  'hotnail.com': 'hotmail.com', 'hotmial.com': 'hotmail.com',
  'iclould.com': 'icloud.com', 'iclud.com': 'icloud.com',
  'bic.edu.np': 'bic.edu.np'
};

export function suggestEmailCorrection(email) {
  const at = email.lastIndexOf('@');
  if (at === -1) return null;
  const domain = email.slice(at + 1).toLowerCase();
  if (COMMON_DOMAINS.includes(domain)) return null;
  const suggestion = TYPO_MAP[domain];
  return suggestion ? email.slice(0, at + 1) + suggestion : null;
}