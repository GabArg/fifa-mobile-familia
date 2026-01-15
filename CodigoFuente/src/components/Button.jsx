import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
    return (
        <button
            onClick={onClick}
            className={`app-btn app-btn-${variant} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
