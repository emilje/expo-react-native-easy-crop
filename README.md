# expo-react-native-easy-crop
### *Cropping made easy!*
</br>

https://user-images.githubusercontent.com/71398812/230671678-03cc836a-6460-4769-bfcc-2d66726105a3.mp4

</br>
The Cropper comes with some basic ui, but can be modified and adjusted through props to get something closer to what you are looking for. For example inserting a header and a custom button:

</br>
</br>

![CustomStyling](https://user-images.githubusercontent.com/71398812/230675380-c060aa65-9f79-4ca0-ac51-01fb67527463.png)

## Installation and usage

Run **npm install expo-react-native-easy-crop** and then `import { Cropper } from "expo-react-native-easy-crop"`.
You can then render the component:

    <Cropper
      imageData={imageData}
      aspectRatio={16/10}
      handleCroppedImage={handleCroppedImage}
    />
    
  Check below for required props and their explanation. Make sure to check the example project as well to get the right idea!

## Run example
Clone the project, enter example directory **cd ./example** and then run **npm install** followed by **npm run install-package**. The second command will run a node script which will create a tarball and install it into the example directory. 
<br/>
If that script should fail you can try creating the tarball using **npm run create-tarball** followed by **npm i ../*name of tarball***. That should hopefully create the tarball in the root directory, and then install it inside the example directory. Alternatively, you could just run **npm install expo-react-native-easy-crop** in the example directory.
<br/>
Once the package is installed, you can start the project with **npm start**


## Props

|     Name      |Description                    |          Required          |
|---------------|-------------------------------|----------------------------|
|imageData | `{uri, width, height} Object containing uncropped image uri and image dimensions.` | Yes |
|aspectRatio | `Number` | Yes |
|handleCroppedImage | `(croppedUri) => Function that receives the cropped image uri`| Yes |
|imageContainerStyle | `Object for styling the cropper. Adjust paddings, position or background color here.` | No |
|backdropColor |`String. Color of the backdrop` | No |
|borderRadius | `Number` | No |
|header | `(handleLayout) => Function that renders the header. Make sure to pass handleLayout to the onLayout prop of the component you want to render. ` | No |
|footer | `(cropImage) => Function that renders the footer. Make sure to pass cropImage to the onPress prop of the element that will trigger cropping.` | No |
