import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}) => {
  const baseStyles = 'py-4 px-6 rounded-lg items-center justify-center';
  
  const variantStyles = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'border-2 border-primary bg-transparent',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary',
  };

  const disabledStyles = disabled || loading ? 'opacity-50' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#1a56db' : '#ffffff'} />
      ) : (
        <Text className={`font-semibold text-lg ${textStyles[variant]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
