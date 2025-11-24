import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
    ({ children, className, isLoading, variant = 'primary', size = 'md', disabled, ...props }, ref) => {

        const variants = {
            primary: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 border-none",
            secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/10",
            outline: "bg-transparent border border-white/20 text-white hover:bg-white/5",
            ghost: "bg-transparent hover:bg-white/5 text-gray-300 hover:text-white",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-6 py-3 text-base",
            lg: "px-8 py-4 text-lg",
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={cn(
                    "relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

GradientButton.displayName = 'GradientButton';

export default GradientButton;
