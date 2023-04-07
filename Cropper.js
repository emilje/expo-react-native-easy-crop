import React, { useEffect, useRef, useState } from "react";
import { View, Animated, PanResponder, Button, Easing, SafeAreaView } from "react-native";
import * as ImageManipulator from 'expo-image-manipulator';
import PropTypes from 'prop-types';
import { getCorrections, getScale, measureView } from "./functions";

const PADDING = 8;

const Cropper = ({ imageData, aspectRatio, handleCroppedImage, imageContainerStyle, borderRadius, backdropColor, header, footer }) => {
  const positionRef = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleRef = useRef(new Animated.Value(1)).current;
  const opacityRef = useRef(new Animated.Value(0)).current;
  const currentPositionRef = useRef({ x: 0, y: 0 });
  const currentScaleRef = useRef(1);
  const referenceDistanceRef = useRef();
  const anchorRef = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef();
  const scaleTranslateRef = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isPinch = useRef(false);
  const [cropperParent, setCropperParent] = useState({ x: 0, y: 0, width: 0, height: 0, isReady:false });
  const [headerHeight, setHeaderHeight] = useState(0);
  const onGrantValues = useRef({ x: 0, y: 0, scale: 1, isPinch: false });
  const pinchTranslateRef = useRef({x:0,y:0})
  const isAnimatingRef = useRef(false);

  // This listener fixes updating animated value when using useNativeDriver in animations. This seems to be an issue with react native.
  useEffect(() => {
    positionRef.addListener((value) => null);
    scaleRef.addListener((value) => null);

    return () => {
      positionRef.removeAllListeners();
      scaleRef.removeAllListeners();
    };
  }, [positionRef]);

  useEffect(() => {
    if (!cropperParent.isReady) {
      return;
    }

    const { width: newWidth, height: newHeight } = getScale(
      { width: imageData.width, height: imageData.height },
      { width: cropperParent.width, height: cropperParent.height }
    );

    setImageSize({ width: newWidth, height: newHeight });
    Animated.timing(opacityRef, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [cropperParent, imageData]);

  useEffect(() => {
    const { correctionX, correctionY } = getCorrections(
      { width: imageSize.width, height: imageSize.height },
      { x: positionRef.x._value, y: positionRef.y._value },
      { width: cropperParent.width, height: cropperParent.height }
    );

    if (correctionX || correctionY) {
      currentPositionRef.current = {
        x: positionRef.x._value + correctionX,
        y: positionRef.y._value + correctionY,
      };

      return Animated.spring(positionRef, {
        toValue: currentPositionRef.current,
        bounciness: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [imageSize]);

  const cropImage = async () => {
    const offsetXPercent = (positionRef.x._value * -1) / imageSize.width;
    const offsetYPercent = (positionRef.y._value * -1) / imageSize.height;
    const originX = imageData.width * offsetXPercent;
    const originY = imageData.height * offsetYPercent;
    const widthPercent = cropperParent.width / imageSize.width;
    const heightPercent = cropperParent.height / imageSize.height;
    const width = imageData.width * widthPercent;
    const height = imageData.height * heightPercent;
    const croppedImage = await ImageManipulator.manipulateAsync(imageData.uri, [
      { crop: { originX, originY, width, height } },
    ]);

    handleCroppedImage(croppedImage.uri);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => (isAnimatingRef.current ? false : true),
    onPanResponderGrant: (e, { numberActiveTouches }) => {
      onGrantValues.current.x = positionRef.x._value;
      onGrantValues.current.y = positionRef.y._value;
      pinchTranslateRef.current = { x: 0, y: 0 };
      if (numberActiveTouches === 2) {
        isPinch.current = true;
        onGrantValues.current.isPinch = true;

        const [touch1, touch2] = e.nativeEvent.touches;
        const distanceBetweenX = touch2.pageX - touch1.pageX;
        const distanceBetweenY = touch2.pageY - touch1.pageY;
        const distance = Math.sqrt(distanceBetweenX ** 2 + distanceBetweenY ** 2);

        const newAnchor = {
          x: (touch1.pageX + touch2.pageX) / 2 - cropperParent.x,
          y: (touch1.pageY + touch2.pageY) / 2 - cropperParent.y - headerHeight,
        };

        const centerXInitial = positionRef.x._value + imageSize.width / 2;
        const centerYInitial = positionRef.y._value + imageSize.height / 2;
        const containerToAnchorOffset = {
          x: newAnchor.x - centerXInitial,
          y: newAnchor.y - centerYInitial,
        };

        referenceDistanceRef.current = distance;
        scaleTranslateRef.setValue(containerToAnchorOffset);
        anchorRef.setValue(newAnchor);
      }
    },
    onPanResponderMove: (e, { dx, dy, numberActiveTouches }) => {
      if (numberActiveTouches === 2 && isPinch.current) {
        const [touch1, touch2] = e.nativeEvent.touches;
        const distanceBetweenX = touch2.pageX - touch1.pageX;
        const distanceBetweenY = touch2.pageY - touch1.pageY;
        const distance = Math.sqrt(distanceBetweenX ** 2 + distanceBetweenY ** 2);
        const newScale = currentScaleRef.current * (distance / referenceDistanceRef.current);
        const anchorOffsetX = (touch1.pageX + touch2.pageX) / 2 - anchorRef.x._value;
        const anchorOffsetY = (touch1.pageY + touch2.pageY) / 2 - anchorRef.y._value;

        positionRef.setValue({
          x: currentPositionRef.current.x + anchorOffsetX - cropperParent.x,
          y: currentPositionRef.current.y + anchorOffsetY - cropperParent.y - headerHeight,
        });
        scaleRef.setValue(newScale);
        return;
      }

      if (isPinch.current) {
        isPinch.current = false;
        pinchTranslateRef.current = { x: dx, y: dy };
        currentPositionRef.current = {x: positionRef.x._value, y: positionRef.y._value};
      }

      positionRef.setValue({
        x: currentPositionRef.current.x + dx - pinchTranslateRef.current.x,
        y: currentPositionRef.current.y + dy - pinchTranslateRef.current.y,
      });
    },
    onPanResponderRelease: async () => {
      if (onGrantValues.current.isPinch) {
        const { x, y, width, height, pageX, pageY } = await measureView(imageRef);

        if (width < cropperParent.width || height < cropperParent.height) {
          currentPositionRef.current = {x: onGrantValues.current.x, y: onGrantValues.current.y};
          isAnimatingRef.current = true;

          Animated.parallel([
            Animated.timing(positionRef, {
              toValue: currentPositionRef.current,
              duration: 300,
              easing: Easing.elastic(0),
              useNativeDriver: true,
            }),
            Animated.timing(scaleRef, {
              toValue: currentScaleRef.current,
              easing: Easing.elastic(0),
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => (isAnimatingRef.current = false));
          return;
        }

        const newPos = {x: pageX - cropperParent.x, y: pageY - cropperParent.y - headerHeight}
        positionRef.setValue(newPos);
        scaleRef.setValue(1);
        currentPositionRef.current = newPos;
        currentScaleRef.current = 1;
        isPinch.current = false;
        onGrantValues.current.isPinch = false;
        setImageSize({ width, height });
        return;
      }

      // Gap corrections
      const { correctionX, correctionY } = getCorrections(
        { width: imageSize.width, height: imageSize.height },
        { x: positionRef.x._value, y: positionRef.y._value },
        { width: cropperParent.width, height: cropperParent.height }
      );

      if (correctionX || correctionY) {
        currentPositionRef.current = {
          x: positionRef.x._value + correctionX,
          y: positionRef.y._value + correctionY,
        };

        return Animated.spring(positionRef, {
          toValue: currentPositionRef.current,
          bounciness: 0,
          useNativeDriver: true,
        }).start();
      }

      currentPositionRef.current = {
        x: positionRef.x._value,
        y: positionRef.y._value,
      };
      currentScaleRef.current = scaleRef._value;
    },
  });

  const renderHeader = () => {
    const handleLayout = (e) => {
      const { height } = e.nativeEvent.layout;
      setHeaderHeight(height);
    };

    if (header) {
      return header(handleLayout);
    }
  };

  const renderFooter = () => {
    if (footer) {
      return footer(cropImage);
    }

    return (
      <SafeAreaView>
        <Button onPress={cropImage} title="Crop" />
      </SafeAreaView>
    );
  };


  return (
    <View
      style={{
        flex: 1,
        width: "100%",
      }}
    >
      {renderHeader()}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: PADDING,
          backgroundColor:"black",
          ...imageContainerStyle,
        }}
      >
        <View
          onLayout={(e) => {
            const { x, y, width, height } = e.nativeEvent.layout;
            setCropperParent({ x, y, width, height, isReady: true });
          }}
          style={{
            width: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            aspectRatio,
            backgroundColor: backdropColor || "#111111",
            overflow: "hidden",
            borderRadius,
          }}
        >
          <Animated.Image
            {...panResponder.panHandlers}
            ref={imageRef}
            style={{
              resizeMode: "contain",
              width: imageSize.width,
              height: imageSize.height,
              opacity: opacityRef,
              transform: [
                { translateX: positionRef.x },
                { translateY: positionRef.y },
                { translateX: scaleTranslateRef.x },
                { translateY: scaleTranslateRef.y },
                { scale: scaleRef },
                { translateX: Animated.multiply(-1, scaleTranslateRef.x) },
                { translateY: Animated.multiply(-1, scaleTranslateRef.y) },
              ],
            }}
            source={{ uri: imageData.uri }}
          />
        </View>
      </View>
      {renderFooter()}
    </View>
  );
};

Cropper.propTypes = {
  imageData: PropTypes.shape({
    uri: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }),
  aspectRatio: PropTypes.number.isRequired,
  handleCroppedImage: PropTypes.func.isRequired,
  imageContainerStyle: PropTypes.object,
  backdropColor: PropTypes.string,
  borderRadius: PropTypes.number,
  footer: PropTypes.func,
  header: PropTypes.func,
};

export default Cropper;