#!/usr/bin/env node

const domains = {
  main: 'https://edudashpro.org.za',
  app: 'https://app.edudashpro.org.za',
  vercel: 'https://edudashpro-6itwnkois-k1ng-devops-projects.vercel.app'
};


Object.entries(domains).forEach(([key, url]) => {
});


function updateConfig(domain) {
  
  
  
  
  return domain;
}


// If run with argument, configure that domain
const domainChoice = process.argv[2];
if (domainChoice) {
  const selectedDomain = domains[domainChoice.toLowerCase()] || domainChoice;
  updateConfig(selectedDomain);
} else {
}
