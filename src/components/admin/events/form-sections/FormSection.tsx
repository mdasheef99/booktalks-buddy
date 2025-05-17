import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * A wrapper component for form sections with consistent styling
 */
const FormSection: React.FC<FormSectionProps> = ({ title, children }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      {children}
    </div>
  );
};

export default FormSection;
