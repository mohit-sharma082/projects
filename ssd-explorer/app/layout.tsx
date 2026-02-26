import type { Metadata } from 'next';
import { JetBrains_Mono, Google_Sans } from 'next/font/google';
// @ts-ignore
import './globals.css';

const font = Google_Sans({
    variable: '--font-google-sans',
    subsets: ['latin'],
});

import Providers from '@/components/Providers';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata = {
    title: 'SSD Explorer',
    description: 'SSD Explorer - A tool to explore and analyze SSDs.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang='en' suppressHydrationWarning>
            <head />
            <body className={`${font.variable} ${font.className} `}>
                <ThemeProvider
                    attribute='class'
                    defaultTheme='system'
                    enableSystem
                    disableTransitionOnChange>
                    <Providers>{children}</Providers>
                </ThemeProvider>
            </body>
        </html>
    );
}
