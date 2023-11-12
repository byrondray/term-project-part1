/*
 * Project: Milestone 1
 * File Name: IOhandler.js
 * Description: Collection of functions for files input/output related operations
 *
 * Created Date:
 * Author:
 *
 */

const { pipeline } = require("stream"),
  { createReadStream, createWriteStream } = require("fs"),
  PNG = require("pngjs").PNG,
  fs = require("fs/promises"),
  AdmZip = require("adm-zip"),
  path = require("path");

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */

function readOrCreateDir(dirPath) {
  return fs.readdir(dirPath).catch((err) => {
    if (err.code === "ENOENT") {
      return fs.mkdir(dirPath, { recursive: true }).then(() => []);
    }
    throw err;
  });
}

const unzip = (pathIn, pathOut) => {
  return readOrCreateDir(pathOut)
    .then(() => {
      return new Promise((resolve, reject) => {
        try {
          const zip = new AdmZip(pathIn);
          zip.extractAllTo(pathOut, true);
          resolve();
        } catch (err) {
          console.error("An error occurred during extraction:", err);
          reject(err);
        }
      });
    })
    .catch((err) => {
      console.error("An error occurred:", err);
      throw err;
    });
};

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
const filterPngFiles = (files) => {
  return files.filter((file) => path.extname(file) === ".png");
};

const getFullPaths = (dir, files) => {
  return files.map((file) => path.join(dir, file));
};

const readDir = (dir) => {
  return fs
    .readdir(dir)
    .then(filterPngFiles)
    .then((pngFiles) => getFullPaths(dir, pngFiles));
};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */
function readImage(path) {
  return createReadStream(path);
}

function writeImage(png, pathOut) {
  return new Promise((resolve, reject) => {
    pipeline(png.pack(), createWriteStream(pathOut), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function convertToGrayscale(png) {
  return new Promise((resolve, reject) => {
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        let idx = (png.width * y + x) << 2;
        let red = png.data[idx];
        let green = png.data[idx + 1];
        let blue = png.data[idx + 2];
        let grayscale = Math.round((red + green + blue) / 3);
        png.data[idx] = grayscale;
        png.data[idx + 1] = grayscale;
        png.data[idx + 2] = grayscale;
      }
    }
    resolve(png);
  });
}

const grayScale = (pathIn, pathOut) => {
  return new Promise((resolve, reject) => {
    const readStream = readImage(pathIn);
    const pngStream = new PNG({});

    pngStream.once("parsed", function () {
      convertToGrayscale(this)
        .then((grayscaleData) => {
          return writeImage(grayscaleData, pathOut);
        })
        .then(resolve)
        .catch(reject);
    });

    pipeline(readStream, pngStream, (err) => {
      if (err) {
        reject(err);
      }
    });
  });
};

module.exports = {
  unzip,
  readDir,
  grayScale,
};
