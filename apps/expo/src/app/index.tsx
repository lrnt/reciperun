import React from "react";
import { Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";

export default function Index() {
  return (
    <SafeAreaView className="bg-background">
      {/* Changes page title visible on the header */}
      <Stack.Screen options={{ title: "Reciperun" }} />
      <View className="h-full w-full bg-background p-4">
        <Text className="pb-2 text-center text-5xl font-bold text-foreground">
          Reciperun
        </Text>
        <Button title="Sign In" onPress={() => router.push("/sign-in")} />
        <Button title="Sign Up" onPress={() => router.push("/sign-up")} />
      </View>
    </SafeAreaView>
  );
}
