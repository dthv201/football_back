import initApp from "./server";
import https from "https"
import fs from 'fs'
import path from "path";

const port = process.env.PORT;
const keyPath = path.join(__dirname, '..', 'client-key.pem');
const certPath = path.join(__dirname, '..', 'client-cert.pem');

initApp().then((app) => {
  if(process.env.NODE_ENV != "production"){
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}
else{
  const prop = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  }
  https.createServer(prop, app).listen(port);
  console.log(`HTTPS server is running on port ${port}`);
}

});