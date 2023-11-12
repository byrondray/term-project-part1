const path = require("path");
/*
 * Project: Milestone 1
 * File Name: main.js
 * Description:
 *
 * Created Date:
 * Author:
 *
 */

const { unzip, readDir, grayScale } = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "grayscaled");

unzip(zipFilePath, pathUnzipped)
  .then(() => readDir(pathUnzipped))
  .then((imgs) => {
    const promises = imgs.map((img) => {
      const outputFilename = path.basename(img);
      const outputPath = path.join(pathProcessed, outputFilename);
      grayScale(img, outputPath);
    });
    Promise.all(promises);
  })
  .catch((err) => console.log(err));
