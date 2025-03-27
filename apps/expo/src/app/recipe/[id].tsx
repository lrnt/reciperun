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

// Define the Ingredient type to match what's in the router
interface Ingredient {
  name: string;
  quantity: number;
  unit?: string;
}

// Function to render annotated text with ingredient references
const renderAnnotatedText = (
  annotatedText: string,
  annotations: Record<string, any> | undefined,
  ingredients: Ingredient[],
  servingsMultiplier: number
) => {
  if (!annotatedText || !annotations) {
    return <Text className="text-gray-700">{annotatedText || ""}</Text>;
  }

  // Parse the markdown-style links in the text
  // Format example: "Bring [salted water](#1) to boil and cook [spaghetti](#2)"
  
  // We'll split the text by markdown links and render each part
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let currentIndex = 0;
  
  // Regular expression to find markdown links: [text](#id)
  const linkRegex = /\[([^\]]+)\]\(#([^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(annotatedText)) !== null) {
    const [fullMatch, linkText, linkId] = match;
    const matchIndex = match.index;
    
    // Add text before the link
    if (matchIndex > lastIndex) {
      const textBefore = annotatedText.substring(lastIndex, matchIndex);
      parts.push(
        <Text key={`text-${currentIndex}`} className="text-gray-700">
          {textBefore}
        </Text>
      );
      currentIndex++;
    }
    
    // Process the link based on the annotation
    if (!annotations) {
      // If annotations are undefined, just render the link text
      parts.push(
        <Text key={`link-${currentIndex}`} className="text-gray-700">
          {linkText}
        </Text>
      );
      currentIndex++;
    } else {
      // Since we checked that annotations exists at the start of the function,
      // this is safe to access, but TypeScript is cautious
      // TypeScript already validated that annotations exists in this block
      // @ts-ignore - We already checked that annotations exists at the start of the function
      const annotation = annotations[linkId];
      if (annotation) {
        // Check if it's an ingredient reference
        if (annotation.ingredientIndex !== undefined && 
            annotation.ingredientIndex >= 0 && 
            annotation.ingredientIndex < ingredients.length) {
          
          const ingredient = ingredients[annotation.ingredientIndex];
          
          // Calculate quantity text
          let quantityText = '';
          if (ingredient === undefined) {
            quantityText = "unknown";
          } else if (annotation.customText) {
            // Use custom text if provided
            quantityText = annotation.customText;
          } else if (annotation.portionUsed && annotation.portionUsed !== 1 && ingredient) {
            // Format partial quantities
            const portionUsed = annotation.portionUsed;
            const scaledQuantity = ingredient.quantity * servingsMultiplier * portionUsed;
            const formattedQuantity = parseFloat(scaledQuantity.toFixed(2)).toString();
            quantityText = ingredient.unit 
              ? `${formattedQuantity} ${ingredient.unit}`
              : formattedQuantity;
          } else if (ingredient) {
            // Full quantity
            const scaledQuantity = ingredient.quantity * servingsMultiplier;
            const formattedQuantity = parseFloat(scaledQuantity.toFixed(2)).toString();
            quantityText = ingredient.unit 
              ? `${formattedQuantity} ${ingredient.unit}`
              : formattedQuantity;
          }
          
          // Render the ingredient with its quantity
          parts.push(
            <Text key={`link-${currentIndex}`} className="text-gray-700">
              <Text className="font-semibold">{linkText}</Text>
              <Text className="text-pink-600"> ({quantityText})</Text>
              {annotation.note && (
                <Text className="italic text-gray-500"> {annotation.note}</Text>
              )}
            </Text>
          );
        } else {
          // This is a non-ingredient annotation (e.g., a note)
          parts.push(
            <Text key={`link-${currentIndex}`} className="text-gray-700">
              <Text className="font-semibold">{linkText}</Text>
              {annotation.note && (
                <Text className="italic text-gray-500"> ({annotation.note})</Text>
              )}
            </Text>
          );
        }
        currentIndex++;
      } else {
        // Annotation not found, just render the text
        parts.push(
          <Text key={`link-${currentIndex}`} className="text-gray-700">
            {linkText}
          </Text>
        );
        currentIndex++;
      }
    }
    
    lastIndex = matchIndex + fullMatch.length;
  }
  
  // Add any remaining text after the last link
  if (lastIndex < annotatedText.length) {
    const textAfter = annotatedText.substring(lastIndex);
    parts.push(
      <Text key={`text-${currentIndex}`} className="text-gray-700">
        {textAfter}
      </Text>
    );
  }
  
  // Return the combined elements
  return (
    <Text className="text-gray-700">
      {parts}
    </Text>
  );
};

