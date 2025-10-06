import React from 'react';
import { Icon, IconName } from './ui/Icon';

const IconWrapper: React.FC<{ name: IconName, className?: string }> = ({ name, className }) => (
    <Icon name={name} className={`w-5 h-5 ${className}`} strokeWidth={1.5} />
);

export const ASSESSMENT_TYPE_ICONS: Record<string, React.ReactElement> = {
    'Quiz': <IconWrapper name="HelpCircle" />,
    'Semester Test': <IconWrapper name="ClipboardList" />,
    'Assignment': <IconWrapper name="FilePenLine" />,
    'Homework': <IconWrapper name="BookText" />,
    'Practical': <IconWrapper name="Beaker" />,
    'Exam': <IconWrapper name="Star" className="text-violet-500" />,
    'Tutorial': <IconWrapper name="Users" />,
    'Class Test': <IconWrapper name="Presentation" />
};
