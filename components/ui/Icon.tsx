import React from 'react';
import {
  Plus,
  FilePenLine,
  Clock,
  Search,
  X,
  Settings,
  Calendar,
  UserCircle,
  ChevronDown,
  ChevronLeft,
  MoreVertical,
  Archive,
  Trash2,
  Target,
  Focus,
  Check,
  ArrowUp,
  TrendingUp,
  HelpCircle,
  ClipboardList,
  BookText,
  Beaker,
  Star,
  Users,
  Presentation,
  History,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  GraduationCap,
  // FIX: Corrected icon name from 'PaintBrush' to 'Paintbrush' to match lucide-react export.
  Paintbrush,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart,
  FileText,
  Timer,
  Loader2,
  UploadCloud,
  LucideProps,
  LucideIcon as LucideIconType
} from 'lucide-react';

const iconMap = {
  Plus,
  FilePenLine,
  Clock,
  Search,
  X,
  Settings,
  Calendar,
  UserCircle,
  ChevronDown,
  ChevronLeft,
  MoreVertical,
  Archive,
  Trash2,
  Target,
  Focus,
  Check,
  ArrowUp,
  TrendingUp,
  HelpCircle,
  ClipboardList,
  BookText,
  Beaker,
  Star,
  Users,
  Presentation,
  History,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  GraduationCap,
  // FIX: Corrected icon name from 'PaintBrush' to 'Paintbrush' to match lucide-react export.
  Paintbrush,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart,
  FileText,
  Timer,
  Loader2,
  UploadCloud,
};

export type IconName = keyof typeof iconMap;

// FIX: Removed redundant `className` property. It's already part of `LucideProps`, and redefining it might interfere with type inference for other props like `strokeWidth`.
interface IconProps extends LucideProps {
  name: IconName;
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = iconMap[name] as LucideIconType;
  if (!LucideIcon) return null; // Or return a placeholder
  return <LucideIcon {...props} />;
};
