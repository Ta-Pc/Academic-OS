import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AcademicTerm } from '../../types';
import { isWithinInterval, parseISO, startOfDay } from 'date-fns';

interface TermContextType {
  activeTermId: string | null;
  setActiveTermId: (termId: string | null) => void;
}

const TermContext = createContext<TermContextType | undefined>(undefined);

export const useTerm = (): TermContextType => {
  const context = useContext(TermContext);
  if (!context) {
    throw new Error('useTerm must be used within a TermProvider');
  }
  return context;
};

const getInitialTermId = (terms: AcademicTerm[]): string | null => {
    if (!terms || terms.length === 0) {
        return null;
    }
    const today = startOfDay(new Date());

    // Find the term that is currently active
    const activeTerm = terms.find(term => {
        try {
            const startDate = parseISO(term.startDate);
            const endDate = parseISO(term.endDate);
            return isWithinInterval(today, { start: startDate, end: endDate });
        } catch (e) {
            return false;
        }
    });

    if (activeTerm) {
        return activeTerm.id;
    }

    // If no active term, find the most recent one as a fallback
    const sortedTerms = [...terms].sort((a, b) => {
        try {
            // Sort by start date, descending
            return parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime();
        } catch (e) {
            return 0;
        }
    });
    return sortedTerms[0]?.id || null;
};


interface TermProviderProps {
  children: ReactNode;
  terms: AcademicTerm[];
}

export const TermProvider: React.FC<TermProviderProps> = ({ children, terms }) => {
  const [activeTermId, setActiveTermId] = useState<string | null>(() => getInitialTermId(terms));

  useEffect(() => {
    // This effect ensures that if terms are loaded asynchronously after the initial render,
    // the activeTermId is set correctly.
    if (terms.length > 0 && activeTermId === null) {
        setActiveTermId(getInitialTermId(terms));
    }
    // Also handle the case where the previously active term is no longer available
    else if (terms.length > 0 && activeTermId && !terms.some(t => t.id === activeTermId)) {
        setActiveTermId(getInitialTermId(terms));
    } else if (terms.length === 0) {
        setActiveTermId(null);
    }
  }, [terms, activeTermId]);

  const value = { activeTermId, setActiveTermId };

  return (
    <TermContext.Provider value={value}>
      {children}
    </TermContext.Provider>
  );
};