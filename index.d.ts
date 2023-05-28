import React from "react";
import { FlexStyle } from "react-native/types";

declare module "expo-react-native-easy-crop" {
  type ImageDataType = {
    uri: string;
    width: number;
    height: number;
  };

  type ImageContainerStyleType = {
    justifyContent?: FlexStyle["justifyContent"];
    alignItems?: FlexStyle["alignItems"];
    backgroundColor?: string;
    padding?: number;
  };

  type CropperProps = {
    imageData: ImageDataType;
    aspectRatio: number;
    handleCroppedImage: (croppedUri: string) => void;
    imageContainerStyle?: ImageContainerStyleType;
    backdropColor?: string;
    borderRadius?: number;
    footer?: (cropImage: () => void) => React.JSX.Element;
    header?: (handleLayout: () => void) => React.JSX.Element;
  };

  const Cropper: React.FunctionComponent<CropperProps>;
}
