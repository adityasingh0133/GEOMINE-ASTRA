export type DemoAccount = {
  email: string
  name: string
  department: string
}

export const demoAccounts: DemoAccount[] = [
  {
    email: 'admin@geomine-astra.demo',
    name: 'Admin',
    department: 'CMPDI — Administration',
  },
  {
    email: 'inspector@geomine-astra.demo',
    name: 'Mine Inspector',
    department: 'CMPDI — Mine Inspection',
  },
  {
    email: 'manager@geomine-astra.demo',
    name: 'Mine Manager',
    department: 'CMPDI — Mine Management',
  },
]

export function getDemoAccount(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  return demoAccounts.find((account) => account.email === normalizedEmail)
}
