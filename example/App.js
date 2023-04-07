import { Button, Image, Pressable, SafeAreaView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {Cropper} from "expo-react-native-easy-crop";

const ASPECT_RATIO = 10/16;
const BORDER_RADIUS = 8;

export default function App() {
  const [isCropping, setIsCropping] = useState(false);
  const [imageData, setImageData] = useState("");
  const [croppedImage, setCroppedImage] = useState("");

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const [imageData] = result.assets;
      setImageData({
        uri: imageData.uri,
        width: imageData.width,
        height: imageData.height,
      });
      setIsCropping(true);
    }
  };

  if (isCropping) {
    const handleCroppedImage = (croppedUri) => {
      setCroppedImage(croppedUri);
      setIsCropping(false);
    };

    return (
      <Cropper
        imageData={imageData}
        aspectRatio={ASPECT_RATIO}
        handleCroppedImage={handleCroppedImage}
        // imageContainerStyle={{ padding: 8 }}
        // backdropColor={"black"}
        borderRadius={BORDER_RADIUS}
        header={(handleLayout) => (
          <View
            onLayout={handleLayout}
            style={{
              backgroundColor: "#111111",
              alignItems: "center",
              padding: 16,
            }}
          >
            <Text style={{ color: "#fafafa" }}>Custom header.</Text>
            <Text style={{ color: "#fafafa", fontWeight: "100" }}>
              Some more random text.
            </Text>
          </View>
        )}
        footer={(cropImage) => (
          <SafeAreaView
            style={{
              padding: 24,
              backgroundColor: "black",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={cropImage}
              style={{
                backgroundColor: "#111111",
                padding: 16,
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <Text style={{ color: "#fafafa" }}>CUSTOM CROP BUTTON</Text>
            </Pressable>
          </SafeAreaView>
        )}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center", padding:8 }}>
        <View
          style={{
            width: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            aspectRatio: ASPECT_RATIO,
            alignSelf: "center",
            backgroundColor: "lightgrey",
            borderRadius:BORDER_RADIUS,
            overflow:"hidden"
          }}
        >
          <Image
            style={{ flex: 1 }}
            source={{ uri: croppedImage ? croppedImage : null }}
          />
        </View>
      </View>
      <Button onPress={pickImage} title="Pick Image" />
    </SafeAreaView>
  );
}
