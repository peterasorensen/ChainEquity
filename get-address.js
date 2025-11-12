// Simple script to derive Ethereum address from private key
const crypto = require('crypto');

function privateKeyToAddress(privateKey) {
  // Remove 0x prefix if present
  const pk = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // Use Node.js built-in crypto for secp256k1
  const { createECDH } = crypto;
  const ecdh = createECDH('secp256k1');
  ecdh.setPrivateKey(Buffer.from(pk, 'hex'));

  // Get uncompressed public key (65 bytes: 0x04 + 32 bytes X + 32 bytes Y)
  const publicKey = ecdh.getPublicKey('hex', 'uncompressed');

  // Remove the '04' prefix and take last 64 bytes
  const publicKeyBytes = publicKey.slice(2);

  // Keccak256 hash
  const hash = crypto.createHash('sha3-256').update(Buffer.from(publicKeyBytes, 'hex')).digest('hex');

  // Take last 20 bytes (40 hex chars) and add 0x prefix
  const address = '0x' + hash.slice(-40);

  // Checksum the address
  return toChecksumAddress(address);
}

function toChecksumAddress(address) {
  const addr = address.toLowerCase().replace('0x', '');
  const hash = crypto.createHash('sha3-256').update(addr).digest('hex');

  let checksumAddress = '0x';
  for (let i = 0; i < addr.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      checksumAddress += addr[i].toUpperCase();
    } else {
      checksumAddress += addr[i];
    }
  }

  return checksumAddress;
}

// Your private key from .env
const privateKey = '0x250c5eea6fd5be9664630401c98f75f998629f63983499ce43d2d6385336e471';

try {
  const address = privateKeyToAddress(privateKey);

  console.log('\n=================================');
  console.log('WALLET ADDRESS INFORMATION');
  console.log('=================================');
  console.log('Private Key:', privateKey);
  console.log('Address:', address);
  console.log('=================================\n');
} catch (error) {
  console.error('Error deriving address:', error.message);
}
