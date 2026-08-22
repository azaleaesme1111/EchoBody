export interface ModuleRoute {
  path: string
  label: string
  desc: string
  color: string
  icon: string
}

export const MODULES: ModuleRoute[] = [
  { path: '/course', label: 'Course Design', color: '#7C3AED', desc: 'Lesson plans, activity ideas, discussion questions, PPT templates', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z' },
  { path: '/roleplay', label: 'Role Play', color: '#DB2777', desc: 'Scenario role-play, analysis, group discussion', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z' },
  { path: '/questions', label: 'Anonymous Box', color: '#16A34A', desc: 'Anonymous questions, safe expression', icon: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z' },
  { path: '/dashboard', label: 'Dashboard', color: '#0891B2', desc: 'Track student assignment progress, view completion rates and export reports', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { path: '/faq', label: 'FAQ', color: '#D97706', desc: 'Common questions, age-group versions, discussion tips', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
]
