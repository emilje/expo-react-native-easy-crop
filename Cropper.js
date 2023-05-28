import React, { useEffect, useRef, useState } from "react";
import { View, Animated, PanResponder, Button, Easing, SafeAreaView } from "react-native";
import * as ImageManipulator from 'expo-image-manipulator';
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
  const isAnimatingRef = useRef(false);
  const isGranted = useRef(false);
  const shouldApplyCorrections = useRef(true);
  const lastValid = useRef({ x:0, y:0, width:0, height:0, centerX:0, centerY:0 });

  useEffect(() => {
    if (!cropperParent.isReady) {
      return;
    }

    const { width: newWidth, height: newHeight } = getScale(
      { width: imageData.width, height: imageData.height },
      { width: cropperParent.width, height: cropperParent.height }
    );
    
    lastValid.current = {
      x:0,
      y:0,
      width: newWidth,
      height: newHeight,
      centerX: imageSize.width / 2,
      centerY: imageSize.height / 2,
    };

    const timer = setTimeout(() => {
      setImageSize({ width: newWidth, height: newHeight });
      Animated.timing(opacityRef, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }, 100)

    return () => {
      clearTimeout(timer)
    }
   
  }, [cropperParent, imageData]);

  useEffect(() => {
    if (shouldApplyCorrections.current && (imageSize.width < cropperParent.width || imageSize.height < cropperParent.height)) { 
      const centerX = positionRef.x._value + imageSize.width/2
      const centerY = positionRef.y._value + imageSize.height/2
      const offsetX = lastValid.current.centerX - centerX;
      const offsetY = lastValid.current.centerY - centerY;
      currentPositionRef.current = {x: positionRef.x._value + offsetX, y: positionRef.y._value + offsetY}
      currentScaleRef.current = lastValid.current.width/imageSize.width

      Animated.parallel([
        Animated.timing(positionRef, {
          toValue: currentPositionRef.current,
          duration: 300,
          easing: Easing.elastic(0),
          useNativeDriver: false,
        }),
        Animated.timing(scaleRef, {
          toValue: currentScaleRef.current,
          easing: Easing.elastic(0),
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        shouldApplyCorrections.current = false;
        currentScaleRef.current = 1;
        currentPositionRef.current = {x:lastValid.current.x,y:lastValid.current.y};
        positionRef.setValue(currentPositionRef.current);
        scaleRef.setValue(currentScaleRef.current);
        setImageSize({ width: lastValid.current.width, height: lastValid.current.height });
        });
      return;
    }

    isAnimatingRef.current = false;
    if(!shouldApplyCorrections.current) {
      shouldApplyCorrections.current =  true;
      return;
    }

    lastValid.current = {
      x:positionRef.x._value,
      y:positionRef.y._value,
      width: imageSize.width,
      height: imageSize.height,
      centerX: positionRef.x._value + imageSize.width / 2,
      centerY: positionRef.y._value + imageSize.height / 2,
    };
    
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

      lastValid.current.x = currentPositionRef.current.x;
      lastValid.current.y = currentPositionRef.current.y;
      lastValid.current.centerX = currentPositionRef.current.x + imageSize.width/2
      lastValid.current.centerY = currentPositionRef.current.y + imageSize.height/2

      Animated.spring(positionRef, {
        toValue: currentPositionRef.current,
        bounciness: 0,
        useNativeDriver: false,
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
    onPanResponderMove: async (e, { dx, dy, numberActiveTouches }) => {
      if(isAnimatingRef.current) {
        return;
      }
      
      if(!isGranted.current) {
        currentPositionRef.current= {x:positionRef.x._value, y:positionRef.y._value}
        isPinch.current = false;
        if (numberActiveTouches === 2) {
          isPinch.current = true;
  
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
        isGranted.current = true;
      }

      if (numberActiveTouches === 2) {
        if (!isPinch.current) {
          isGranted.current = false;
          return;
        }

        const [touch1, touch2] = e.nativeEvent.touches;
        const distanceBetweenX = touch2.pageX - touch1.pageX;
        const distanceBetweenY = touch2.pageY - touch1.pageY;
        const distance = Math.sqrt(
          distanceBetweenX ** 2 + distanceBetweenY ** 2
        );
        let newScale = currentScaleRef.current * (distance / referenceDistanceRef.current);
        const newWidth = imageSize.width*newScale;

        if (newWidth < cropperParent.width * 0.8) {
          newScale = (0.8 * cropperParent.width) / imageSize.width;
        }

        const anchorOffsetX = (touch1.pageX + touch2.pageX) / 2 - anchorRef.x._value;
        const anchorOffsetY = (touch1.pageY + touch2.pageY) / 2 - anchorRef.y._value;
        positionRef.setValue({
          x: currentPositionRef.current.x + anchorOffsetX - cropperParent.x,
          y: currentPositionRef.current.y +anchorOffsetY - cropperParent.y - headerHeight });
        scaleRef.setValue(newScale);
        return;
      }

      if (isPinch.current) {
        isAnimatingRef.current = true;
        isGranted.current = false;
        shouldApplyCorrections.current = false;
        const { x, y, width, height, pageX, pageY } = await measureView(imageRef);
        const newPos = {x: pageX - cropperParent.x, y: pageY - cropperParent.y - headerHeight}
        positionRef.setValue(newPos);
        currentPositionRef.current = newPos;
        scaleRef.setValue(1);
        currentScaleRef.current = 1;
        setImageSize({ width, height });
        return;
      }

      positionRef.setValue({
        x: currentPositionRef.current.x + dx,
        y: currentPositionRef.current.y + dy
      });
    
    },
    onPanResponderRelease: async () => {
      isAnimatingRef.current = true;
      isGranted.current = false;
      const newWidth = imageSize.width*scaleRef._value;
      const newHeight = imageSize.height*scaleRef._value;
      const { x, y, width, height, pageX, pageY } = await measureView(imageRef);
      const newPos = {x: pageX - cropperParent.x, y: pageY - cropperParent.y - headerHeight};
      positionRef.setValue(newPos);
      scaleRef.setValue(1);
      scaleTranslateRef.setValue({x:0,y:0})
      currentPositionRef.current = newPos;
      currentScaleRef.current = 1;
      setImageSize({ width: newWidth, height: newHeight });
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

export default Cropper;