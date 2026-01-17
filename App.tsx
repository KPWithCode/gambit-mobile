import './global.css';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { useAuth } from './src/hooks/useAuth';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { DeckBuilderScreen } from '@/screens/DeckBuilderScreen';
import { PackStoreScreen } from '@/screens/PackStoreScreen';
import { PackOpeningScreen } from '@/screens/PackOpeningScreen';
import { BattleScreen } from '@/screens/HomeScreen';
import { BattleResultsScreen } from '@/screens/BattleResultsScreen';
import { MatchmakingScreen } from './src/screens/MatchmakingScreen';
import { ArenaScreen } from './src/screens/ArenaScreen';



const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || 'https://original-bear-224.convex.cloud';
console.log('🔗 Convex URL:', CONVEX_URL);
const convex = new ConvexReactClient(CONVEX_URL);
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
        },
        tabBarActiveTintColor: '#1a56db',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          tabBarLabel: 'Collection',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎴</Text>,
        }}
      />
      <Tab.Screen
        name="Deck"
        component={DeckBuilderScreen}
        options={{
          tabBarLabel: 'Deck',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🃏</Text>,
        }}
      />
      <Tab.Screen
        name="Battle"
        component={BattleScreen}
        options={{
          tabBarLabel: 'Battle',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>⚔️</Text>,
        }}
      />
      <Tab.Screen
        name="Packs"
        component={PackStoreScreen}
        options={{
          tabBarLabel: 'Packs',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📦</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function PlaceholderScreen() {
  const { signOut } = useAuth(); // Correctly get signOut from the hook here

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-white text-2xl">Coming Soon</Text>
      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-red-500/20 px-6 py-3 rounded-lg border border-red-500/50"
      >
        <Text className="text-red-500 font-semibold text-base">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, initAuth } = useAuth();

  useEffect(() => {
    initAuth();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1e293b', // Matches your tab bar
          },
          headerTintColor: '#ffffff', // Colors the back button and title text
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: { backgroundColor: '#0f172a' },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeTabs} options={{
              headerShown: true,
              headerTitle: '', // Removes the "Home" text
              headerShadowVisible: false, // Optional: Makes the transition to content smoother
            }} />

            <Stack.Screen
              name="PackOpening"
              component={PackOpeningScreen}
              options={{
                headerShown: false, // Hides header for full-screen feel
                presentation: 'modal', // Makes it slide up from the bottom
                animation: 'fade_from_bottom'
              }}
            />

            <Stack.Screen
              name="Matchmaking"
              component={MatchmakingScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />

            <Stack.Screen
              name="Arena"
              component={ArenaScreen}
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />

            <Stack.Screen
              name="BattleResults"
              component={BattleResultsScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <AppContent />
    </ConvexProvider>
  );
}