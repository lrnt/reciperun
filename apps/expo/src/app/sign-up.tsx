import { useState } from "react";
import { Button, TextInput, View } from "react-native";

import { authClient } from "../utils/auth";

export default function App() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const response = await authClient.signUp.email({
      email,
      password,
      name,
    });

    console.log(response);
  };

  return (
    <View>
      <TextInput placeholder="Name" value={name} onChangeText={setName} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Sign Up" onPress={handleLogin} />
    </View>
  );
}
