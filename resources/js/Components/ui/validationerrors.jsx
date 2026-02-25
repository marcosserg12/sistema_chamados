import React from 'react';

// Mudamos para export nomeado para resolver o erro "does not provide an export named 'ValidationErrors'"
export function ValidationErrors({ errors }) {
    if (!errors || Object.keys(errors).length === 0) return null;

    return (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="font-medium text-red-600 text-sm">
                Ops! Algo deu errado:
            </div>

            <ul className="mt-2 list-disc list-inside text-xs text-red-500">
                {Object.keys(errors).map((key, index) => (
                    <li key={index}>{errors[key]}</li>
                ))}
            </ul>
        </div>
    );
}