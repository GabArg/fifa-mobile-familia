import React from 'react';

export const Card = ({ children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`glass-panel app-card ${className}`}
        >
            {children}
        </div>
    );
};
