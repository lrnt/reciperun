import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { RecipeListItem } from "@reciperun/trpc/recipes";

import { trpc } from "~/utils/api";

export default function RecipesScreen() {
  const router = useRouter();
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importUrl, setImportUrl] = useState("");

  // Get the recipes query
  const {
    data: recipes,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery(trpc.recipes.getAll.queryOptions());

  // Set up the import recipe mutation
  const importMutation = useMutation(
    trpc.recipes.importFromUrl.mutationOptions({
      onSuccess: (_data) => {
        setIsImportModalVisible(false);
        setImportUrl("");

        Alert.alert("Success", "Recipe imported successfully!", [
          { text: "OK" },
        ]);
        // Refresh the recipe list
        void refetch();
      },
      onError: (error) => {
        Alert.alert(
          "Import Failed",
          `Failed to import recipe: ${error.message}`,
          [{ text: "OK" }],
        );
      },
    }),
  );

  // Handle recipe import
  const handleImportRecipe = () => {
    if (!importUrl.trim()) {
      Alert.alert("Error", "Please enter a valid URL");
      return;
    }
    importMutation.mutate({ url: importUrl.trim() });
  };

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

  const RecipeCard = ({ item }: { item: RecipeListItem }) => (
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
        // Navigate to recipe detail
        router.push(`/recipe/${item.id}`);
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
          {item.prepTime && (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={18} color="#6b7280" />
              <Text className="ml-1 text-sm text-gray-500">
                Prep: {formatTime(item.prepTime)}
              </Text>
            </View>
          )}
          {item.cookTime && (
            <View className="flex-row items-center">
              <Ionicons name="flame-outline" size={18} color="#6b7280" />
              <Text className="ml-1 text-sm text-gray-500">
                Cook: {formatTime(item.cookTime)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  const ListHeader = () => (
    <View className="mb-4 pt-2">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-gray-800">Recipes</Text>

        <View className="flex-row items-center">
          {isCachedAndOffline && (
            <View className="mr-2 flex-row items-center rounded-full bg-gray-100 px-3 py-1">
              <Ionicons
                name="cloud-offline-outline"
                size={14}
                color="#9ca3af"
              />
              <Text className="ml-1 text-xs text-gray-500">Offline</Text>
            </View>
          )}

          <TouchableOpacity
            className="flex-row items-center rounded-full bg-blue-500 px-3 py-2"
            onPress={() => setIsImportModalVisible(true)}
          >
            <Ionicons name="add-outline" size={16} color="#ffffff" />
            <Text className="ml-1 text-sm font-medium text-white">Import</Text>
          </TouchableOpacity>
        </View>
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
                  <Ionicons name="bug-outline" size={60} color="#d1d5db" />
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

      {/* Import Recipe Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isImportModalVisible}
        onRequestClose={() => {
          if (!importMutation.isPending) {
            setIsImportModalVisible(false);
            setImportUrl("");
          }
        }}
      >
        <View className="flex-1 justify-center bg-black/50">
          <View className="mx-5 rounded-2xl bg-white p-6 shadow-xl">
            <Text className="mb-4 text-center text-2xl font-bold text-gray-800">
              Import Recipe
            </Text>

            <Text className="mb-2 text-base text-gray-600">
              Paste a URL to a recipe page to import it
            </Text>

            <TextInput
              className="mb-4 rounded-lg border border-gray-300 bg-gray-50 p-3 text-base"
              placeholder="https://example.com/recipe"
              value={importUrl}
              onChangeText={setImportUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!importMutation.isPending}
            />

            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="rounded-lg border border-gray-300 px-4 py-2"
                onPress={() => {
                  if (!importMutation.isPending) {
                    setIsImportModalVisible(false);
                    setImportUrl("");
                  }
                }}
                disabled={importMutation.isPending}
              >
                <Text className="text-base font-medium text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="rounded-lg bg-blue-500 px-4 py-2"
                onPress={handleImportRecipe}
                disabled={importMutation.isPending || !importUrl.trim()}
              >
                {importMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-base font-medium text-white">
                    Import
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
