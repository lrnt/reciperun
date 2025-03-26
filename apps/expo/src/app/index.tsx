import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import type { Recipe } from "@reciperun/trpc/router/recipes";

import { trpc } from "~/utils/api";

export default function RecipesScreen() {
  const {
    data: recipes,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery(trpc.recipes.getAll.queryOptions());

  // Determine if we're showing cached data
  const hasCachedData = recipes && recipes.length > 0;
  const isCachedAndOffline = error && hasCachedData;

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

  const RecipeCard = ({ item }: { item: Recipe }) => (
    <Pressable
      className="mb-6 overflow-hidden rounded-2xl bg-white"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
      onPress={() => {
        // Navigate to recipe detail when implemented
        console.log("Navigate to recipe detail", item.id);
      }}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          className="h-56 w-full"
          resizeMode="cover"
        />
      )}
      <View className="p-5">
        <Text className="mb-2 text-2xl font-bold text-gray-800">
          {item.title}
        </Text>
        <Text className="mb-4 text-base text-gray-600">{item.description}</Text>

        <View className="mb-1 flex-row justify-between">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={18} color="#6b7280" />
            <Text className="ml-1 text-sm text-gray-500">
              Prep: {formatTime(item.prepTime)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="flame-outline" size={18} color="#6b7280" />
            <Text className="ml-1 text-sm text-gray-500">
              Cook: {formatTime(item.cookTime)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="restaurant-outline" size={18} color="#6b7280" />
          <Text className="ml-1 text-sm text-gray-500">
            Serves: {item.servings}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const ListHeader = () => (
    <View className="mb-4 pt-2">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-gray-800">Recipes</Text>

        {isCachedAndOffline && (
          <View className="flex-row items-center rounded-full bg-gray-100 px-3 py-1">
            <Ionicons name="cloud-offline-outline" size={14} color="#9ca3af" />
            <Text className="ml-1 text-xs text-gray-500">
              Offline
            </Text>
          </View>
        )}
      </View>

      <Text className="mb-2 text-gray-600">
        What would you like to cook today?
      </Text>
    </View>
  );

  const LoadingView = () => (
    <View className="flex-1 items-center justify-center p-4">
      <ActivityIndicator size="large" color="#f472b6" />
      <Text className="mt-4 text-lg text-gray-700">
        Loading delicious recipes...
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <Stack.Screen
        options={{
          headerTitle: "RecipeRun",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: "#f9fafb", // gray-50
          },
        }}
      />

      <View className="flex-1 px-4">
        {isLoading ? (
          <LoadingView />
        ) : (
          <FlatList
            data={recipes}
            renderItem={({ item }) => <RecipeCard item={item} />}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListHeaderComponent={<ListHeader />}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={["#f472b6"]}
                tintColor="#f472b6"
              />
            }
            ListEmptyComponent={
              error ? (
                <View className="flex-1 items-center justify-center p-10">
                  <Ionicons
                    name="bug-outline"
                    size={60}
                    color="#d1d5db"
                  />
                  <Text className="mt-4 text-center text-lg text-gray-400">
                    Looks like something went wrong
                  </Text>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center p-10">
                  <Ionicons
                    name="restaurant-outline"
                    size={60}
                    color="#d1d5db"
                  />
                  <Text className="mt-4 text-center text-lg text-gray-400">
                    No recipes found
                  </Text>
                </View>
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
