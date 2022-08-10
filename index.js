const SOURCE_BUCKET = "source-for-zipping";
const OUTPUT_BUCKET = "destination-for-zipping";

const aws = require("aws-sdk");
const archiver = require("archiver");
const stream = require("stream");

const s3 = new aws.S3({ apiVersion: "2006-03-01" });

exports.handler = async (event, context) => {
  try {
    return await driver();
  } catch (err) {
    console.log(err);
    throw new Error("error occured");
  }
};
async function driver() {
  return new Promise(async (resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    try {
      var params = {
        Bucket: SOURCE_BUCKET,
        //Delimiter: '/',
        //Prefix: '/'
      };

      const data = await s3.listObjects(params).promise();
      const keys = data.Contents.map((e) => e.Key);
      var counter = 0;
      keys.forEach(async (key, i) => {
        params = {
          Bucket: SOURCE_BUCKET,
          Key: key,
        };
        let { Body } = await s3.getObject(params).promise();
        archive.append(Body, { name: key });
        if (Body && ++counter == keys.length) {
          console.log("lkol cbn");
          archive.finalize();
        }
      });
    } catch (e) {
      console.log(e);
    }
    uploadFromStream().on("data", () => {
      console.log("fama partie cbn");
    });
    archive.pipe(uploadFromStream());

    function uploadFromStream() {
      var pass = new stream.PassThrough();

      var params = {
        Bucket: OUTPUT_BUCKET,
        Key: new Date() + ".zip",
        Body: pass,
      };
      s3.upload(params, function (err, data) {
        if (err) return reject(err);
        console.log(err, data);
        resolve(data);
      });

      return pass;
    }
  });
}
