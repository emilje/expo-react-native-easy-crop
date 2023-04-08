const { exec } = require("child_process");
const { existsSync } = require("fs");
const { exit } = require("process");
const {version} = require("../package.json")

const wait = (time) => {
  return new Promise((res) => setTimeout(res, time));
};

const tarballName =  `expo-react-native-easy-crop-${version}.tgz`

const createTarball = async () => {
  return new Promise((res, rej) => {
    exec("npm run create-tarball", (err) => {
      if (err) {
        rej(err);
        return;
      }

      res();
    });
  });
};

const runScript = async () => {
  let i = 5;
  let tarballLocated = false;

  try {
    console.log("Creating tarball...");
    await createTarball();
    while (i !== 0) {
      if (existsSync("../" + tarballName)) {
        console.log("Tarball found.");
        tarballLocated = true;
        break;
      } else {
        await wait(500);
        console.log("Tarball not found. Looking again...");
        i--;
      }
    }

    if (!tarballLocated) {
      throw new Error("Could not locate tarball. Try again.");
    }

    console.log("Installing tarball...");
    exec("npm install ../" + tarballName, (err) => {
      if (err) {
        throw new Error("Something went wrong. Try again.");
      }
      console.log("Done!");
      exit();
    });
  } catch (err) {
    console.warn(err.message);
    exit();
  }
};

runScript();
