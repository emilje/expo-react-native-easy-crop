import { Text, View } from "react-native";
import Cropper from "./Cropper";

const ASPECT_RATIO = 10/16;
const BORDER_RADIUS = 8;

export default function App() {
  return (
    <Cropper
      imageData={imageData}
      aspectRatio={ASPECT_RATIO}
      handleCroppedImage={handleCroppedImage}
      // imageContainerStyle={{ padding: 8 }}
      // backdropColor={"black"}
      // borderRadius={BORDER_RADIUS}
      // header={(handleLayout) => (
      //   <View
      //     onLayout={handleLayout}
      //     style={{
      //       backgroundColor: "white",
      //       alignItems: "center",
      //       padding: 16,
      //     }}
      //   >
      //     <Text>Header Hello!!</Text>
      //   </View>
      // )}
      // footer={(cropImage) => (
      //   <SafeAreaView style={{ backgroundColor: "green" }}>
      //     <Button onPress={cropImage} title="Croppi" />
      //   </SafeAreaView>
      // )}
    />
  );
}
