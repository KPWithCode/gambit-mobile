import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const RegisterScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { register } = useAuth();

  const validate = () => {
    const newErrors: any = {};

    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    const result = await register(email, password, username);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Registration Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12">
        {/* Title */}
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-white">Create Account</Text>
          <Text className="text-slate-400 mt-2">Join Gambit and start battling</Text>
        </View>

        {/* Form */}
        <View>
          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="player123"
            error={errors.username}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={errors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <View className='items-center'> 

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            className="mt-2 w-full"
          />
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-400">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text className="text-primary font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
