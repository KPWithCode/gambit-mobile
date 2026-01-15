import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AppImages } from "../../assets";

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn } = useAuth();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo/Title */}
        <View className="items-center mb-6">
          {/* <Text className="text-5xl font-bold text-white mb-2">🎮</Text> */}
          <Image
            source={AppImages.GambitLogo}
            className="w-48 h-48 "
            resizeMode="contain"
          />
          <Text className="text-4xl font-bold text-white">Gambit</Text>
          <Text className="text-slate-400 mt-2">Build Your Dynasty</Text>
          {/*           <Text className="text-slate-400 mt-2">Every Card Tells a Story</Text>*/}
          {/*           <Text className="text-slate-400 mt-2">Collect. Build. Dominate.</Text>*/}
          {/*           <Text className="text-slate-400 mt-2">Your Deck. Your Strategy. Your Victory.</Text>*/}
        </View>

        {/* Form */}
        <View>
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
          <View className='items-center'>
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            className="mt-2 w-full "
          />
          </View>

          {/* Register Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-400">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-primary font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
