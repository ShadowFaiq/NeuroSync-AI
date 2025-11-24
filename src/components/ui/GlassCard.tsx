import React from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, hoverEffect = true, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6",
                    hoverEffect && "hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