export default function RecipeDetailScreen() {
  // Display recipe details with annotation support
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Default to 4 servings (4x the base recipe which is for 1 serving)
  const [servingsMultiplier, setServingsMultiplier] = React.useState(4);

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
        <View className="relative">
          {recipe.imageUrl && (
            <Image
              source={{ uri: recipe.imageUrl }}
              className="h-64 w-full"
              resizeMode="cover"
            />
          )}
          
          {/* Time overlays - stacked */}
          <View className="absolute bottom-3 right-3 gap-2">
            <View className="flex-row items-center rounded-full bg-black/70 px-3 py-1.5">
              <Ionicons name="time-outline" size={16} color="#fff" />
              <Text className="ml-1 text-sm font-medium text-white">
                Prep: {formatTime(recipe.prepTime)}
              </Text>
            </View>
            
            <View className="flex-row items-center rounded-full bg-black/70 px-3 py-1.5">
              <Ionicons name="flame-outline" size={16} color="#fff" />
              <Text className="ml-1 text-sm font-medium text-white">
                Cook: {formatTime(recipe.cookTime)}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 py-6">
          <Text className="mb-2 text-2xl font-bold text-gray-800">
            {recipe.title}
          </Text>
          <Text className="mb-5 text-base text-gray-600">
            {recipe.description}
          </Text>

          <View className="mb-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-800">
                Ingredients
              </Text>
              <View className="flex-row items-center">
                <Text className="mr-1 text-sm text-gray-600">Servings:</Text>
                <Pressable 
                  className="h-7 w-7 items-center justify-center rounded-full bg-gray-200"
                  onPress={() => {
                    if (servingsMultiplier > 1) {
                      setServingsMultiplier(prev => prev - 1);
                    }
                  }}
                >
                  <Text className="font-bold text-gray-700">-</Text>
                </Pressable>
                <Text className="mx-2 text-base font-medium text-gray-700">
                  {servingsMultiplier}
                </Text>
                <Pressable 
                  className="h-7 w-7 items-center justify-center rounded-full bg-gray-200"
                  onPress={() => {
                    setServingsMultiplier(prev => prev + 1);
                  }}
                >
                  <Text className="font-bold text-gray-700">+</Text>
                </Pressable>
              </View>
            </View>
            
            {recipe.ingredients.map((ingredient, index) => {
              // Calculate scaled quantity
              const scaledQuantity = ingredient.quantity * servingsMultiplier;
              
              // Format quantity - round to 2 decimal places and remove trailing zeros
              const formattedQuantity = parseFloat(scaledQuantity.toFixed(2)).toString();
              
              const quantityText = ingredient.unit && ingredient.unit !== "to taste" && ingredient.unit !== "for garnish" 
                ? `${formattedQuantity} ${ingredient.unit}` 
                : ingredient.unit === "to taste" || ingredient.unit === "for garnish"
                  ? ingredient.unit
                  : formattedQuantity;
                
              return (
                <View key={index} className="mb-2 flex-row justify-between border-b border-gray-100 pb-2">
                  <View className="flex-row flex-1 mr-4">
                    <Text className="mr-2 text-pink-500">•</Text>
                    <Text className="text-gray-700">{ingredient.name}</Text>
                  </View>
                  <Text className="font-medium text-gray-600">{quantityText}</Text>
                </View>
              );
            })}
          </View>

          <View>
            <Text className="mb-3 text-xl font-bold text-gray-800">
              Instructions
            </Text>
            {recipe.instructions.map((instruction, index) => {
              return (
                <View key={index} className="mb-4">
                  <View className="mb-2 flex-row">
                    <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-pink-500">
                      <Text className="font-bold text-white">{index + 1}</Text>
                    </View>
                    
                    {instruction.annotatedText ? (
                      <View className="flex-1">
                        {/* Parse and render the annotated text */}
                        {renderAnnotatedText(instruction.annotatedText, instruction.annotations, recipe.ingredients, servingsMultiplier)}
                      </View>
                    ) : instruction.ingredientsUsed && instruction.ingredientsUsed.length > 0 ? (
                      // Try ingredient enhancement approach
                      <Text className="text-gray-700 flex-1">
                        {(() => {
                          // Create an enhanced version of the text with ingredient quantities
                          let enhancedText = instruction.text;
                          
                          // First, collect all ingredient information
                          const ingredientInfos = instruction.ingredientsUsed.map(ref => {
                            // Ensure index is valid
                            if (ref.ingredientIndex < 0 || ref.ingredientIndex >= recipe.ingredients.length) {
                              return { name: "unknown", displayText: "" };
                            }
                            
                            const ingredient = recipe.ingredients[ref.ingredientIndex];
                            if (!ingredient) {
                              return { name: "unknown", displayText: "" };
                            }
                            
                            // Calculate scaled quantity
                            let displayText = '';
                            
                            if (ref.customText) {
                              // Use custom text if provided
                              displayText = ref.customText;
                            } else if (ref.portionUsed && ref.portionUsed !== 1) {
                              // Format partial quantities
                              const portionUsed = ref.portionUsed;
                              const scaledQuantity = ingredient.quantity * servingsMultiplier * portionUsed;
                              const formattedQuantity = parseFloat(scaledQuantity.toFixed(2)).toString();
                              displayText = ingredient.unit 
                                ? `${formattedQuantity} ${ingredient.unit}`
                                : formattedQuantity;
                            } else {
                              // Full quantity
                              const scaledQuantity = ingredient.quantity * servingsMultiplier;
                              const formattedQuantity = parseFloat(scaledQuantity.toFixed(2)).toString();
                              displayText = ingredient.unit 
                                ? `${formattedQuantity} ${ingredient.unit}`
                                : formattedQuantity;
                            }
                            
                            return {
                              name: ingredient.name,
                              displayText
                            };
                          });
                          
                          // Now enhance the instruction text by appending quantities
                          ingredientInfos.forEach(info => {
                            const nameRegex = new RegExp(`\\b${info.name}\\b`, 'i');
                            if (nameRegex.test(enhancedText)) {
                              enhancedText = enhancedText.replace(
                                nameRegex, 
                                `${info.name} (${info.displayText})`
                              );
                            }
                          });
                          
                          return enhancedText;
                        })()}
                      </Text>
                    ) : (
                      // Fall back to plain text
                      <Text className="text-gray-700 flex-1">{instruction.text}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}