const path = require("path");
/*
 * Project: Milestone 1
 * File Name: main.js
 * Description: This program unzips a folder, takes only the images and then applies a filter to those images.
 *
 * Created Date: November 2, 2023
 * Author: Byron Dray
 *
 */

const { unzip, readDir, chooseFilter } = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "grayscaled");

unzip(zipFilePath, pathUnzipped)
  .then(() => readDir(pathUnzipped))
  .then((imgs) => {
    const promises = imgs.map((img) => {
      chooseFilter(img, "sepia"); // choose sepia or grayscale
    });
    Promise.all(promises);
  })
  .catch((err) => console.log(err));
