const GAP_DIRECTIONS = {
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right",
};

export const getScale = (imageDimensions, cropperDimensions) => {
  const { width: imageWidth, height: imageHeight } = imageDimensions;
  const { width: cropperWidth, height: cropperHeight } = cropperDimensions;

  const scaleToWidth = cropperWidth / imageWidth;
  const scaleToHeight = cropperHeight / imageHeight;
  let scale = 1;

  if (imageHeight * scaleToWidth >= cropperHeight) {
    scale = scaleToWidth;
  }

  if (imageWidth * scaleToHeight >= cropperWidth) {
    scale = scaleToHeight;
  }

  return {
    width: Math.ceil(imageWidth * scale),
    height: Math.ceil(imageHeight * scale),
  };
};

export const getCorrections = (
  imageData,
  positionData,
  cropperData
) => {
  const visibleWidth = imageData.width + positionData.x;
  const visibleHeight = imageData.height + positionData.y;
  const gaps = [
    { direction: GAP_DIRECTIONS.LEFT, value: positionData.x },
    {
      direction: GAP_DIRECTIONS.RIGHT,
      value: cropperData.width - visibleWidth,
    },
    { direction: GAP_DIRECTIONS.TOP, value: positionData.y },
    {
      direction: GAP_DIRECTIONS.BOTTOM,
      value: cropperData.height - visibleHeight,
    },
  ];

  const gapsForCorrection = gaps.filter((gap) => gap.value > 0);
  let correctionX = 0;
  let correctionY = 0;

  if (gapsForCorrection.length > 0) {
    gapsForCorrection.forEach((gap) => {
      switch (gap.direction) {
        case GAP_DIRECTIONS.TOP:
          correctionY = -gap.value;
          break;
        case GAP_DIRECTIONS.BOTTOM:
          correctionY = gap.value;
          break;
        case GAP_DIRECTIONS.LEFT:
          correctionX = -gap.value;
          break;
        case GAP_DIRECTIONS.RIGHT:
          correctionX = gap.value;
      }
    });
  }

  return { correctionX, correctionY };
};

export const measureView = async (viewRef) => {
  return new Promise((res) =>
    viewRef.current.measure((x, y, width, height, pageX, pageY) => {
      res({ x, y, width, height, pageX, pageY });
    })
  );
};
