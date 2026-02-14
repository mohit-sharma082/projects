import { Moon, Sun } from 'lucide-react';

import { Button } from './ui/button';
import { useTheme } from './theme-provider';
import React from 'react';
import { cn } from '../lib/utils';

export const ModeToggle = React.forwardRef<
    React.ElementRef<typeof Button>,
    React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
    const { setTheme, theme } = useTheme();

    const toggleTheme = () => {
        if (theme == 'dark') {
            setTheme('light');
        } else if (theme == 'light') {
            setTheme('dark');
        } else {
            setTheme('system');
        }
    };

    return (
        <Button
            variant='ghost'
            size='icon'
            className={cn('h-7 w-7', className)}
            onClick={(event) => {
                onClick?.(event);
                toggleTheme();
            }}
            {...props}>
            {theme == 'light' ? <Moon /> : <Sun />}
            <span className='sr-only'>Toggle Sidebar</span>
        </Button>
    );
});
