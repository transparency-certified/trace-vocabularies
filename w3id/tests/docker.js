// Manages the local Apache Docker container for testing .htaccess rules.
//
// Usage:
//   node docker.js start    — start container, returns when ready
//   node docker.js stop     — stop and remove container

const { execSync } = require("child_process");
const path = require("path");

const CONTAINER = "w3id-trace-test";
const PORT = 8080;
const HTACCESS = path.resolve(__dirname, "..", ".htaccess");

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8", stdio: "pipe" }).trim();
}

function isRunning() {
  try {
    const state = run(`docker inspect -f "{{.State.Running}}" ${CONTAINER}`);
    return state === "true";
  } catch {
    return false;
  }
}

function start() {
  if (isRunning()) {
    console.log(`Container ${CONTAINER} already running on port ${PORT}`);
    return;
  }

  // Clean up stopped container if it exists
  try { run(`docker rm ${CONTAINER}`); } catch {}

  const setupCmds = [
    `docker run -d --name ${CONTAINER} -p ${PORT}:80 httpd:2.4`,

    // Enable mod_rewrite and AllowOverride
    `docker exec ${CONTAINER} sh -c "sed -i 's/#LoadModule rewrite_module/LoadModule rewrite_module/' /usr/local/apache2/conf/httpd.conf"`,
    `docker exec ${CONTAINER} sh -c "sed -i 's/AllowOverride None/AllowOverride All/g' /usr/local/apache2/conf/httpd.conf"`,

    // Create the trace directory and copy .htaccess
    `docker exec ${CONTAINER} mkdir -p /usr/local/apache2/htdocs/trace`,
    `docker cp "${HTACCESS}" ${CONTAINER}:/usr/local/apache2/htdocs/trace/.htaccess`,

    // Restart Apache to pick up config changes
    `docker exec ${CONTAINER} httpd -k restart`,
  ];

  for (const cmd of setupCmds) {
    run(cmd);
  }

  // Wait for Apache to be ready
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      run(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/`);
      console.log(`Container ${CONTAINER} ready on port ${PORT}`);
      return;
    } catch {
      run("sleep 1");
    }
  }
  throw new Error("Apache did not start in time");
}

function stop() {
  try {
    run(`docker stop ${CONTAINER}`);
    run(`docker rm ${CONTAINER}`);
    console.log(`Container ${CONTAINER} stopped and removed`);
  } catch {
    console.log(`Container ${CONTAINER} not running`);
  }
}

const action = process.argv[2];
if (action === "start") start();
else if (action === "stop") stop();
else console.error("Usage: node docker.js [start|stop]");
