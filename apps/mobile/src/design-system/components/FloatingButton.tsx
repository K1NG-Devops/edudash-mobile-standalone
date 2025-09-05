import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type FloatingButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number; // icon size
  backgroundColor?: string;
  iconColor?: string;
  testID?: string;
  // Positioning overrides
  bottom?: number;
  right?: number;
  // Visual size of the button (width/height)
  buttonSize?: number;
  // Style overrides
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
};

function FloatingButton({ 
  onPress,
  accessibilityLabel = "Open chat",
  accessibilityHint = "Opens the chat interface for assistance",
  icon = "chatbubble-ellipses",
  size = 28,
  backgroundColor = "#25D366", // WhatsApp green
  iconColor = "white",
  testID = "floating-button",
  bottom,
  right,
  buttonSize = 60,
  containerStyle,
  buttonStyle,
}: FloatingButtonProps) {
  const containerPosStyle: StyleProp<ViewStyle> = (bottom != null || right != null)
    ? { bottom: bottom ?? 20, right: right ?? 20 }
    : {};

  return (
    <View style={[styles.container, containerPosStyle, containerStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
          buttonStyle,
        ]}
        activeOpacity={0.8}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Improve touch area
      >
        <Ionicons name={icon} size={size} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000, // Ensure it stays on top
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    // Ensure minimum touch target size (44x44 is covered by hitSlop)
    minWidth: 44,
    minHeight: 44,
  },
});

// Export both named and default
export { FloatingButton };
export default FloatingButton;
