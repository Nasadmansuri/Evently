import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

const baseIconProps = { size: 16 };

export const showToast = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  info: (message) =>
    toast(message, {
      icon: <Info {...baseIconProps} color="#2563EB" />,
      style: { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' },
    }),
  warning: (message) =>
    toast(message, {
      icon: <AlertTriangle {...baseIconProps} color="#B45309" />,
      style: { background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' },
    }),
};