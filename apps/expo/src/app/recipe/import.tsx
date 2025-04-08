import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";

import { trpc } from "~/utils/api";

export default function ImportScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();

  // Set up the import recipe mutation
  const importMutation = useMutation(
    trpc.recipes.importFromUrl.mutationOptions({
      onSuccess: (data) => {
        // Navigate to the recipe detail screen
        router.push(`/recipe/${data.id}`);
      },
      onError: (_error) => {
        // Go back to the home screen when import fails
        router.push("/");
        // We could show an alert here, but the home screen will already do that
      },
    }),
  );

  // Start import when the screen loads
  useEffect(() => {
    if (url && !importMutation.isPending && !importMutation.isSuccess) {
      importMutation.mutate({ url: decodeURIComponent(url) });
    }
  }, [url, importMutation]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: "Importing Recipe",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-1">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </Pressable>
          ),
        }}
      />

      <View className="flex-1 items-center justify-center px-6">
        <View className="items-center rounded-2xl bg-white p-8 shadow-md">
          <ActivityIndicator size="large" color="#f472b6" />

          <Text className="mt-6 text-center text-xl font-bold text-gray-800">
            Importing Recipe
          </Text>

          <Text className="mt-2 text-center text-base text-gray-600">
            We're scraping and processing your recipe.
          </Text>

          <Text className="mt-4 text-center text-sm text-gray-500">
            This process uses AI to extract ingredients and annotate the
            instructions for a better cooking experience.
          </Text>

          <View className="mt-6 w-full gap-1">
            <View className="flex-row items-center">
              <Ionicons name="search-outline" size={16} color="#9ca3af" />
              <Text className="ml-2 text-sm text-gray-500">
                Finding recipe data...
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="nutrition-outline" size={16} color="#9ca3af" />
              <Text className="ml-2 text-sm text-gray-500">
                Processing ingredients...
              </Text>
            </View>

            <View className="flex-row items-center">
              <Ionicons name="list-outline" size={16} color="#9ca3af" />
              <Text className="ml-2 text-sm text-gray-500">
                Annotating instructions...
              </Text>
            </View>
          </View>

          <Pressable
            className="mt-8 rounded-full bg-gray-200 px-6 py-2"
            onPress={() => router.push("/")}
          >
            <Text className="font-medium text-gray-700">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
