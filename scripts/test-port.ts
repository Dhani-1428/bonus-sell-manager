/**
 * Test port connectivity with detailed output
 */
import * as net from 'net';

const hostname = 'foodsell.cluster-ctu4682g825l.eu-north-1.rds.amazonaws.com';
const port = 3306;

console.log(`Testing connection to ${hostname}:${port}...\n`);

const socket = new net.Socket();
const timeout = 10000; // 10 seconds

socket.setTimeout(timeout);

socket.once('connect', () => {
  console.log(`✅ SUCCESS! Port ${port} is open and accepting connections`);
  console.log(`   Local address: ${socket.localAddress}:${socket.localPort}`);
  console.log(`   Remote address: ${socket.remoteAddress}:${socket.remotePort}`);
  socket.destroy();
  process.exit(0);
});

socket.once('timeout', () => {
  console.log(`❌ TIMEOUT: Connection attempt timed out after ${timeout}ms`);
  console.log(`\nPossible issues:`);
  console.log(`1. Security group is blocking port ${port}`);
  console.log(`2. Your IP address is not whitelisted`);
  console.log(`3. RDS instance is still not publicly accessible`);
  console.log(`4. Firewall is blocking outbound connections`);
  socket.destroy();
  process.exit(1);
});

socket.once('error', (err: NodeJS.ErrnoException) => {
  console.log(`❌ ERROR: ${err.message}`);
  if (err.code === 'ECONNREFUSED') {
    console.log(`   Connection refused - Port might be closed or service not running`);
  } else if (err.code === 'EHOSTUNREACH') {
    console.log(`   Host unreachable - Network routing issue`);
  } else if (err.code === 'ENETUNREACH') {
    console.log(`   Network unreachable - Check your internet connection`);
  }
  socket.destroy();
  process.exit(1);
});

console.log(`Attempting to connect...`);
socket.connect(port, hostname);
