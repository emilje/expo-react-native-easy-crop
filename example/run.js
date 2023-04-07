const { exec } = require("child_process");
const { existsSync } = require("fs");
const { exit } = require("process");

const wait = (time) => {
  return new Promise((res) => setTimeout(res, time));
};

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

  if (!existsSync("../expo-react-native-easy-crop-1.0.0.tgz")) {
    try {
      console.log("Creating tarball...");
      await createTarball();
      while (i !== 0) {
        if (existsSync("../expo-react-native-easy-crop-1.0.0.tgz")) {
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
      exec("npm run install-tarball", (err) => {
        if (err) {
          throw new Error("Something went wrong. Try again.");
        }
      });
    } catch (err) {
      console.warn(err.message);
      exit();
    }
  }

  console.log("Done!");
  exit();
};

runScript();
