//$ node script/populate.js

//used to resolve the models path
const path = require('path');
//importing this to detect faces
const GifFaces = require('../build/lib/GifFaces').default;
//model cruds
const Source = require('../build/lib/Source').default;
const Meme = require('../build/lib/MemeGenerator').default;

//dot env setup
require('dotenv').config();

const models = path.resolve(__dirname, '../models');

async function main() {
  //gif faces setup  
  await GifFaces.loadModels(models);

  let start = 0
  const range = 100;

  while (true) {
    //get sources
    const sources = await Source.findManyWithNoData(start, range)
    //if no sources, done
    if (!sources.length) break
    //detect faces for each source
    for (const source of sources) {
      console.log(`Detecting faces for ${source.id} - ${source.url}`)
      await Meme.detect(source)
    }
    //next set
    start += range
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})