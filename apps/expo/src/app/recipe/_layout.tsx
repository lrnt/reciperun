import { Stack } from "expo-router";

export default function RecipeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#f9fafb",
        },
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShadowVisible: false,
        animation: "slide_from_right",
      }}
    />
  );
}