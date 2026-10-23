'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SchoolChoice } from './school-model';

const SchoolChoicesContext = createContext<SchoolChoice[]>([]);

export interface SchoolChoicesProviderProps {
  schools: SchoolChoice[];
  children: ReactNode;
}

/**
 * The school list every role dialog of a users table needs, sent to the browser once per
 * table (a client provider around server children) rather than once per row.
 */
export function SchoolChoicesProvider({ schools, children }: SchoolChoicesProviderProps) {
  return <SchoolChoicesContext.Provider value={schools}>{children}</SchoolChoicesContext.Provider>;
}

export function useSchoolChoices(): SchoolChoice[] {
  return useContext(SchoolChoicesContext);
}
