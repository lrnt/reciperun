import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Image,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery(trpc.recipes.getById.queryOptions({ id }));

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours} hr ${remainingMinutes} min`
      : `${hours} hr`;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <Stack.Screen
          options={{
            title: "Loading...",
            headerLeft: () => (
              <Pressable onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </Pressable>
            ),
          }}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f472b6" />
          <Text className="mt-4 text-lg text-gray-700">Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <Stack.Screen
          options={{
            title: "Error",
            headerLeft: () => (
              <Pressable onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </Pressable>
            ),
          }}
        />
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="warning-outline" size={60} color="#f87171" />
          <Text className="mt-4 text-center text-lg font-medium text-gray-800">
            Failed to load recipe
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            {error?.message ?? "Recipe not found"}
          </Text>
          <Pressable
            className="mt-6 rounded-full bg-pink-500 px-6 py-3"
            onPress={() => router.back()}
          >
            <Text className="font-medium text-white">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <Stack.Screen
        options={{
          title: recipe.title,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-1">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </Pressable>
          ),
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {recipe.imageUrl && (
          <Image
            source={{ uri: recipe.imageUrl }}
            className="h-64 w-full"
            resizeMode="cover"
          />
        )}

        <View className="px-4 py-6">
          <Text className="mb-2 text-2xl font-bold text-gray-800">
            {recipe.title}
          </Text>
          <Text className="mb-4 text-base text-gray-600">
            {recipe.description}
          </Text>

          <View className="mb-6 flex-row justify-between rounded-xl bg-gray-100 p-4">
            <View className="items-center">
              <Ionicons name="time-outline" size={24} color="#6b7280" />
              <Text className="mt-1 text-xs font-medium text-gray-500">
                Prep Time
              </Text>
              <Text className="text-sm font-bold text-gray-700">
                {formatTime(recipe.prepTime)}
              </Text>
            </View>
            <View className="items-center">
              <Ionicons name="flame-outline" size={24} color="#6b7280" />
              <Text className="mt-1 text-xs font-medium text-gray-500">
                Cook Time
              </Text>
              <Text className="text-sm font-bold text-gray-700">
                {formatTime(recipe.cookTime)}
              </Text>
            </View>
            <View className="items-center">
              <Ionicons name="restaurant-outline" size={24} color="#6b7280" />
              <Text className="mt-1 text-xs font-medium text-gray-500">
                Servings
              </Text>
              <Text className="text-sm font-bold text-gray-700">
                {recipe.servings}
              </Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="mb-3 text-xl font-bold text-gray-800">
              Ingredients
            </Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} className="mb-2 flex-row">
                <Text className="mr-2 text-pink-500">•</Text>
                <Text className="text-gray-700">{ingredient}</Text>
              </View>
            ))}
          </View>

          <View>
            <Text className="mb-3 text-xl font-bold text-gray-800">
              Instructions
            </Text>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} className="mb-4">
                <View className="mb-2 flex-row">
                  <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-pink-500">
                    <Text className="font-bold text-white">{index + 1}</Text>
                  </View>
                  <Text className="text-gray-700">{instruction}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}