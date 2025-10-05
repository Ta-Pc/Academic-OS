import React from 'react';
import { AcademicTerm } from '../../types';
import { useTerm } from '../contexts/TermContext';
import TermSelector from '../common/TermSelector';

interface Props {
    terms: AcademicTerm[];
    isMobile?: boolean;
}

const GlobalTermSelector: React.FC<Props> = ({ terms, isMobile = false }) => {
    const { activeTermId, setActiveTermId } = useTerm();

    return (
        <TermSelector
            value={activeTermId}
            onChange={(termId) => setActiveTermId(termId)}
            allTerms={terms}
            visibleTermTypes={['Year', 'Semester', 'Quarter']}
            selectableTermTypes={['Year', 'Semester', 'Quarter']}
            isMobile={isMobile}
        />
    );
};

export default GlobalTermSelector;
