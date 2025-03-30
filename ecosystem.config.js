module.exports = {
  apps: [{
    name: "football_back",
    script: "./dist/app.js", 
    env_production: {
      NODE_ENV: "production"
    }
  }]
};
