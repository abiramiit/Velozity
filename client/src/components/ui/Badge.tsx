import React from 'react';

type Color = 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple';

export const Badge = ({ children, color = 'gray' }: { children: React.ReactNode, color?: Color }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-800 border-blue-200',
        green: 'bg-green-100 text-green-800 border-green-200',
        red: 'bg-red-100 text-red-800 border-red-200',
        yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        gray: 'bg-gray-100 text-gray-800 border-gray-200',
        purple: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
            {children}
        </span>
    );
}
